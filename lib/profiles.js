/**
 * Member-profile library for AgentTeams.
 *
 * A profile is a named member template maintained on the settings page
 * 「团队」: a name, a description telling the captain when to use it, a model,
 * a reasoning effort, and an agent preset. The library is persisted through
 * the host `settings` service, surfaced to the captain through a
 * `{{agentTeamsProfiles}}` prompt variable, and applied by
 * `agent_teams_add_member(template=...)`.
 * @module dsh-agent-teams/profiles
 */
import z from '@deepseek-ai/schemastery';
import { settingsNamespace } from '@deepseek-ai/dsh-settings';
export const MemberProfileSchema = z.object({
    name: z.string(),
    description: z.string(),
    model: z.string(),
    reasoningEffort: z.string(),
    preset: z.string(),
});
export const PROFILES_SCHEMA = z.object({ profiles: z.array(MemberProfileSchema) });
export const PROFILES_NS = settingsNamespace('agent-teams');
/** Load the profile list through the settings service (empty on first run). */
export function readProfiles(scope) {
    const value = scope.get();
    const list = value?.profiles;
    return Array.isArray(list) ? list : [];
}
/** Render the captain-facing directory of the profile library. */
export function renderProfileDirectory(profiles) {
    if (profiles.length === 0) {
        return '（无成员模板。可在设置页「团队」中添加；或在 agent_teams_add_member 中直接指定 preset/model/persona。）';
    }
    const lines = profiles.map((p) => {
        const parts = [
            `- ${p.name}`,
            p.description !== '' ? `：${p.description}` : '',
            `[模型 ${p.model !== '' ? p.model : '默认'}，推理 ${p.reasoningEffort !== '' ? p.reasoningEffort : '默认'}，预设 ${p.preset !== '' ? p.preset : '继承'}]`,
        ];
        return parts.join('');
    });
    return `以下成员模板可用（设置页「团队」维护）；用 agent_teams_add_member(template="<名字>") 按模板拉成员：\n${lines.join('\n')}`;
}
/** Aggregate the model picker options from every configurable provider. */
export async function collectModels(ctx) {
    const llm = ctx.get('llm');
    if (llm === undefined)
        return [];
    const out = [];
    for (const provider of llm.listConfigurableProviders()) {
        try {
            const models = await llm.listModels(provider.provider);
            for (const model of models) {
                out.push({ provider: provider.provider, model: model.id });
            }
        }
        catch {
            // A provider with no model directory simply contributes nothing.
        }
    }
    return out;
}
export async function snapshotProfiles(ctx, profiles) {
    const presets = ctx.get('agentPresets') !== undefined
        ? (await ctx.agentPresets.list()).map((p) => p.id).sort()
        : [];
    const models = (await collectModels(ctx)).map((m) => `${m.provider}/${m.model}`);
    return {
        profiles,
        presets,
        models,
        efforts: ['', 'off', 'high', 'max'],
    };
}
