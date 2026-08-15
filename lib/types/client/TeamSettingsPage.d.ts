/**
 * 「团队」settings page: manage the member-profile library (named member
 * templates with a description, model, reasoning effort, and agent preset).
 * The library lives in the host `settings` service; this page talks to it
 * through the package-private RPC methods registered by the host half.
 *
 * Layout follows the official Setting-Cell convention (figma 'Setting-Cell'):
 * 16/0 rows separated by `--dsw-alias-border-l2` hairlines, 14px titles,
 * 36px selector pills (`--dsw-alias-bg-module-platform`) backed by the
 * primitives `Menu`, and official `Icon*Outline*` glyphs — no custom icons.
 * @module dsh-agent-teams/client/TeamSettingsPage
 */
export declare function TeamSettingsPage(): JSX.Element;
