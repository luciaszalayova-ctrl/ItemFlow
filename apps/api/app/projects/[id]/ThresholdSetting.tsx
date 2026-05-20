'use client'

import { useState } from 'react'

type Props = { projectId: string; initialThreshold: number }

export function ThresholdSetting({ projectId, initialThreshold }: Props) {
  const [threshold, setThreshold] = useState(initialThreshold)
  const [draft, setDraft] = useState(String(Math.round(initialThreshold * 100)))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    const value = Number(draft) / 100
    if (isNaN(value) || value < 0 || value > 1) return

    setSaving(true)
    const response = await fetch(`/api/projects/${projectId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { autoAcceptThreshold: value } }),
    })

    if (response.ok) {
      setThreshold(value)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  return (
    <div style={containerStyle}>
      <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#5c5346' }}>
        Auto-Accept-Schwellenwert
      </p>
      <p style={{ margin: '0 0 0.75rem', color: '#7b6f5b', fontSize: '0.9rem', lineHeight: 1.5 }}>
        Kandidaten mit Konfidenz ≥ {Math.round(threshold * 100)} % werden beim Import automatisch übernommen.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="number"
          min={0}
          max={100}
          step={5}
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          disabled={saving}
          style={inputStyle}
        />
        <span style={{ color: '#5c5346' }}>%</span>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={{
            ...buttonStyle,
            background: saved ? '#1f6f5f' : saving ? '#8d8476' : '#245c9a',
            color: '#fff',
          }}
        >
          {saved ? 'Gespeichert ✓' : saving ? '…' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}

const containerStyle = {
  marginTop: '1.5rem',
  padding: '1.25rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
} satisfies React.CSSProperties

const inputStyle = {
  width: '5rem',
  padding: '0.5rem 0.6rem',
  borderRadius: '0.6rem',
  border: '1px solid #cfc4b2',
  background: '#fffdf8',
  color: '#2d2a24',
  fontSize: '1rem',
  textAlign: 'right' as const,
} satisfies React.CSSProperties

const buttonStyle = {
  padding: '0.5rem 1rem',
  borderRadius: '999px',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties
