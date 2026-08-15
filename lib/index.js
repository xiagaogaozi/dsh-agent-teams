/**
 * AgentTeams for DeepSeek Harness.
 *
 * A host-plane plugin that registers the `agent_teams_*` tools and one usage
 * section into the global system prompt. After installation any session can
 * run multi-agent teamwork through natural language (e.g. "use AgentTeams to research X"):
 * the model creates a team (it becomes the captain), spawns members as
 * durable continuable subagents, breaks the goal into tasks with
 * dependencies, wakes members with messages, relays reports, and collects
 * results.
 *
 * Installation (bundle): `dsh plugin --profile <name> add @nanmicoder/dsh-agent-teams`
 * (or a local path). The bundle patch mounts this plugin row into the host
 * composition; the tools register into the shared `tools` registry and the
 * usage section into the global system prompt, so the plugin needs no realm.
 *
 * @module dsh-agent-teams
 */
import z from '@deepseek-ai/schemastery';
import { registerAgentTeamsTools } from "./tools.js";
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectArchivedTeamsActivity, collectTeamsActivity } from "./snapshot.js";
import { PROFILES_NS, PROFILES_SCHEMA, renderProfileDirectory, snapshotProfiles, } from "./profiles.js";
/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'];
/** Workspace registry service key candidates, newest first. */
const WORKSPACE_KEYS = ['workspaceRegistry', 'workspace'];
/** Same-origin settings-page endpoint for the member-profile library. */
const PROFILES_ROUTE = '/plugins/dsh-agent-teams/profiles';
/** Send one JSON response with the profile API's no-cache policy. */
function writeJson(res, status, value) {
    res.writeHead(status, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
    });
    res.end(JSON.stringify(value));
}
/** Read one small JSON request body, rejecting malformed or oversized input. */
async function readJson(req) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > 256 * 1024)
            throw new Error('request body too large');
        chunks.push(bytes);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    if (text === '')
        return undefined;
    return JSON.parse(text);
}
/** Whether one decoded JSON value is an object with an array `profiles` field. */
function profilesFrom(value) {
    if (typeof value !== 'object' || value === null)
        return undefined;
    const profiles = value.profiles;
    return Array.isArray(profiles) ? profiles : undefined;
}
export const name = 'agent-teams';
export const inject = ['tools', 'subagents', 'systemPrompt', 'agents', 'agentPresets', 'settings'];
export const Config = z.object({
    stateDir: z.string().default('.agent-teams'),
    memberProvider: z.string().default('spawn'),
    memberModel: z.string(),
    memberMaxDepth: z.natural().default(1),
    maxMembers: z.natural().min(1).default(8),
    promptSectionOrder: z.natural().default(117),
    memberPreset: z.string(),
});
/** The model-facing usage policy: when and how to drive AgentTeams. */
function usageSectionText(toolNames) {
    return `When the user asks to run something with AgentTeams (e.g. "use AgentTeams to do X"), you are the captain of a multi-agent team. Follow this protocol:
1. Call agent_teams_create with a team name and the goal as description. You become the captain and may lead one team at a time.
2. Call agent_teams_add_member once per role the goal needs (researcher, engineer, reviewer, ...). Members are durable subagents: they wait for your messages, then work a full turn.
3. Break the goal into tasks with agent_teams_create_task; wire dependencies between tasks (a task is claimable only when its dependencies are completed). Assign each task to a member when it fits a role.
4. Dispatch work: claim each assigned task (agent_teams_claim_task with assignee) and wake the member with agent_teams_send_message naming its task id and instructions. One task per message keeps turns focused.
5. Poll agent_teams_status until members are idle; relay member-to-member messages (agent_teams_send_message with from=<sender>) and collect completed tasks' outputs. If a member reports a blocker, reassign the task or adjust the plan.
6. Present the team's results to the user, then agent_teams_delete the team unless the user wants to keep working with it.

Tools: ${toolNames}`;
}
export function apply(ctx, config) {
    // Member-profile library: persisted through the settings service, edited on
    // the 「团队」 settings page (client), surfaced to the captain through a
    // prompt variable, and applied by add_member(template=...).
    const profileScope = ctx.settings.register(PROFILES_NS, PROFILES_SCHEMA);
    const loadProfiles = () => {
        const value = profileScope.get();
        return Array.isArray(value?.profiles) ? value.profiles : [];
    };
    ctx.systemPrompt.variable('agent_teams_profiles', () => renderProfileDirectory(loadProfiles()));
    ctx.systemPrompt.section({
        name: 'agent-teams:profiles',
        order: (config.promptSectionOrder ?? 117) + 0.5,
        text: '设置页「团队」维护了成员模板库，可用于按模板快速拉成员：\n{{agent_teams_profiles}}',
    });
    const resolved = {
        stateDir: config.stateDir ?? '.agent-teams',
        memberProvider: config.memberProvider ?? 'spawn',
        memberModel: config.memberModel,
        memberMaxDepth: config.memberMaxDepth ?? 1,
        maxMembers: config.maxMembers ?? 8,
        memberPreset: config.memberPreset,
        loadProfiles,
    };
    // Provider registration is a sibling plugin's effect (`subagent-spawn` /
    // `subagent-fork` rows), which can land after this mount under the Loader's
    // concurrent activation — so capability validation happens at the first
    // member spawn (`spawnMember`), the earliest point the provider list is
    // settled, rather than here.
    const toolNames = [
        'agent_teams_create',
        'agent_teams_add_member',
        'agent_teams_remove_member',
        'agent_teams_create_task',
        'agent_teams_claim_task',
        'agent_teams_update_task',
        'agent_teams_send_message',
        'agent_teams_status',
        'agent_teams_delete',
    ].join(', ');
    ctx.systemPrompt.section({
        name: 'agent-teams:usage',
        order: config.promptSectionOrder ?? 117,
        text: usageSectionText(toolNames),
    });
    registerAgentTeamsTools(ctx, resolved);
    // The activity panel data/artwork routes need the Web server and the
    // workspace registry, which headless profiles do not mount; under
    // concurrent activation they may also bind after this plugin. Register the
    // routes lazily: try now, then on each service binding event. In a webless
    // profile the plugin stays tool-only and never blocks boot.
    let webRegistered = false;
    const registerWebSurface = () => {
        if (webRegistered)
            return;
        const webServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1]));
        const workspaceRegistry = (ctx.get(WORKSPACE_KEYS[0]) ?? ctx.get(WORKSPACE_KEYS[1]));
        if (webServer === undefined || workspaceRegistry === undefined)
            return;
        webRegistered = true;
        // The package-private `harness.handle()` bridge exists only in the
        // dynamic-code VM, not in an ordinary installed Cordis package. Keep the
        // settings page in this package's regular host/client plane instead.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: PROFILES_ROUTE,
            handler: async (req, res) => {
                if (req.method === 'GET') {
                    writeJson(res, 200, await snapshotProfiles(ctx, loadProfiles()));
                    return;
                }
                if (req.method !== 'POST') {
                    res.writeHead(405, { allow: 'GET, POST' });
                    res.end();
                    return;
                }
                let profiles;
                try {
                    profiles = profilesFrom(await readJson(req));
                }
                catch {
                    writeJson(res, 400, { ok: false, error: 'invalid JSON body' });
                    return;
                }
                if (profiles === undefined) {
                    writeJson(res, 400, { ok: false, error: 'profiles must be an array' });
                    return;
                }
                await profileScope.replace({ profiles });
                writeJson(res, 200, { ok: true, count: profiles.length });
            },
        }), 'agent-teams: profiles route');
        // Activity panel data route: the browser floater polls this for team
        // snapshots (disk truth + live subagent activity). Mirrors the Claude
        // Code desktop watcher's server-side snapshot pattern.
        ctx.effect(() => webServer.register({
            kind: 'exact',
            path: '/plugins/dsh-agent-teams/state',
            handler: async (req, res) => {
                const url = new URL(req.url ?? '/', 'http://x');
                const roots = workspaceRegistry.list().map((workspace) => ({
                    workspace: workspace.title,
                    stateRoot: join(workspace.path, resolved.stateDir),
                }));
                // ?archived=1 serves teams moved to archive/ (post-delete review).
                const snapshots = url.searchParams.get('archived') === '1'
                    ? await collectArchivedTeamsActivity(ctx, roots)
                    : await collectTeamsActivity(ctx, roots);
                const body = JSON.stringify({ teams: snapshots });
                res.writeHead(200, {
                    'content-type': 'application/json; charset=utf-8',
                    'cache-control': 'no-store',
                });
                res.end(body);
            },
        }), 'agent-teams: activity route');
        // Whale mascot artwork: serve the packaged role/action images to the
        // activity panel. An explicit allowlist guards the route (no path
        // traversal); the images ship with the bundle (files: assets/).
        const artDir = fileURLToPath(new URL('../assets/agent-teams/', import.meta.url));
        const ART_ALLOWLIST = new Set([
            'team-lead.png', 'researcher.png', 'engineer.png', 'designer.png',
            'qa-engineer.png', 'security-reviewer.png', 'data-analyst.png',
            'docs-coordinator.png', 'action-working.png', 'action-thinking.png',
            'action-reporting.png', 'action-celebrating.png', 'action-sleeping.png',
            'action-sending.png',
        ]);
        ctx.effect(() => webServer.register({
            kind: 'prefix',
            path: '/plugins/dsh-agent-teams/assets',
            handler: async (req, res) => {
                let name;
                try {
                    name = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname.split('/').pop() ?? '');
                }
                catch {
                    // Malformed percent-encoding: treat as an unknown asset, not a 400.
                    res.writeHead(404);
                    res.end();
                    return;
                }
                if (!ART_ALLOWLIST.has(name)) {
                    res.writeHead(404);
                    res.end();
                    return;
                }
                try {
                    const data = await readFile(join(artDir, name));
                    res.writeHead(200, {
                        'content-type': 'image/png',
                        'cache-control': 'public, max-age=86400',
                    });
                    res.end(data);
                }
                catch (error) {
                    ctx.logger.warn(`agent-teams: artwork read failed for ${name}: ${String(error)}`);
                    res.writeHead(404);
                    res.end();
                }
            },
        }), 'agent-teams: artwork route');
    };
    registerWebSurface();
    ctx.on('internal/service', (name) => {
        if (WEB_SERVER_KEYS.includes(name)
            || WORKSPACE_KEYS.includes(name)) {
            registerWebSurface();
        }
    });
}
