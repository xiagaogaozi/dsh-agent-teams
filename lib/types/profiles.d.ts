/**
 * Member-profile library for AgentTeams.
 *
 * A profile is a named member template maintained on the settings page
 * 「团队」: a name, a description telling the captain when to use it, a model,
 * a reasoning effort, and an agent preset. The library is persisted through
 * the host `settings` service, surfaced to the captain through a
 * `{{agent_teams_profiles}}` prompt variable, and applied by
 * `agent_teams_add_member(template=...)`.
 * @module dsh-agent-teams/profiles
 */
import z from '@deepseek-ai/schemastery';
import type { Context } from '@deepseek-ai/cordis';
/** One named member template. */
export interface MemberProfile {
    /** Unique template name. */
    name: string;
    /** When to use this template — shown to the captain in the prompt directory. */
    description: string;
    /** Model override applied to the member (`''` = captain's model). */
    model: string;
    /** Reasoning effort injected on the member's requests (`off`/`high`/`max`/`''`). */
    reasoningEffort: string;
    /** Agent-preset id mounted on the member (`''` = inherit the captain's). */
    preset: string;
}
export declare const MemberProfileSchema: z<Schemastery.ObjectS<{
    name: z<string, string>;
    description: z<string, string>;
    model: z<string, string>;
    reasoningEffort: z<string, string>;
    preset: z<string, string>;
}>, Schemastery.ObjectT<{
    name: z<string, string>;
    description: z<string, string>;
    model: z<string, string>;
    reasoningEffort: z<string, string>;
    preset: z<string, string>;
}>>;
export declare const PROFILES_SCHEMA: z<Schemastery.ObjectS<{
    profiles: z<({
        name?: string | null | undefined;
        description?: string | null | undefined;
        model?: string | null | undefined;
        reasoningEffort?: string | null | undefined;
        preset?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        name: z<string, string>;
        description: z<string, string>;
        model: z<string, string>;
        reasoningEffort: z<string, string>;
        preset: z<string, string>;
    }>[]>;
}>, Schemastery.ObjectT<{
    profiles: z<({
        name?: string | null | undefined;
        description?: string | null | undefined;
        model?: string | null | undefined;
        reasoningEffort?: string | null | undefined;
        preset?: string | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        name: z<string, string>;
        description: z<string, string>;
        model: z<string, string>;
        reasoningEffort: z<string, string>;
        preset: z<string, string>;
    }>[]>;
}>>;
export declare const PROFILES_NS: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Load the profile list through the settings service (empty on first run). */
export declare function readProfiles(scope: {
    get(): unknown;
}): MemberProfile[];
/** Render the captain-facing directory of the profile library. */
export declare function renderProfileDirectory(profiles: MemberProfile[]): string;
/** Aggregate the model picker options from every configurable provider. */
export declare function collectModels(ctx: Context): Promise<Array<{
    provider: string;
    model: string;
}>>;
/** The settings-page snapshot: profiles plus the picker metadata. */
export interface ProfilesSnapshot {
    profiles: MemberProfile[];
    /** Available agent-preset ids. */
    presets: string[];
    /** Model picker options (provider-prefixed ids). */
    models: string[];
    /** Supported reasoning efforts. */
    efforts: string[];
}
export declare function snapshotProfiles(ctx: Context, profiles: MemberProfile[]): Promise<ProfilesSnapshot>;
