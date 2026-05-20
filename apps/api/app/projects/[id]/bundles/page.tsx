'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'

type Item = {
  id: string
  title: string
  category: string
  condition: string | null
  status: string
}

type Bundle = {
  id: string
  title: string
  itemIds: string[]
  rationale: string | null
  status: string
}

export default function BundlesPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [bundles, setBundles] = useState<Bundle[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadAll() {
      setLoading(true)
      setError(null)

      const [itemsRes, bundlesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/items`),
        fetch(`/api/projects/${projectId}/bundles`),
      ])

      if (!itemsRes.ok || !bundlesRes.ok) {
        if (!ignore) {
          setError('Daten konnten nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const [itemsData, bundlesData] = await Promise.all([itemsRes.json(), bundlesRes.json()])
      if (!ignore) {
        setItems((itemsData as { items?: Item[] }).items ?? [])
        setBundles((bundlesData as { bundles?: Bundle[] }).bundles ?? [])
        setLoading(false)
      }
    }

    void loadAll()
    return () => {
      ignore = true
    }
  }, [projectId])

  function toggleItem(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedIds.size < 2) {
      setError('Mindestens 2 Items auswählen.')
      return
    }

    setCreating(true)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/bundles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, itemIds: Array.from(selectedIds) }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Bundle konnte nicht erstellt werden.'))
      setCreating(false)
      return
    }

    const data = (await response.json()) as { bundle: Bundle }
    setBundles((current) => [data.bundle, ...current])
    setNewTitle('')
    setSelectedIds(new Set())
    setShowCreateForm(false)
    setCreating(false)
  }

  async function handleAction(bundleId: string, status: 'accepted' | 'rejected') {
    setProcessing(bundleId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/bundles/${bundleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Bundle konnte nicht aktualisiert werden.'))
      setProcessing(null)
      return
    }

    const data = (await response.json()) as { bundle: Bundle }
    setBundles((current) => current.map((bundle) => (bundle.id === bundleId ? data.bundle : bundle)))
    setProcessing(null)
  }

  async function handleGenerateListing(bundleId: string) {
    setProcessing(bundleId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/bundles/${bundleId}/listing`, {
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response, 'Listing konnte nicht generiert werden.'))
      setProcessing(null)
      return
    }

    setBundles((current) =>
      current.map((bundle) =>
        bundle.id === bundleId ? { ...bundle, status: 'listing_created' } : bundle,
      ),
    )
    setProcessing(null)
  }

  const hasNoData = !loading && bundles.length === 0 && items.length === 0

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
          ← Zurueck zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Bundle-Workflow</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Bundles</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Fasse passende Items zu Paketen zusammen, nimm Bundle-Vorschläge an und erzeuge bei
            Bedarf ein gemeinsames Listing.
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

        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            onClick={() => {
              setShowCreateForm((current) => !current)
              setError(null)
            }}
            style={{
              ...buttonStyle,
              background: '#1f6f5f',
              color: '#ffffff',
              border: 0,
              cursor: 'pointer',
            }}
          >
            {showCreateForm ? 'Formular schließen' : 'Bundle erstellen'}
          </button>
        </div>

        {showCreateForm ? (
          <section style={cardStyle}>
            <form onSubmit={handleCreate} style={{ display: 'grid', gap: '1rem' }}>
              <label style={fieldStyle}>
                <span>Titel</span>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.currentTarget.value)}
                  disabled={creating}
                  style={inputStyle}
                />
              </label>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <strong>Items auswählen</strong>
                {items.length === 0 ? (
                  <p style={{ margin: 0, color: '#6f624e' }}>Keine Items verfügbar.</p>
                ) : (
                  items.map((item) => {
                    const disabled =
                      item.status === 'listing_created' || item.status === 'handled' || creating

                    return (
                      <label
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          color: disabled ? '#9b8f7b' : '#5c5346',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleItem(item.id)}
                          disabled={disabled}
                        />
                        <span>
                          {item.title} · {item.category}
                        </span>
                      </label>
                    )
                  })
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={creating || selectedIds.size < 2}
                  style={{
                    ...buttonStyle,
                    background: creating || selectedIds.size < 2 ? '#8d8476' : '#1f6f5f',
                    color: '#ffffff',
                    border: 0,
                    cursor: creating || selectedIds.size < 2 ? 'not-allowed' : 'pointer',
                  }}
                >
                  {creating ? 'Wird erstellt...' : 'Bundle speichern'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setSelectedIds(new Set())
                  }}
                  style={{
                    ...buttonStyle,
                    background: '#fffdf8',
                    color: '#4e463b',
                    border: '1px solid #d8d0c2',
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {loading ? (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Bundles und Items werden geladen...</p>
          </section>
        ) : hasNoData ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Noch keine Daten vorhanden</h2>
            <p style={{ lineHeight: 1.6 }}>
              Zuerst muessen Items erzeugt werden, bevor du daraus Bundles bauen kannst.
            </p>
          </section>
        ) : bundles.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Noch keine Bundles</h2>
            <p style={{ lineHeight: 1.6 }}>
              Nutze das Formular oben, um aus mehreren passenden Items ein Paket zu erstellen.
            </p>
          </section>
        ) : (
          <ul style={listStyle}>
            {bundles.map((bundle) => {
              const isProcessing = processing === bundle.id
              const itemTitles = bundle.itemIds.map(
                (itemId) => items.find((item) => item.id === itemId)?.title ?? itemId,
              )

              return (
                <li key={bundle.id} style={cardStyle}>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{bundle.title}</h2>
                      <span style={metaPillStyle}>{formatStatus(bundle.status)}</span>
                    </div>

                    {bundle.rationale ? (
                      <p style={{ margin: 0, color: '#6f624e', lineHeight: 1.5 }}>{bundle.rationale}</p>
                    ) : null}

                    <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#5c5346' }}>
                      {itemTitles.map((title, index) => (
                        <li key={`${bundle.id}-${index}`}>{title}</li>
                      ))}
                    </ul>

                    {bundle.status === 'suggested' ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleAction(bundle.id, 'accepted')}
                          disabled={isProcessing}
                          style={{
                            ...buttonStyle,
                            background: isProcessing ? '#8d8476' : '#1f6f5f',
                            color: '#ffffff',
                            border: 0,
                            cursor: isProcessing ? 'progress' : 'pointer',
                          }}
                        >
                          {isProcessing ? 'Bitte warten...' : 'Akzeptieren'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAction(bundle.id, 'rejected')}
                          disabled={isProcessing}
                          style={{
                            ...buttonStyle,
                            background: '#fff4f2',
                            color: '#9a2f1f',
                            border: '1px solid #efc6c0',
                            cursor: isProcessing ? 'progress' : 'pointer',
                            opacity: isProcessing ? 0.7 : 1,
                          }}
                        >
                          Ablehnen
                        </button>
                      </div>
                    ) : null}

                    {bundle.status === 'accepted' ? (
                      <button
                        type="button"
                        onClick={() => handleGenerateListing(bundle.id)}
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
                    ) : null}

                    {bundle.status === 'listing_created' ? (
                      <Link href={`/projects/${projectId}/listings`} style={textLinkStyle}>
                        Listing ansehen →
                      </Link>
                    ) : null}

                    {bundle.status === 'rejected' ? (
                      <p style={{ margin: 0, color: '#8a7d67' }}>Abgelehnt</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
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

function formatStatus(status: string) {
  switch (status) {
    case 'suggested':
      return 'Vorschlag'
    case 'accepted':
      return 'Akzeptiert'
    case 'rejected':
      return 'Abgelehnt'
    case 'listing_created':
      return 'Listing erstellt'
    default:
      return status
  }
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

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.8rem 1rem',
  borderRadius: '999px',
  fontWeight: 700,
} satisfies React.CSSProperties

const textLinkStyle = {
  color: '#245c9a',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const fieldStyle = {
  display: 'grid',
  gap: '0.4rem',
  color: '#5c5346',
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
