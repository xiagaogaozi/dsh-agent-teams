import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function svgProps(size, className) {
    return {
        width: size,
        height: size,
        viewBox: '0 0 16 16',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        className,
        'aria-hidden': true,
    };
}
/** Plus sign — add a member template. */
export function PlusIcon({ size = 16, className }) {
    return _jsx("svg", { ...svgProps(size, className), children: _jsx("path", { d: "M8 3.5v9M3.5 8h9" }) });
}
/** Pencil — rename a member template. */
export function EditIcon({ size = 16, className }) {
    return (_jsxs("svg", { ...svgProps(size, className), children: [_jsx("path", { d: "M4 12.2l.7-2.1 7.2-7.2 1.4 1.4-7.2 7.2z" }), _jsx("path", { d: "M9.4 5.2l1.4 1.4" })] }));
}
/** Trash bin — delete a member template. */
export function TrashIcon({ size = 16, className }) {
    return (_jsxs("svg", { ...svgProps(size, className), children: [_jsx("path", { d: "M3.5 5.5h9" }), _jsx("path", { d: "M5.5 5.5V12a1.5 1.5 0 0 0 1.5 1.5h2A1.5 1.5 0 0 0 10.5 12V5.5" }), _jsx("path", { d: "M6.5 5.5V4.2a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.3" })] }));
}
/** Chevron down — picker affordance. */
export function ChevronDownIcon({ size = 16, className }) {
    return _jsx("svg", { ...svgProps(size, className), children: _jsx("path", { d: "M3.5 6.5L8 11l4.5-4.5" }) });
}
/** Close — cancel affordance. */
export function CloseIcon({ size = 16, className }) {
    return _jsx("svg", { ...svgProps(size, className), children: _jsx("path", { d: "M4.5 4.5l7 7M11.5 4.5l-7 7" }) });
}
