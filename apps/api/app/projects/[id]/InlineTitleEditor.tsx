'use client'

import { useState } from 'react'

type Props = { projectId: string; initialTitle: string }

export function InlineTitleEditor({ projectId, initialTitle }: Props) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [draft, setDraft] = useState(initialTitle)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === title) {
      setDraft(title)
      setEditing(false)
      return
    }

    setSaving(true)
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: trimmed }),
    })

    if (response.ok) {
      setTitle(trimmed)
    } else {
      setDraft(title)
    }

    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleSave()
            if (e.key === 'Escape') { setDraft(title); setEditing(false) }
          }}
          disabled={saving}
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            padding: '0.3rem 0.6rem',
            borderRadius: '0.6rem',
            border: '2px solid #1f6f5f',
            background: '#fffdf8',
            color: '#2d2a24',
            minWidth: '16rem',
          }}
        />
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={saveButtonStyle}
        >
          {saving ? '…' : 'Speichern'}
        </button>
        <button
          type="button"
          onClick={() => { setDraft(title); setEditing(false) }}
          disabled={saving}
          style={cancelButtonStyle}
        >
          Abbrechen
        </button>
      </div>
    )
  }

  return (
    <h1
      title="Klicken zum Bearbeiten"
      onClick={() => { setDraft(title); setEditing(true) }}
      style={{ marginTop: '0.5rem', marginBottom: '0.75rem', cursor: 'text' }}
    >
      {title} <span style={{ fontSize: '0.9rem', color: '#aaa', fontWeight: 400 }}>✎</span>
    </h1>
  )
}

const saveButtonStyle = {
  padding: '0.4rem 0.9rem',
  borderRadius: '999px',
  background: '#1f6f5f',
  color: '#fff',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties

const cancelButtonStyle = {
  padding: '0.4rem 0.9rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#4e463b',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties
