/**
 * Member subagent lifecycle: spawn a continuable child per member, deliver
 * messages into its FIFO inbox, and observe its activity.
 *
 * Members are durable continuable subagents of the captain, so a member keeps
 * its conversation across turns and across harness restarts: the captain
 * wakes it with {@link ctx.subagents.followup}, it works through its turn
 * (updating team state through the `agent_teams_*` tools), and becomes idle
 * again. Its final assistant message is not readable programmatically, so the
 * member persists its report into the captain's mailbox and the task records,
 * which the captain reads through `agent_teams_status`.
 * @module dsh-agent-teams/members
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
// Declaration merge only: makes ctx.subagents visible.
import type {} from '@deepseek-ai/dsh-subagent'
// Declaration merge only: makes ctx.agentPresets visible.
import type {} from '@deepseek-ai/dsh-agent-presets'
import type { SessionId } from '@deepseek-ai/dsh-session'
import type { TeamMember, TeamState } from './types.ts'

/** Captain-only AgentTeams tools hidden from newly spawned members. */
const MEMBER_DENIED_TOOLS = [
  'agent_teams_create',
  'agent_teams_add_member',
  'agent_teams_remove_member',
  'agent_teams_create_task',
  'agent_teams_delete',
] as const

/**
 * Restore the SessionId brand on a value that round-tripped through the
 * durable team file. The brand is erased by JSON serialization; the value
 * originated from `startContinuable`/`agent.id`, so this cast is the boundary
 * restoration, not a new assertion.
 */
function brandedSessionId(value: string): SessionId {
  return value as SessionId
}

/** Runtime knobs for member spawning, resolved from plugin config. */
export interface MemberRuntimeConfig {
  /** Registered `ctx.subagents` provider name (must support continuable + persona). */
  provider: string
  /** Optional model override applied to every member. */
  model?: string
  /** Child delegation depth cap (0 forbids delegation entirely). */
  maxDepth?: number
  /** Default agent-preset id mounted on members that do not specify one. */
  preset?: string
}

/**
 * The team tool protocol appended after any custom member persona. It is
 * deliberately kept free of role-play semantics: members may replace their
 * persona entirely, but still need to know how to collaborate on tasks.
 */
function teamPlumbing(team: TeamState, member: TeamMember, stateDir: string): string {
  return `--- Team tool protocol (mechanical; do not role-play this section) ---
- You are a member of the team "${team.name}" (team id: ${team.id}); your team name is ${member.name} (use it as \`from\`/identity).
- Team state lives under ${stateDir}/${team.id}/ (team.json and inbox/*.jsonl). You may inspect these files read-only for diagnostics, but never edit them directly; use the agent_teams_* tools so JSON escaping and concurrent updates stay safe.
- The captain and your teammates reach you through messages. Each message you receive is a new turn: act on it and end your turn with a concise reply.
- When the captain assigns you a task: claim it with agent_teams_claim_task, mark it agent_teams_update_task (status=in_progress) while working, and complete it with agent_teams_update_task (status=completed) plus a concise \`output\` when done. Report blockers to the captain with agent_teams_send_message (to=captain).
- To ask a teammate something, use agent_teams_send_message with to=<teammate name>; teammates talk to each other without the captain in the loop.
- You are a worker: do not create or delete teams, and do not add or remove members — that is the captain's job.`
}

/**
 * The member's system prompt (persona), shadowing the deployment persona for
 * that child. A custom `member.persona` replaces the default template
 * entirely (the team tool protocol is still appended); otherwise the default
 * member persona applies. Self-contained: it replaces the whole persona
 * section.
 * @param team - the team the member joined.
 * @param member - the member record (name/role are read before spawning).
 * @param stateDir - configured state directory, so the member can locate the
 *   team files with its own file tools.
 */
export function memberPersona(team: TeamState, member: TeamMember, stateDir: string): string {
  if (member.persona !== undefined) {
    return `${member.persona}

${teamPlumbing(team, member, stateDir)}`
  }
  return `You are ${member.name}, a member of the multi-agent team "${team.name}" running inside DeepSeek Harness AgentTeams. The captain leads the team; you are a worker member${member.role ? ` with the role: ${member.role}` : ''}.

${teamPlumbing(team, member, stateDir)}`
}

/**
 * The initial user message delivered when the member is created.
 * @param team - the team the member joined.
 */
export function memberWelcome(team: TeamState): string {
  return `You have joined the team "${team.name}" as a member. The captain will send you tasks and messages; wait for instructions. Current team status: ${team.tasks.length} task(s), none assigned to you yet.`
}

/**
 * Spawn one member as a durable continuable subagent of the captain and fill
 * `member.id` with its child session id. On failure nothing is persisted.
 * @param ctx - the plugin context (injects `subagents`).
 * @param config - member runtime knobs.
 * @param captain - the exact live captain agent (the calling agent).
 * @param team - the team record (read-only here).
 * @param member - the member draft whose `id` is filled on success.
 * @param stateDir - configured state directory (for the persona).
 * @param signal - caller cancellation, forwarded to the start.
 */
export async function spawnMember(
  ctx: Context,
  config: MemberRuntimeConfig,
  captain: Agent,
  team: TeamState,
  member: TeamMember,
  stateDir: string,
  signal: AbortSignal,
): Promise<void> {
  // Fail loud at the first use: provider registration is a sibling plugin's
  // effect and may settle after this plugin mounts. Capability checks here
  // mirror what startContinuable would reject, with an actionable error.
  const provider = ctx.subagents.getProvider(config.provider)
  if (provider === undefined) {
    throw new Error(
      `agent-teams: no subagent provider "${config.provider}" is registered (available: ${ctx.subagents.list().join(', ') || 'none'}) — `
      + 'check that the subagent provider row (e.g. subagent-spawn) is mounted in the composition',
    )
  }
  if (provider.prepareContinuable === undefined) {
    throw new Error(`agent-teams: provider "${config.provider}" does not support continuable members`)
  }
  if (!provider.capabilities.persona) {
    throw new Error(`agent-teams: provider "${config.provider}" cannot apply a member persona`)
  }
  if (!provider.capabilities.toolFilter) {
    throw new Error(`agent-teams: provider "${config.provider}" cannot restrict captain-only tools for members`)
  }
  const start = await ctx.subagents.startContinuable({
    provider: config.provider,
    label: `agent-teams:${team.id}:${member.name}`,
    request: {
      prompt: [{ type: 'text', text: memberWelcome(team) }],
      parent: captain,
      persona: memberPersona(team, member, stateDir),
      toolFilter: { deny: [...MEMBER_DENIED_TOOLS] },
      ...config.model !== undefined ? { agentOptions: { model: config.model } } : {},
      ...config.maxDepth !== undefined ? { maxDepth: config.maxDepth } : {},
    },
    signal,
  })
  member.id = start.childId
  // Mount an independent agent preset on the member when one is requested
  // (per-member `preset` wins over the plugin-level `memberPreset` default).
  // The child runs on the captain's preset by inheritance; recompose swaps
  // that composition for the requested preset's tools, prompt sections, skills
  // and persona for this member alone. Only in-process providers register
  // their children in the `agents` service, so out-of-process providers
  // (codex/claude/acp) reject preset requests loud and early.
  const presetId = member.preset ?? config.preset
  if (presetId !== undefined) {
    const child = ctx.agents.get(brandedSessionId(start.childId))
    if (child === undefined) {
      throw new Error(
        `agent-teams: preset "${presetId}" for member "${member.name}" requires an in-process `
        + `subagent provider (the child is not registered in the agents service)`,
      )
    }
    try {
      await ctx.agentPresets.recompose(child.ctx, presetId)
    } catch (error: unknown) {
      throw new Error(
        `agent-teams: failed to mount preset "${presetId}" on member "${member.name}": ${String(error)}`,
      )
    }
  }
}

/**
 * Deliver one message to a member as its next FIFO turn. Best effort: a
 * failure (member gone or not continuable) is logged and reported as `false`
 * so the caller can decide (mailbox delivery still happened).
 *
 * Any team sender can route through this helper: the captain is the direct
 * parent of every member, and the caller passes the captain's live Agent
 * (its own when the captain calls, the registry-resolved one when a member
 * sends) — mirroring the Claude Code mailbox model where the writer writes
 * the target's inbox and the target picks it up on its own.
 * @param ctx - the plugin context (injects `subagents`).
 * @param captain - the exact live captain agent (the member's direct parent).
 * @param childId - the member's durable child session id.
 * @param text - the message content.
 * @param signal - caller cancellation, forwarded to the delivery.
 * @returns whether the member inbox accepted the message.
 */
export async function deliverToMember(
  ctx: Context,
  captain: Agent,
  childId: string,
  text: string,
  signal: AbortSignal,
): Promise<boolean> {
  try {
    await ctx.subagents.followup(captain, brandedSessionId(childId), [{ type: 'text', text }], {
      source: { kind: 'plugin', plugin: 'dsh-agent-teams' },
      signal,
    })
    return true
  } catch (error: unknown) {
    ctx.logger.warn(`agent-teams: followup to member ${childId} failed: ${String(error)}`)
    return false
  }
}

/**
 * Request cancellation of one live member's current turn. Best effort, fire
 * and return; the target may keep running until it observes the signal.
 * @param ctx - the plugin context (injects `subagents`).
 * @param captain - the exact live captain agent (the member's parent).
 * @param childId - the member's durable child session id.
 */
export function interruptMember(ctx: Context, captain: Agent, childId: string): void {
  try {
    ctx.subagents.interrupt(brandedSessionId(childId), { kind: 'ancestor', agent: captain })
  } catch (error: unknown) {
    ctx.logger.warn(`agent-teams: interrupt of member ${childId} failed: ${String(error)}`)
  }
}

/**
 * Snapshot each direct continuable child's activity under the captain's
 * session, keyed by child session id. A member that is currently running its
 * turn reports `running`; an idle member reports `inactive`.
 * @param ctx - the plugin context (injects `subagents`).
 * @param captainSessionId - the captain's session id.
 * @returns child id → activity, missing entries are unknown children.
 */
export async function memberActivity(
  ctx: Context,
  captainSessionId: string,
): Promise<Map<string, 'running' | 'inactive'>> {
  const entries = await ctx.subagents.listChildren(brandedSessionId(captainSessionId))
  const activity = new Map<string, 'running' | 'inactive'>()
  for (const entry of entries) {
    if (entry.kind === 'child') activity.set(entry.id, entry.activity)
  }
  return activity
}
