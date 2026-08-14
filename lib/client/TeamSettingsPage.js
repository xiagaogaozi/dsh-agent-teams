import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * 「团队」settings page: manage the member-profile library (named member
 * templates with a description, model, reasoning effort, and agent preset).
 * The library lives in the host `settings` service; this page talks to it
 * through the package-private RPC methods registered by the host half.
 * @module dsh-agent-teams/client/TeamSettingsPage
 */
import { useState } from 'react';
import { Button } from '@deepseek-ai/dsh-client-ui-primitives';
import { EditIcon, PlusIcon, TrashIcon } from "./icons.js";
import css from './TeamSettingsPage.module.css';
const EMPTY_DRAFT = { name: '', description: '', model: '', reasoningEffort: '', preset: '' };
function effortLabel(effort) {
    return effort === '' ? '默认' : effort;
}
function modelLabel(model) {
    return model === '' ? '默认（队长的模型）' : model;
}
function presetLabel(preset) {
    return preset === '' ? '继承（队长的预设）' : preset;
}
export function TeamSettingsPage() {
    const [snap, setSnap] = useState(null);
    const [selected, setSelected] = useState('');
    const [draft, setDraft] = useState(null);
    const [nameEditable, setNameEditable] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busy, setBusy] = useState(false);
    const load = async () => {
        const s = (await host.call('agent-teams/profiles/get'));
        setSnap(s);
    };
    const save = async (profiles) => {
        setBusy(true);
        try {
            await host.call('agent-teams/profiles/save', { profiles });
            await load();
        }
        finally {
            setBusy(false);
        }
    };
    const onSelect = (name) => {
        if (snap === null)
            return;
        setSelected(name);
        const found = snap.profiles.find((p) => p.name === name);
        setDraft(found !== undefined ? { ...found } : null);
        setNameEditable(false);
        setConfirmDelete(false);
    };
    const onAdd = () => {
        setSelected('');
        setDraft({ ...EMPTY_DRAFT });
        setNameEditable(true);
        setConfirmDelete(false);
    };
    const onRename = () => {
        if (draft === null)
            return;
        setNameEditable(true);
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
        setNameEditable(false);
    };
    const onCancel = () => {
        if (selected !== '' && snap !== null) {
            const found = snap.profiles.find((p) => p.name === selected);
            setDraft(found !== undefined ? { ...found } : null);
        }
        else {
            setDraft(null);
            setSelected('');
        }
        setNameEditable(false);
        setConfirmDelete(false);
    };
    if (snap === null) {
        return _jsx("div", { className: css.wrap, children: _jsx("div", { className: css.empty, children: "\u52A0\u8F7D\u6210\u5458\u6A21\u677F\u2026" }) });
    }
    return (_jsxs("div", { className: css.wrap, children: [_jsxs("div", { className: css.pickerRow, children: [_jsxs("select", { className: css.select, value: selected, onChange: (e) => onSelect(e.target.value), disabled: busy, children: [_jsx("option", { value: "", children: "\u9009\u62E9\u6210\u5458\u6A21\u677F\u2026" }), snap.profiles.map((p) => _jsx("option", { value: p.name, children: p.name }, p.name))] }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(PlusIcon, {}), title: "\u6DFB\u52A0\u6210\u5458\u6A21\u677F", onClick: onAdd, disabled: busy, children: "\u6DFB\u52A0" }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(EditIcon, {}), title: "\u91CD\u547D\u540D\u6210\u5458\u6A21\u677F", onClick: onRename, disabled: draft === null || busy, children: "\u91CD\u547D\u540D" }), _jsx(Button, { variant: "ghost", size: "sm", icon: _jsx(TrashIcon, {}), title: confirmDelete ? '再次点击确认删除' : '删除成员模板', onClick: onDelete, disabled: draft === null || busy, className: confirmDelete ? css.danger : undefined, children: confirmDelete ? '确认?' : '删除' })] }), draft === null ? (_jsx("div", { className: css.empty, children: snap.profiles.length === 0
                    ? '还没有成员模板。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，队长就能用 agent_teams_add_member(template="名字") 按模板拉成员。'
                    : '选择一个模板进行编辑，或点击「添加」创建新模板。' })) : (_jsxs("div", { className: css.form, children: [_jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: "\u540D\u79F0" }), nameEditable ? (_jsx("input", { className: css.nameInput, value: draft.name, placeholder: "\u6210\u5458\u6A21\u677F\u540D\uFF08\u552F\u4E00\uFF09", onChange: (e) => setDraft({ ...draft, name: e.target.value }), disabled: busy })) : (_jsx("div", { className: css.nameStatic, children: draft.name }))] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: "\u63CF\u8FF0\uFF08\u53D1\u7ED9\u4E3B\u4EE3\u7406\uFF1A\u4EC0\u4E48\u65F6\u5019\u624D\u8C03\u7528\u8FD9\u4E2A\u6A21\u677F\uFF09" }), _jsx("textarea", { className: css.textarea, value: draft.description, placeholder: "\u4F8B\uFF1A\u626E\u6F14\u5973\u4E3B\u89D2\u6797\u665A\u65F6\u4F7F\u7528\uFF1B\u9700\u8981\u5267\u60C5\u63A8\u8FDB\u65B9\u6848\u65F6\u4F7F\u7528\u2026\u2026", onChange: (e) => setDraft({ ...draft, description: e.target.value }), disabled: busy })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: "\u6A21\u578B" }), _jsxs("select", { className: css.select, value: draft.model, onChange: (e) => setDraft({ ...draft, model: e.target.value }), disabled: busy, children: [_jsx("option", { value: "", children: "\u9ED8\u8BA4\uFF08\u961F\u957F\u7684\u6A21\u578B\uFF09" }), snap.models.map((m) => _jsx("option", { value: m, children: m }, m))] })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: "\u63A8\u7406\u7B49\u7EA7" }), _jsx("select", { className: css.select, value: draft.reasoningEffort, onChange: (e) => setDraft({ ...draft, reasoningEffort: e.target.value }), disabled: busy, children: snap.efforts.map((e) => _jsx("option", { value: e, children: effortLabel(e) }, e)) })] }), _jsxs("div", { className: css.field, children: [_jsx("span", { className: css.label, children: "\u9884\u8BBE" }), _jsxs("select", { className: css.select, value: draft.preset, onChange: (e) => setDraft({ ...draft, preset: e.target.value }), disabled: busy, children: [_jsx("option", { value: "", children: "\u7EE7\u627F\uFF08\u961F\u957F\u7684\u9884\u8BBE\uFF09" }), snap.presets.map((p) => _jsx("option", { value: p, children: presetLabel(p) }, p))] })] }), _jsxs("div", { className: css.actions, children: [_jsx(Button, { variant: "primary", size: "md", onClick: onSave, disabled: busy || draft.name.trim() === '', children: "\u4FDD\u5B58" }), _jsx(Button, { variant: "ghost", size: "md", onClick: onCancel, disabled: busy, children: "\u53D6\u6D88" })] }), _jsx("div", { className: css.hint, children: "\u4FDD\u5B58\u540E\uFF0C\u4E3B\u4EE3\u7406\u7684\u7CFB\u7EDF\u63D0\u793A\u91CC\u4F1A\u51FA\u73B0\u8FD9\u4EFD\u6A21\u677F\u76EE\u5F55\uFF1B\u8C03\u7528 agent_teams_add_member(template=\"\u540D\u5B57\") \u5373\u53EF\u6309\u6A21\u677F\u62C9\u6210\u5458\uFF08\u663E\u5F0F\u4F20\u5165\u7684 model / preset / persona \u4F18\u5148\uFF09\u3002" })] }))] }));
}
