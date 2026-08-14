/**
 * 「团队」settings page: manage the member-profile library (named member
 * templates with a description, model, reasoning effort, and agent preset).
 * The library lives in the host `settings` service; this page talks to it
 * through the package-private RPC methods registered by the host half.
 * @module dsh-agent-teams/client/TeamSettingsPage
 */

import { useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { EditIcon, PlusIcon, TrashIcon } from './icons.tsx'
import css from './TeamSettingsPage.module.css'

/**
 * Package-private JSON RPC to this package's host half (client builtin).
 * Typed inline: the runtime injects `host` without a published ambient
 * declaration.
 */
declare const host: { call(method: string, args?: unknown): Promise<unknown> }

/** One named member template (mirrors the host MemberProfile). */
interface Profile {
  name: string
  description: string
  model: string
  reasoningEffort: string
  preset: string
}

/** Host snapshot: profiles plus picker metadata. */
interface Snapshot {
  profiles: Profile[]
  presets: string[]
  models: string[]
  efforts: string[]
}

const EMPTY_DRAFT: Profile = { name: '', description: '', model: '', reasoningEffort: '', preset: '' }

function effortLabel(effort: string): string {
  return effort === '' ? '默认' : effort
}

function modelLabel(model: string): string {
  return model === '' ? '默认（队长的模型）' : model
}

function presetLabel(preset: string): string {
  return preset === '' ? '继承（队长的预设）' : preset
}

export function TeamSettingsPage(): JSX.Element {
  const [snap, setSnap] = useState<Snapshot | null>(null)
  const [selected, setSelected] = useState('')
  const [draft, setDraft] = useState<Profile | null>(null)
  const [nameEditable, setNameEditable] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = async (): Promise<void> => {
    const s = (await host.call('agent-teams/profiles/get')) as Snapshot
    setSnap(s)
  }
  const save = async (profiles: Profile[]): Promise<void> => {
    setBusy(true)
    try {
      await host.call('agent-teams/profiles/save', { profiles })
      await load()
    } finally {
      setBusy(false)
    }
  }

  const onSelect = (name: string): void => {
    if (snap === null) return
    setSelected(name)
    const found = snap.profiles.find((p) => p.name === name)
    setDraft(found !== undefined ? { ...found } : null)
    setNameEditable(false)
    setConfirmDelete(false)
  }

  const onAdd = (): void => {
    setSelected('')
    setDraft({ ...EMPTY_DRAFT })
    setNameEditable(true)
    setConfirmDelete(false)
  }

  const onRename = (): void => {
    if (draft === null) return
    setNameEditable(true)
    setConfirmDelete(false)
  }

  const onDelete = async (): Promise<void> => {
    if (draft === null || snap === null) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setConfirmDelete(false)
    await save(snap.profiles.filter((p) => p.name !== draft.name))
    setDraft(null)
    setSelected('')
  }

  const onSave = async (): Promise<void> => {
    if (draft === null || snap === null) return
    const name = draft.name.trim()
    if (name === '') return
    const next = snap.profiles.some((p) => p.name === name)
      ? snap.profiles.map((p) => (p.name === name ? draft : p))
      : [...snap.profiles, draft]
    await save(next)
    setSelected(name)
    setNameEditable(false)
  }

  const onCancel = (): void => {
    if (selected !== '' && snap !== null) {
      const found = snap.profiles.find((p) => p.name === selected)
      setDraft(found !== undefined ? { ...found } : null)
    } else {
      setDraft(null)
      setSelected('')
    }
    setNameEditable(false)
    setConfirmDelete(false)
  }

  if (snap === null) {
    return <div className={css.wrap}><div className={css.empty}>加载成员模板…</div></div>
  }

  return (
    <div className={css.wrap}>
      <div className={css.pickerRow}>
        <select
          className={css.select}
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          disabled={busy}
        >
          <option value="">选择成员模板…</option>
          {snap.profiles.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        <Button variant="ghost" size="sm" icon={<PlusIcon />} title="添加成员模板" onClick={onAdd} disabled={busy}>添加</Button>
        <Button variant="ghost" size="sm" icon={<EditIcon />} title="重命名成员模板" onClick={onRename} disabled={draft === null || busy}>重命名</Button>
        <Button variant="ghost" size="sm" icon={<TrashIcon />} title={confirmDelete ? '再次点击确认删除' : '删除成员模板'} onClick={onDelete} disabled={draft === null || busy} className={confirmDelete ? css.danger : undefined}>{confirmDelete ? '确认?' : '删除'}</Button>
      </div>

      {draft === null ? (
        <div className={css.empty}>
          {snap.profiles.length === 0
            ? '还没有成员模板。点击「添加」创建一个：给它起名、写清何时使用、选模型/推理等级/预设，队长就能用 agent_teams_add_member(template="名字") 按模板拉成员。'
            : '选择一个模板进行编辑，或点击「添加」创建新模板。'}
        </div>
      ) : (
        <div className={css.form}>
          <div className={css.field}>
            <span className={css.label}>名称</span>
            {nameEditable ? (
              <input
                className={css.nameInput}
                value={draft.name}
                placeholder="成员模板名（唯一）"
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                disabled={busy}
              />
            ) : (
              <div className={css.nameStatic}>{draft.name}</div>
            )}
          </div>
          <div className={css.field}>
            <span className={css.label}>描述（发给主代理：什么时候才调用这个模板）</span>
            <textarea
              className={css.textarea}
              value={draft.description}
              placeholder="例：扮演女主角林晚时使用；需要剧情推进方案时使用……"
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              disabled={busy}
            />
          </div>
          <div className={css.field}>
            <span className={css.label}>模型</span>
            <select
              className={css.select}
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              disabled={busy}
            >
              <option value="">默认（队长的模型）</option>
              {snap.models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className={css.field}>
            <span className={css.label}>推理等级</span>
            <select
              className={css.select}
              value={draft.reasoningEffort}
              onChange={(e) => setDraft({ ...draft, reasoningEffort: e.target.value })}
              disabled={busy}
            >
              {snap.efforts.map((e) => <option key={e} value={e}>{effortLabel(e)}</option>)}
            </select>
          </div>
          <div className={css.field}>
            <span className={css.label}>预设</span>
            <select
              className={css.select}
              value={draft.preset}
              onChange={(e) => setDraft({ ...draft, preset: e.target.value })}
              disabled={busy}
            >
              <option value="">继承（队长的预设）</option>
              {snap.presets.map((p) => <option key={p} value={p}>{presetLabel(p)}</option>)}
            </select>
          </div>
          <div className={css.actions}>
            <Button variant="primary" size="md" onClick={onSave} disabled={busy || draft.name.trim() === ''}>保存</Button>
            <Button variant="ghost" size="md" onClick={onCancel} disabled={busy}>取消</Button>
          </div>
          <div className={css.hint}>
            保存后，主代理的系统提示里会出现这份模板目录；调用 agent_teams_add_member(template="名字") 即可按模板拉成员（显式传入的 model / preset / persona 优先）。
          </div>
        </div>
      )}
    </div>
  )
}
