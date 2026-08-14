/**
 * Inline 16px icon set for the team settings page (outline style,
 * currentColor) — mirrors the DeepSeek Harness client convention: no icon
 * package, plain geometric SVG shapes with `stroke: currentColor`.
 * @module dsh-agent-teams/client/icons
 */
import type { JSX } from 'react';
interface IconProps {
    size?: number;
    className?: string;
}
/** Plus sign — add a member template. */
export declare function PlusIcon({ size, className }: IconProps): JSX.Element;
/** Pencil — rename a member template. */
export declare function EditIcon({ size, className }: IconProps): JSX.Element;
/** Trash bin — delete a member template. */
export declare function TrashIcon({ size, className }: IconProps): JSX.Element;
/** Chevron down — picker affordance. */
export declare function ChevronDownIcon({ size, className }: IconProps): JSX.Element;
/** Close — cancel affordance. */
export declare function CloseIcon({ size, className }: IconProps): JSX.Element;
export {};
