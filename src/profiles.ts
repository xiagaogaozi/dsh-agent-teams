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

import z from '@deepseek-ai/schemastery'
import { settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { Context } from '@deepseek-ai/cordis'
// Declaration merge only: makes ctx.settings and ctx.llm visible.
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-agent-presets'

/** One named member template. */
export interface MemberProfile {
  /** Unique template name. */
  name: string
  /** When to use this template — shown to the captain in the prompt directory. */
  description: string
  /** Model override applied to the member (`''` = captain's model). */
  model: string
  /** Reasoning effort injected on the member's requests (`off`/`high`/`max`/`''`). */
  reasoningEffort: string
  /** Agent-preset id mounted on the member (`''` = inherit the captain's). */
  preset: string
}

export const MemberProfileSchema = z.object({
  name: z.string(),
  description: z.string(),
  model: z.string(),
  reasoningEffort: z.string(),
  preset: z.string(),
})

export const PROFILES_SCHEMA = z.object({ profiles: z.array(MemberProfileSchema) })

export const PROFILES_NS = settingsNamespace('dshAgentTeams')

/** Load the profile list through the settings service (empty on first run). */
export function readProfiles(scope: { get(): unknown }): MemberProfile[] {
  const value = scope.get() as { profiles?: MemberProfile[] } | undefined
  const list = value?.profiles
  return Array.isArray(list) ? list : []
}

/** Render the captain-facing directory of the profile library. */
export function renderProfileDirectory(profiles: MemberProfile[]): string {
  if (profiles.length === 0) {
    return '（无成员模板。可在设置页「团队」中添加；或在 agent_teams_add_member 中直接指定 preset/model/persona。）'
  }
  const lines = profiles.map((p) => {
    const parts = [
      `- ${p.name}`,
      p.description !== '' ? `：${p.description}` : '',
      `[模型 ${p.model !== '' ? p.model : '默认'}，推理 ${p.reasoningEffort !== '' ? p.reasoningEffort : '默认'}，预设 ${p.preset !== '' ? p.preset : '继承'}]`,
    ]
    return parts.join('')
  })
  return `以下成员模板可用（设置页「团队」维护）；用 agent_teams_add_member(template="<名字>") 按模板拉成员：\n${lines.join('\n')}`
}

/** Aggregate the model picker options from every configurable provider. */
export async function collectModels(ctx: Context): Promise<Array<{ provider: string; model: string }>> {
  const llm = ctx.get('llm')
  if (llm === undefined) return []
  const out: Array<{ provider: string; model: string }> = []
  for (const provider of llm.listConfigurableProviders()) {
    try {
      const models = await llm.listModels(provider.provider)
      for (const model of models) {
        out.push({ provider: provider.provider, model: model.id })
      }
    } catch {
      // A provider with no model directory simply contributes nothing.
    }
  }
  return out
}

/** The settings-page snapshot: profiles plus the picker metadata. */
export interface ProfilesSnapshot {
  profiles: MemberProfile[]
  /** Available agent-preset ids. */
  presets: string[]
  /** Model picker options (provider-prefixed ids). */
  models: string[]
  /** Supported reasoning efforts. */
  efforts: string[]
}

export async function snapshotProfiles(ctx: Context, profiles: MemberProfile[]): Promise<ProfilesSnapshot> {
  const presets = ctx.get('agentPresets') !== undefined
    ? (await ctx.agentPresets.list()).map((p) => p.id).sort()
    : []
  const models = (await collectModels(ctx)).map((m) => `${m.provider}/${m.model}`)
  return {
    profiles,
    presets,
    models,
    efforts: ['', 'off', 'high', 'max'],
  }
}
