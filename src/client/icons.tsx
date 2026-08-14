/**
 * Inline 16px icon set for the team settings page (outline style,
 * currentColor) — mirrors the DeepSeek Harness client convention: no icon
 * package, plain geometric SVG shapes with `stroke: currentColor`.
 * @module dsh-agent-teams/client/icons
 */

import type { JSX } from 'react'

interface IconProps {
  size?: number
  className?: string
}

function svgProps(size: number, className: string | undefined): Record<string, unknown> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

/** Plus sign — add a member template. */
export function PlusIcon({ size = 16, className }: IconProps): JSX.Element {
  return <svg {...svgProps(size, className)}><path d="M8 3.5v9M3.5 8h9" /></svg>
}

/** Pencil — rename a member template. */
export function EditIcon({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M4 12.2l.7-2.1 7.2-7.2 1.4 1.4-7.2 7.2z" />
      <path d="M9.4 5.2l1.4 1.4" />
    </svg>
  )
}

/** Trash bin — delete a member template. */
export function TrashIcon({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg {...svgProps(size, className)}>
      <path d="M3.5 5.5h9" />
      <path d="M5.5 5.5V12a1.5 1.5 0 0 0 1.5 1.5h2A1.5 1.5 0 0 0 10.5 12V5.5" />
      <path d="M6.5 5.5V4.2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.3" />
    </svg>
  )
}

/** Chevron down — picker affordance. */
export function ChevronDownIcon({ size = 16, className }: IconProps): JSX.Element {
  return <svg {...svgProps(size, className)}><path d="M3.5 6.5L8 11l4.5-4.5" /></svg>
}

/** Close — cancel affordance. */
export function CloseIcon({ size = 16, className }: IconProps): JSX.Element {
  return <svg {...svgProps(size, className)}><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" /></svg>
}
