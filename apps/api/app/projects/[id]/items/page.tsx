'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Item = {
  id: string
  title: string
  category: string | null
  condition: string | null
  status: string
}

type Recommendation = {
  action: string
  confidence: string
  rationale: string | null
  expectedPriceCents: number | null
  minimumPriceCents?: number | null
  isSensitiveCategory: boolean
}

export default function ItemsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, Recommendation>>({})
  const [showAddForm, setShowAddForm] = useState(false)
  const [addTitle, setAddTitle] = useState('')
  const [addCategory, setAddCategory] = useState('')
  const [adding, setAdding] = useState(false)
  const [hideDone, setHideDone] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadItems() {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/items`)
      if (!response.ok) {
        if (!ignore) {
          setError('Items konnten nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const data = (await response.json()) as { items?: Item[] }
      if (!ignore) {
        setItems(data.items ?? [])
        setLoading(false)
      }
    }

    void loadItems()

    return () => {
      ignore = true
    }
  }, [projectId])

  async function handleScore(itemId: string) {
    setProcessing(itemId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/items/${itemId}/score`, {
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response, 'Item konnte nicht bewertet werden.'))
      setProcessing(null)
      return
    }

    const data = (await response.json()) as { recommendation: Recommendation }
    setScores((current) => ({
      ...current,
      [itemId]: data.recommendation,
    }))
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: 'scored' } : item)),
    )
    setProcessing(null)
  }

  async function handleGenerateListing(itemId: string) {
    setProcessing(itemId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/items/${itemId}/listing`, {
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response, 'Listing konnte nicht erstellt werden.'))
      setProcessing(null)
      return
    }

    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, status: 'listing_created' } : item,
      ),
    )
    setProcessing(null)
  }

  async function handleAddItem() {
    if (!addTitle.trim()) {
      return
    }

    setAdding(true)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: addTitle.trim(),
        ...(addCategory.trim() ? { category: addCategory.trim() } : {}),
      }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Item konnte nicht angelegt werden.'))
      setAdding(false)
      return
    }

    const data = (await response.json()) as { item: Item }
    setItems((current) => [...current, data.item])
    setAddTitle('')
    setAddCategory('')
    setShowAddForm(false)
    setAdding(false)
  }

  async function handleToggleDone(itemId: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'ready_for_scoring' : 'done'

    setProcessing(itemId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Item konnte nicht aktualisiert werden.'))
      setProcessing(null)
      return
    }

    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
    )
    setProcessing(null)
  }

  const hasListings = items.some((item) => item.status === 'listing_created')
  const visibleItems = hideDone ? items.filter((item) => item.status !== 'done') : items

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
          maxWidth: '60rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}`} style={backLinkStyle}>
          ← Zurück zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Items-Workflow</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Items</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Bewerte akzeptierte Items direkt hier und erzeuge im nächsten Schritt passende
            Listing-Entwürfe.
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

        {!loading && items.length > 0 ? (
          <label
            style={{
              marginTop: '1.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#5c5346',
            }}
          >
            <input
              type="checkbox"
              checked={hideDone}
              onChange={(event) => setHideDone(event.currentTarget.checked)}
            />
            Erledigte ausblenden
          </label>
        ) : null}

        {loading ? (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Items werden geladen...</p>
          </section>
        ) : items.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Noch keine Items</h2>
            <p style={{ lineHeight: 1.6 }}>
              Zuerst müssen Candidates bestätigt werden, bevor hier Items auftauchen.
            </p>
            <Link href={`/projects/${projectId}/candidates`} style={primaryLinkStyle}>
              Zu den Candidates
            </Link>
          </section>
        ) : visibleItems.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Alle sichtbaren Items erledigt</h2>
            <p style={{ lineHeight: 1.6 }}>
              Aktiviere die Anzeige erledigter Items, um abgeschlossene Einträge wieder
              einzublenden.
            </p>
          </section>
        ) : (
          <ul style={listStyle}>
            {visibleItems.map((item) => {
              const score = scores[item.id]
              const isProcessing = processing === item.id

              return (
                <li key={item.id} style={cardStyle}>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{item.title}</h2>
                        <p style={{ margin: '0.35rem 0 0', color: '#6f624e' }}>
                          {item.category || 'Ohne Kategorie'}
                          {item.condition ? ` · ${item.condition}` : ''}
                        </p>
                      </div>
                      <span style={metaPillStyle}>{formatStatus(item.status)}</span>
                    </div>

                    {item.status === 'ready_for_scoring' ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleScore(item.id)}
                          disabled={isProcessing}
                          style={{
                            ...buttonStyle,
                            background: isProcessing ? '#8d8476' : '#1f6f5f',
                            color: '#ffffff',
                            border: 0,
                            cursor: isProcessing ? 'progress' : 'pointer',
                          }}
                        >
                          {isProcessing ? 'Bitte warten...' : 'Bewerten'}
                        </button>
                      </div>
                    ) : null}

                    {score ? (
                      <section style={scoreCardStyle}>
                        <p style={{ marginTop: 0, marginBottom: '0.4rem' }}>
                          Empfehlung: <strong>{score.action}</strong> ({score.confidence})
                        </p>
                        {score.rationale ? (
                          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.5 }}>
                            {score.rationale}
                          </p>
                        ) : null}
                        {score.expectedPriceCents !== null ? (
                          <p style={{ marginTop: 0, marginBottom: '0.4rem' }}>
                            Erwarteter Preis: {formatEuro(score.expectedPriceCents)}
                          </p>
                        ) : null}
                        {score.isSensitiveCategory ? (
                          <p
                            role="alert"
                            style={{
                              marginTop: 0,
                              marginBottom: '0.8rem',
                              padding: '0.75rem 0.9rem',
                              borderRadius: '0.75rem',
                              background: '#fff0cc',
                              color: '#7a4d00',
                            }}
                          >
                            Sensible Kategorie — bitte Listing sorgfältig prüfen.
                          </p>
                        ) : null}
                      </section>
                    ) : null}

                    {item.status === 'scored' ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleGenerateListing(item.id)}
                          disabled={isProcessing}
                          style={{
                            ...buttonStyle,
                            background: isProcessing ? '#8d8476' : '#245c9a',
                            color: '#ffffff',
                            border: 0,
                            cursor: isProcessing ? 'progress' : 'pointer',
                          }}
                        >
                          {isProcessing ? 'Bitte warten...' : 'Listing erstellen'}
                        </button>
                      </div>
                    ) : null}

                    {item.status === 'listing_created' ? (
                      <Link href={`/projects/${projectId}/listings`} style={textLinkStyle}>
                        Listing ansehen →
                      </Link>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleToggleDone(item.id, item.status)}
                      disabled={isProcessing || item.status === 'listing_created'}
                      style={
                        item.status === 'done'
                          ? {
                              ...doneButtonActiveStyle,
                              cursor: isProcessing ? 'progress' : 'pointer',
                              opacity: isProcessing ? 0.7 : 1,
                            }
                          : {
                              ...doneButtonStyle,
                              cursor:
                                isProcessing || item.status === 'listing_created'
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity:
                                isProcessing || item.status === 'listing_created' ? 0.7 : 1,
                            }
                      }
                    >
                      {item.status === 'done' ? 'Erledigt ✓' : 'Als erledigt markieren'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {!loading && hasListings ? (
          <div style={{ marginTop: '2rem' }}>
            <Link href={`/projects/${projectId}/listings`} style={primaryLinkStyle}>
              Zu den Listings
            </Link>
          </div>
        ) : null}

        {!loading ? (
          <section style={{ marginTop: '2rem' }}>
            {!showAddForm ? (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                style={secondaryButtonStyle}
              >
                + Item manuell hinzufügen
              </button>
            ) : (
              <div style={cardStyle}>
                <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Item hinzufügen</h2>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 700 }}>Bezeichnung *</span>
                    <input
                      value={addTitle}
                      onChange={(event) => setAddTitle(event.currentTarget.value)}
                      placeholder="z. B. IKEA Kallax Regal"
                      style={inputStyle}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 700 }}>Kategorie</span>
                    <input
                      value={addCategory}
                      onChange={(event) => setAddCategory(event.currentTarget.value)}
                      placeholder="z. B. Möbel"
                      style={inputStyle}
                    />
                  </label>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => void handleAddItem()}
                      disabled={adding || !addTitle.trim()}
                      style={{
                        ...buttonStyle,
                        background: adding || !addTitle.trim() ? '#8d8476' : '#1f6f5f',
                        color: '#ffffff',
                        border: 0,
                        cursor: adding || !addTitle.trim() ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {adding ? 'Wird angelegt...' : 'Hinzufügen'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setAddTitle('')
                        setAddCategory('')
                      }}
                      style={secondaryButtonStyle}
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}
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

function formatStatus(status: string) {
  switch (status) {
    case 'done':
      return 'Erledigt'
    case 'ready_for_scoring':
      return 'Bereit für Scoring'
    case 'listing_created':
      return 'Listing erstellt'
    case 'scored':
      return 'Bewertet'
    case 'draft':
      return 'Entwurf'
    default:
      return status
  }
}

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2)} €`
}

const backLinkStyle = {
  color: '#1f6f5f',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '2rem 0 0',
  display: 'grid',
  gap: '1rem',
} satisfies React.CSSProperties

const cardStyle = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
  boxShadow: '0 0.75rem 1.5rem rgba(49, 40, 27, 0.05)',
} satisfies React.CSSProperties

const emptyCardStyle = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px dashed #cdbfa9',
  background: '#fffaf0',
} satisfies React.CSSProperties

const metaPillStyle = {
  alignSelf: 'flex-start',
  padding: '0.35rem 0.65rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#6f624e',
  fontSize: '0.9rem',
} satisfies React.CSSProperties

const scoreCardStyle = {
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#f3f8ff',
  border: '1px solid #d6e3f5',
} satisfies React.CSSProperties

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.8rem 1rem',
  borderRadius: '999px',
  fontWeight: 700,
} satisfies React.CSSProperties

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.8rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#4e463b',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties

const doneButtonStyle = {
  padding: '0.5rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  color: '#5c5346',
  fontWeight: 700,
} satisfies React.CSSProperties

const doneButtonActiveStyle = {
  padding: '0.5rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid #a8d5c2',
  background: '#eef8f3',
  color: '#1f6f5f',
  fontWeight: 700,
} satisfies React.CSSProperties

const inputStyle = {
  width: '100%',
  padding: '0.85rem 0.95rem',
  borderRadius: '0.85rem',
  border: '1px solid #cfc4b2',
  background: '#fffdf8',
  color: '#2d2a24',
} satisfies React.CSSProperties

const primaryLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  background: '#1f6f5f',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const textLinkStyle = {
  color: '#245c9a',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties
