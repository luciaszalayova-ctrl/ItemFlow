'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

type InventoryItem = {
  id: string
  title: string
  category: string
  brand: string | null
  model: string | null
  condition: string | null
  quantity: number
  description: string | null
  defects: string | null
  completeness: string | null
  scoringRecommendation?: string | null
  scoringOverride?: string | null
  status: string
}

export default function EditItemPage() {
  const { id: projectId, iid } = useParams<{ id: string; iid: string }>()
  const [item, setItem] = useState<InventoryItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let ignore = false

    async function load() {
      const response = await fetch(`/api/projects/${projectId}/items/${iid}`)
      if (!response.ok) {
        if (!ignore) {
          setError('Item konnte nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const data = (await response.json()) as { item: InventoryItem }
      if (!ignore) {
        setItem(data.item)
        setLoading(false)
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [projectId, iid])

  function updateField<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
    setItem((current) => (current ? { ...current, [key]: value } : current))
    setSaved(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!item) {
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    const response = await fetch(`/api/projects/${projectId}/items/${iid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: item.title,
        category: item.category,
        brand: item.brand || null,
        model: item.model || null,
        condition: item.condition || null,
        quantity: item.quantity,
        description: item.description || null,
        defects: item.defects || null,
        completeness: item.completeness || null,
        scoringOverride: item.scoringOverride ?? null,
      }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Item konnte nicht gespeichert werden.'))
      setSaving(false)
      return
    }

    const data = (await response.json()) as { item: InventoryItem }
    setItem(data.item)
    setSaved(true)
    setSaving(false)
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f5f1e8 0%, #fffdf8 100%)',
        color: '#2d2a24',
      }}
    >
      <section
        style={{
          maxWidth: '52rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}/items`} style={backLinkStyle}>
          ← Zurück zu den Items
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Item-Bearbeitung</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Item bearbeiten</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Korrigiere erkannte Daten wie Marke, Zustand und Beschreibung, bevor das Scoring darauf
            aufbaut.
          </p>
        </header>

        {error ? (
          <p
            role="alert"
            style={{
              marginTop: '1rem',
              marginBottom: 0,
              padding: '0.75rem 0.9rem',
              borderRadius: '0.75rem',
              background: '#fde9e7',
              color: '#9a2f1f',
            }}
          >
            {error}
          </p>
        ) : null}

        {saved ? (
          <p
            style={{
              marginTop: '1rem',
              marginBottom: 0,
              padding: '0.75rem 0.9rem',
              borderRadius: '0.75rem',
              background: '#eef8f3',
              color: '#1f6f5f',
              fontWeight: 700,
            }}
          >
            Gespeichert ✓
          </p>
        ) : null}

        {loading ? (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Item wird geladen...</p>
          </section>
        ) : item ? (
          <section style={cardStyle}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <label style={fieldStyle}>
                <span>Titel</span>
                <input
                  type="text"
                  maxLength={200}
                  required
                  value={item.title}
                  onChange={(event) => updateField('title', event.currentTarget.value)}
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span>Kategorie</span>
                <input
                  type="text"
                  required
                  value={item.category}
                  onChange={(event) => updateField('category', event.currentTarget.value)}
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Marke (optional)</span>
                  <input
                    type="text"
                    value={item.brand ?? ''}
                    onChange={(event) => updateField('brand', event.currentTarget.value || null)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Modell (optional)</span>
                  <input
                    type="text"
                    value={item.model ?? ''}
                    onChange={(event) => updateField('model', event.currentTarget.value || null)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Zustand (optional)</span>
                  <input
                    type="text"
                    value={item.condition ?? ''}
                    onChange={(event) =>
                      updateField('condition', event.currentTarget.value || null)
                    }
                    disabled={saving}
                    placeholder="z. B. Sehr gut, Gut, Akzeptabel"
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Anzahl</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={item.quantity}
                    onChange={(event) =>
                      updateField('quantity', Math.max(1, Number(event.currentTarget.value) || 1))
                    }
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={fieldStyle}>
                <span>Beschreibung (optional)</span>
                <textarea
                  rows={4}
                  value={item.description ?? ''}
                  onChange={(event) =>
                    updateField('description', event.currentTarget.value || null)
                  }
                  disabled={saving}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '8rem' }}
                />
              </label>

              {item.scoringRecommendation ? (
                <div style={fieldStyle}>
                  <span>Empfehlung der Engine</span>
                  <p style={{ margin: 0, color: '#5c5346' }}>
                    {labelFor(item.scoringRecommendation)}
                  </p>

                  <span style={{ marginTop: '0.5rem' }}>Meine Entscheidung (optional)</span>
                  <select
                    value={item.scoringOverride ?? ''}
                    onChange={(event) =>
                      updateField('scoringOverride', event.currentTarget.value || null)
                    }
                    disabled={saving}
                    style={inputStyle}
                  >
                    <option value="">— Engine-Empfehlung übernehmen —</option>
                    <option value="sell_individually">Einzeln verkaufen</option>
                    <option value="bundle">Bündeln</option>
                    <option value="donate">Spenden</option>
                    <option value="give_away">Verschenken</option>
                    <option value="recycle_dispose">Recyceln / Entsorgen</option>
                  </select>
                </div>
              ) : null}

              <label style={fieldStyle}>
                <span>Mängel (optional)</span>
                <textarea
                  rows={3}
                  value={item.defects ?? ''}
                  onChange={(event) => updateField('defects', event.currentTarget.value || null)}
                  disabled={saving}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '6rem' }}
                />
              </label>

              <label style={fieldStyle}>
                <span>Vollständigkeit (optional)</span>
                <input
                  type="text"
                  value={item.completeness ?? ''}
                  onChange={(event) =>
                    updateField('completeness', event.currentTarget.value || null)
                  }
                  disabled={saving}
                  placeholder="z. B. Komplett, Ohne Zubehör"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...primaryButtonStyle,
                    background: saving ? '#8d8476' : '#1f6f5f',
                    cursor: saving ? 'progress' : 'pointer',
                  }}
                >
                  {saving ? 'Speichert...' : 'Änderungen speichern'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Kein Item gefunden.</p>
          </section>
        )}
      </section>
    </main>
  )
}

async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string }
    return typeof data.error === 'string' ? data.error : fallback
  } catch {
    return fallback
  }
}

function labelFor(recommendation: string): string {
  const labels: Record<string, string> = {
    sell_individually: 'Einzeln verkaufen',
    bundle: 'Bündeln',
    donate: 'Spenden',
    give_away: 'Verschenken',
    recycle_dispose: 'Recyceln / Entsorgen',
    needs_review: 'Prüfen',
  }

  return labels[recommendation] ?? recommendation
}

const backLinkStyle = {
  color: '#1f6f5f',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const cardStyle = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
  boxShadow: '0 0.75rem 1.5rem rgba(49, 40, 27, 0.05)',
} satisfies React.CSSProperties

const fieldStyle = {
  display: 'grid',
  gap: '0.4rem',
  color: '#5c5346',
} satisfies React.CSSProperties

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
  gap: '1rem',
} satisfies React.CSSProperties

const inputStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  borderRadius: '0.75rem',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  font: 'inherit',
  boxSizing: 'border-box',
} satisfies React.CSSProperties

const primaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  color: '#ffffff',
  border: 0,
  fontWeight: 700,
} satisfies React.CSSProperties
