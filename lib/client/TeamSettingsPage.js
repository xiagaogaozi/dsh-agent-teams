import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { useEffect, useState } from 'react';
import { Button, Input, Menu, IconChevronDownOutline14, IconDownloadOutline16, IconPlusOutline16, IconTrashOutline16, } from '@deepseek-ai/dsh-client-ui-primitives';
import css from './TeamSettingsPage.module.css';
/**
 * Same-origin settings-page endpoint served by the host half. The
 * package-private `harness.handle()` bridge exists only in the dynamic-code
 * VM, not in an ordinary installed Cordis package, so the page talks to the
 * host through this regular HTTP route instead.
 */
const PROFILES_ROUTE = '/plugins/dsh-agent-teams/profiles';
async function apiGet() {
    const res = await fetch(PROFILES_ROUTE, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return res.json();
}
async function apiSave(profiles) {
    const res = await fetch(PROFILES_ROUTE, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profiles }),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    await res.json();
}
const EMPTY_DRAFT = { name: '', description: '', model: '', reasoningEffort: '', preset: '' };
/** One pill selector: Menu + official chevron, in the Setting-Cell style. */
function Selector({ value, options, display, emptyLabel, onSelect, disabled, }) {
    const [open, setOpen] = useState(false);
    const items = ['', ...options.filter((o) => o !== '')].map((id) => ({
        id,
        label: id === '' ? emptyLabel : display(id),
    }));
    return (_jsx(Menu, { open: open, onClose: () => { setOpen(false); }, items: items, selectedId: value, onSelect: (id) => { onSelect(id); setOpen(false); }, align: "end", portal: true, className: css.selectorWrap, anchor: (_jsxs("button", { type: "button", className: css.selector, "aria-haspopup": "menu", "aria-expanded": open, disabled: disabled, onClick: () => { setOpen(v => !v); }, children: [_jsx("span", { className: css.selectorText, children: value === '' ? emptyLabel : display(value) }), _jsx(IconChevronDownOutline14, { className: css.chevron })] })) }));
}
export function TeamSettingsPage() {
    const [snap, setSnap] = useState(null);
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState('');
    const [draft, setDraft] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busy, setBusy] = useState(false);
    const load = async () => {
        try {
            const s = (await apiGet());
            setSnap(s);
            setError(null);
        }
        catch (err) {
            setSnap(null);
            setError(`无法加载成员模板：${err instanceof Error ? err.message : String(err)}（插件 host 可能未更新，请重启 dsh 后重试）`);
        }
    };
    useEffect(() => {
        void load();
    }, []);
    const save = async (profiles) => {
        setBusy(true);
        try {
            await apiSave(profiles);
            await load();
        }
        finally {
            setBusy(false);
        }
    };
    // Switching templates or adding discards unsaved edits (no cancel button).
    const onSelect = (name) => {
        if (snap === null)
            return;
        setSelected(name);
        const found = snap.profiles.find((p) => p.name === name);
        setDraft(found !== undefined ? { ...found } : null);
        setConfirmDelete(false);
    };
    const onAdd = () => {
        setSelected('');
        setDraft({ ...EMPTY_DRAFT });
        setConfirmDelete(false);
    };
    const onSave = async () => {
        if (draft === null || snap === null)
            return;
        const name = draft.name.trim();
        if (name === '')
            return;
        const next = snap.profiles.some((p) => p.name === name)
            ? snap.profiles.map((p) => (p.name === name ? draft : p))
            : [...snap.profiles, draft];
        await save(next);
        setSelected(name);
        setConfirmDelete(false);
    };
    const onDelete = async () => {
        if (draft === null || snap === null)
            return;
        if (!confirmDelete) {
            setConfirmDelete(true);
            return;
        }
        setConfirmDelete(false);
        await save(snap.profiles.filter((p) => p.name !== draft.name));
        setDraft(null);
        setSelected('');
    };
    const patch = (field, value) => {
        if (draft === null)
            return;
        setDraft({ ...draft, [field]: value });
    };
    if (snap === null) {
        return (_jsx("div", { className: css.wrap, children: error !== null
                ? _jsx("div", { className: css.error, children: error })
                : _jsx("div", { className: css.empty, children: "\u52A0\u8F7D\u6210\u5458\u6A21\u677F\u2026" }) }));
    }
    return (_jsxs("div", { className: css.wrap, children: [_jsxs("div", { className: css.pickerRow, children: [_jsx(Selector, { value: selected, options: snap.profiles.map((p) => p.name), display: (n) => n, emptyLabel: "\u9009\u62E9\u6210\u5458\u6A21\u677F\u2026", onSelect: onSelect, disabled: busy }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(IconPlusOutline16, {}), title: "\u6DFB\u52A0\u6210\u5458\u6A21\u677F", onClick: onAdd, disabled: busy, children: "\u6DFB\u52A0" }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(IconDownloadOutline16, {}), title: "\u4FDD\u5B58\u5F53\u524D\u6A21\u677F", onClick: onSave, disabled: draft === null || busy || draft.name.trim() === '', children: "\u4FDD\u5B58" }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(IconTrashOutline16, {}), title: confirmDelete ? '再次点击确认删除' : '删除当前模板', onClick: onDelete, disabled: draft === null || busy, className: confirmDelete ? css.danger : undefined, children: confirmDelete ? '确认?' : '' })] }), draft === null ? (_jsx("div", { className: css.empty, children: snap.profiles.length === 0
                    ? '还没有成员模板。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，队长就能用 agent_teams_add_member(template="名字") 按模板拉成员。'
                    : '选择一个模板进行编辑，或点击「添加」创建新模板。' })) : (_jsxs("div", { className: css.form, children: [_jsxs("div", { className: css.row, children: [_jsx("div", { className: css.rowText, children: _jsx("div", { className: css.title, children: "\u540D\u79F0" }) }), _jsx(Input, { className: css.nameInput, value: draft.name, placeholder: "\u6A21\u677F\u540D\uFF08\u552F\u4E00\uFF09", disabled: busy, onChange: (e) => patch('name', e.target.value) })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: "\u63CF\u8FF0" }), _jsx("div", { className: css.desc, children: "\u53D1\u7ED9\u4E3B\u4EE3\u7406\uFF1A\u4EC0\u4E48\u65F6\u5019\u624D\u8C03\u7528\u8FD9\u4E2A\u6A21\u677F" })] }), _jsx("textarea", { className: css.textarea, value: draft.description, placeholder: "\u4F8B\uFF1A\u626E\u6F14\u5973\u4E3B\u89D2\u6797\u665A\u65F6\u4F7F\u7528\uFF1B\u9700\u8981\u5267\u60C5\u63A8\u8FDB\u65B9\u6848\u65F6\u4F7F\u7528\u2026\u2026", disabled: busy, onChange: (e) => patch('description', e.target.value) })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: "\u6A21\u578B" }), _jsx("div", { className: css.desc, children: "\u6210\u5458\u4F7F\u7528\u7684\u6A21\u578B\uFF0C\u9ED8\u8BA4\u8DDF\u968F\u961F\u957F" })] }), _jsx(Selector, { value: draft.model, options: snap.models, display: (m) => m, emptyLabel: "\u9ED8\u8BA4\uFF08\u961F\u957F\u7684\u6A21\u578B\uFF09", onSelect: (id) => patch('model', id), disabled: busy })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: "\u63A8\u7406\u7B49\u7EA7" }), _jsx("div", { className: css.desc, children: "off / high / max\uFF0C\u9ED8\u8BA4\u8DDF\u968F\u6A21\u578B" })] }), _jsx(Selector, { value: draft.reasoningEffort, options: snap.efforts.filter((e) => e !== ''), display: (e) => e, emptyLabel: "\u9ED8\u8BA4", onSelect: (id) => patch('reasoningEffort', id), disabled: busy })] }), _jsxs("div", { className: css.row, children: [_jsxs("div", { className: css.rowText, children: [_jsx("div", { className: css.title, children: "\u9884\u8BBE" }), _jsx("div", { className: css.desc, children: "\u6210\u5458\u6302\u8F7D\u7684 agent \u9884\u8BBE\uFF0C\u9ED8\u8BA4\u7EE7\u627F\u961F\u957F" })] }), _jsx(Selector, { value: draft.preset, options: snap.presets, display: (p) => p, emptyLabel: "\u7EE7\u627F\uFF08\u961F\u957F\u7684\u9884\u8BBE\uFF09", onSelect: (id) => patch('preset', id), disabled: busy })] }), _jsx("div", { className: css.hint, children: "\u4FDD\u5B58\u540E\uFF0C\u4E3B\u4EE3\u7406\u7684\u7CFB\u7EDF\u63D0\u793A\u91CC\u4F1A\u51FA\u73B0\u8FD9\u4EFD\u6A21\u677F\u76EE\u5F55\uFF1B\u8C03\u7528 agent_teams_add_member(template=\"\u540D\u5B57\") \u5373\u53EF\u6309\u6A21\u677F\u62C9\u6210\u5458\uFF08\u663E\u5F0F\u4F20\u5165\u7684 model / preset / persona \u4F18\u5148\uFF09\u3002" })] }))] }));
}
