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

import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Declaration merge only: makes ctx.subagents and ctx.systemPrompt visible.
import type {} from '@deepseek-ai/dsh-subagent'
import type {} from '@deepseek-ai/dsh-system-prompt'
// Declaration merge only: makes ctx.settings visible.
import type {} from '@deepseek-ai/dsh-settings'
import type { WorkspaceRegistry } from '@deepseek-ai/dsh-workspace'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { registerAgentTeamsTools, type ToolsConfig } from './tools.ts'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectArchivedTeamsActivity, collectTeamsActivity } from './snapshot.ts'
import {
  PROFILES_NS,
  PROFILES_SCHEMA,
  renderProfileDirectory,
  snapshotProfiles,
  type MemberProfile,
} from './profiles.ts'

/**
 * Structural slice of the web server service, compatible with both the
 * published `dsh-host-webserver@0.0.1-rc.1` (`ctx.httpServer` /
 * `HttpServerService`) and the renamed `webServer` / `WebServer` in later
 * builds: the beta transition renames the service without changing the route
 * registration shape.
 */
interface WebRouteHost {
  register(route: {
    kind: 'exact' | 'prefix'
    path: string
    handler: (req: IncomingMessage, res: ServerResponse) => void | Promise<void>
  }): () => void
}

/** Web-server service key candidates, newest first. */
const WEB_SERVER_KEYS = ['webServer', 'httpServer'] as const
/** Workspace registry service key candidates, newest first. */
const WORKSPACE_KEYS = ['workspaceRegistry', 'workspace'] as const
/** Same-origin settings-page endpoint for the member-profile library. */
const PROFILES_ROUTE = '/plugins/dsh-agent-teams/profiles'

/** Send one JSON response with the profile API's no-cache policy. */
function writeJson(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(value))
}

/** Read one small JSON request body, rejecting malformed or oversized input. */
async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += bytes.length
    if (size > 256 * 1024) throw new Error('request body too large')
    chunks.push(bytes)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text === '') return undefined
  return JSON.parse(text) as unknown
}

/** Whether one decoded JSON value is an object with an array `profiles` field. */
function profilesFrom(value: unknown): MemberProfile[] | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const profiles = (value as { profiles?: unknown }).profiles
  return Array.isArray(profiles) ? profiles as MemberProfile[] : undefined
}

export const name = 'agent-teams'
export const inject = ['tools', 'subagents', 'systemPrompt', 'agents', 'agentPresets', 'settings']

/** Plugin configuration. */
export interface Config {
  /**
   * State directory name under the captain's workspace; team state lives at
   * `<workspace>/<stateDir>/<teamId>/` (default `.agent-teams`).
   */
  stateDir?: string
  /** `ctx.subagents` provider used to spawn members; must support continuable children and personas (default `spawn`). */
  memberProvider?: string
  /** Optional model override applied to every member. */
  memberModel?: string
  /** Member delegation depth cap (default `1`; `0` forbids delegation entirely). */
  memberMaxDepth?: number
  /** Team size cap in members (default `8`). */
  maxMembers?: number
  /** Prompt-section order for the usage policy (default `117`, after delegation policy). */
  promptSectionOrder?: number
  /** Default agent-preset id mounted on members that do not specify one via `agent_teams_add_member`. */
  memberPreset?: string
}

export const Config: z<Config> = z.object({
  stateDir: z.string().default('.agent-teams'),
  memberProvider: z.string().default('spawn'),
  memberModel: z.string(),
  memberMaxDepth: z.natural().default(1),
  maxMembers: z.natural().min(1).default(8),
  promptSectionOrder: z.natural().default(117),
  memberPreset: z.string(),
})

/** The model-facing usage policy: when and how to drive AgentTeams. */
function usageSectionText(toolNames: string): string {
  return `When the user asks to run something with AgentTeams (e.g. "use AgentTeams to do X"), you are the captain of a multi-agent team. Follow this protocol:
1. Call agent_teams_create with a team name and the goal as description. You become the captain and may lead one team at a time.
2. Call agent_teams_add_member once per role the goal needs. Members snapshot the captain's current provider, model and supported reasoning policy unless the user explicitly asks for another route; a named template can add a preset and role setup.
3. Break the goal into dependency-linked tasks with agent_teams_create_task. The scheduler automatically claims one ready task for each truly idle member and wakes it.
4. Monitor with agent_teams_status and communicate with agent_teams_send_message. Do not duplicate a member's work merely because its turn is slow.
5. For a blocker, stale task, or takeover, use agent_teams_reassign_task. The old attempt is revoked before the replacement is dispatched, so late results cannot overwrite it.
6. Present the results, then agent_teams_delete to archive the team when work is finished.

Tools: ${toolNames}`
}

export function apply(ctx: Context, config: Config): void {
  // Member-profile library: persisted through the settings service, edited on
  // the 「团队」 settings page (client), surfaced to the captain through a
  // prompt variable, and applied by add_member(template=...).
  const profileScope = ctx.settings.register(PROFILES_NS, PROFILES_SCHEMA)
  const loadProfiles = (): MemberProfile[] => {
    const value = profileScope.get() as { profiles?: MemberProfile[] } | undefined
    return Array.isArray(value?.profiles) ? value.profiles! : []
  }
  ctx.systemPrompt.variable('agent_teams_profiles', () => renderProfileDirectory(loadProfiles()))
  ctx.systemPrompt.section({
    name: 'agent-teams:profiles',
    order: (config.promptSectionOrder ?? 117) + 0.5,
    text: '设置页「团队」维护了成员模板库，可用于按模板快速拉成员：\n{{agent_teams_profiles}}',
  })

  const resolved: ToolsConfig = {
    stateDir: config.stateDir ?? '.agent-teams',
    memberProvider: config.memberProvider ?? 'spawn',
    memberModel: config.memberModel,
    memberMaxDepth: config.memberMaxDepth ?? 1,
    maxMembers: config.maxMembers ?? 8,
    memberPreset: config.memberPreset,
    loadProfiles,
  }

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
    'agent_teams_reassign_task',
    'agent_teams_claim_task',
    'agent_teams_update_task',
    'agent_teams_send_message',
    'agent_teams_status',
    'agent_teams_delete',
  ].join(', ')
  ctx.systemPrompt.section({
    name: 'agent-teams:usage',
    order: config.promptSectionOrder ?? 117,
    text: usageSectionText(toolNames),
  })

  registerAgentTeamsTools(ctx, resolved)

  // The activity panel data/artwork routes need the Web server and the
  // workspace registry, which headless profiles do not mount; under
  // concurrent activation they may also bind after this plugin. Register the
  // routes lazily: try now, then on each service binding event. In a webless
  // profile the plugin stays tool-only and never blocks boot.
  let webRegistered = false
  const registerWebSurface = (): void => {
    if (webRegistered) return
    const webServer = (ctx.get(WEB_SERVER_KEYS[0]) ?? ctx.get(WEB_SERVER_KEYS[1])) as WebRouteHost | undefined
    const workspaceRegistry = (ctx.get(WORKSPACE_KEYS[0]) ?? ctx.get(WORKSPACE_KEYS[1])) as WorkspaceRegistry | undefined
    if (webServer === undefined || workspaceRegistry === undefined) return
    webRegistered = true

    // The package-private `harness.handle()` bridge exists only in the
    // dynamic-code VM, not in an ordinary installed Cordis package. Keep the
    // settings page in this package's regular host/client plane instead.
    ctx.effect(() => webServer.register({
      kind: 'exact',
      path: PROFILES_ROUTE,
      handler: async (req, res) => {
        if (req.method === 'GET') {
          writeJson(res, 200, await snapshotProfiles(ctx, loadProfiles()))
          return
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { allow: 'GET, POST' })
          res.end()
          return
        }
        let profiles: MemberProfile[] | undefined
        try {
          profiles = profilesFrom(await readJson(req))
        } catch {
          writeJson(res, 400, { ok: false, error: 'invalid JSON body' })
          return
        }
        if (profiles === undefined) {
          writeJson(res, 400, { ok: false, error: 'profiles must be an array' })
          return
        }
        await profileScope.replace({ profiles })
        writeJson(res, 200, { ok: true, count: profiles.length })
      },
    }), 'agent-teams: profiles route')

    // Activity panel data route: the browser floater polls this for team
    // snapshots (disk truth + live subagent activity). Mirrors the Claude
    // Code desktop watcher's server-side snapshot pattern.
    ctx.effect(() => webServer.register({
    kind: 'exact',
    path: '/plugins/dsh-agent-teams/state',
    handler: async (req, res) => {
      const url = new URL(req.url ?? '/', 'http://x')
      const roots = workspaceRegistry.list().map((workspace) => ({
        workspace: workspace.title,
        stateRoot: join(workspace.path, resolved.stateDir),
      }))
      // ?archived=1 serves teams moved to archive/ (post-delete review).
      const snapshots = url.searchParams.get('archived') === '1'
        ? await collectArchivedTeamsActivity(ctx, roots)
        : await collectTeamsActivity(ctx, roots)
      const body = JSON.stringify({ teams: snapshots })
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      })
      res.end(body)
    },
  }), 'agent-teams: activity route')

  // Whale mascot artwork: serve the packaged role/action images to the
  // activity panel. An explicit allowlist guards the route (no path
  // traversal); the images ship with the bundle (files: assets/).
  const artDir = fileURLToPath(new URL('../assets/agent-teams/', import.meta.url))
  const ART_ALLOWLIST = new Set([
    'team-lead.png', 'researcher.png', 'engineer.png', 'designer.png',
    'qa-engineer.png', 'security-reviewer.png', 'data-analyst.png',
    'docs-coordinator.png', 'action-working.png', 'action-thinking.png',
    'action-reporting.png', 'action-celebrating.png', 'action-sleeping.png',
    'action-sending.png',
  ])
    ctx.effect(() => webServer.register({
      kind: 'prefix',
      path: '/plugins/dsh-agent-teams/assets',
    handler: async (req, res) => {
      let name: string
      try {
        name = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname.split('/').pop() ?? '')
      } catch {
        // Malformed percent-encoding: treat as an unknown asset, not a 400.
        res.writeHead(404)
        res.end()
        return
      }
      if (!ART_ALLOWLIST.has(name)) {
        res.writeHead(404)
        res.end()
        return
      }
      try {
        const data = await readFile(join(artDir, name))
        res.writeHead(200, {
          'content-type': 'image/png',
          'cache-control': 'public, max-age=86400',
        })
        res.end(data)
      } catch (error: unknown) {
        ctx.logger.warn(`agent-teams: artwork read failed for ${name}: ${String(error)}`)
        res.writeHead(404)
        res.end()
      }
      },
    }), 'agent-teams: artwork route')
  }

  registerWebSurface()
  ctx.on('internal/service', (name) => {
    if (WEB_SERVER_KEYS.includes(name as (typeof WEB_SERVER_KEYS)[number])
      || WORKSPACE_KEYS.includes(name as (typeof WORKSPACE_KEYS)[number])) {
      registerWebSurface()
    }
  })
}
