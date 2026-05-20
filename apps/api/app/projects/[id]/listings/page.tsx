'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type ListingDraft = {
  id: string
  title: string
  description: string
  priceCents: number
  minimumPriceCents: number | null
  category: string | null
  platform: string
  status: string
}

type ExportedListing = {
  id: string
  platform: string
  title: string
  description: string
  priceCents: number
  minimumPriceCents: number | null
  category: string | null
  pickupOnly: boolean
  shippingMode: string | null
  photoAssetIds: string[]
}

type ExportResult = {
  exported: ExportedListing[]
  count: number
}

export default function ListingsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [listings, setListings] = useState<ListingDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadListings() {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/listings`)
      if (!response.ok) {
        if (!ignore) {
          setError('Listings konnten nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const data = (await response.json()) as { listings?: ListingDraft[] }
      if (!ignore) {
        setListings(data.listings ?? [])
        setLoading(false)
      }
    }

    void loadListings()

    return () => {
      ignore = true
    }
  }, [projectId])

  const reviewedCount = useMemo(
    () => listings.filter((listing) => listing.status === 'reviewed').length,
    [listings],
  )

  async function handleApprove(listingId: string) {
    setProcessing(listingId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/listings/${listingId}/approve`, {
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response, 'Listing konnte nicht freigegeben werden.'))
      setProcessing(null)
      return
    }

    setListings((current) =>
      current.map((listing) =>
        listing.id === listingId ? { ...listing, status: 'reviewed' } : listing,
      ),
    )
    setProcessing(null)
  }

  async function handleExport() {
    setExporting(true)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/listings/export`, {
      method: 'POST',
    })

    if (!response.ok) {
      setError(await readError(response, 'Listings konnten nicht exportiert werden.'))
      setExporting(false)
      return
    }

    const data = (await response.json()) as ExportResult
    setExportResult(data)
    setListings((current) =>
      current.map((listing) =>
        listing.status === 'reviewed' ? { ...listing, status: 'exported' } : listing,
      ),
    )
    setExporting(false)
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
          maxWidth: '60rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}`} style={backLinkStyle}>
          ← Zurueck zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Listing-Workflow</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Listings</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Pruefe erzeugte Entwuerfe, gib passende Listings frei und exportiere sie als JSON fuer
            den manuellen Upload.
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

        {!loading && reviewedCount > 0 ? (
          <div style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              style={{
                ...buttonStyle,
                background: exporting ? '#8d8476' : '#245c9a',
                color: '#ffffff',
                border: 0,
                cursor: exporting ? 'progress' : 'pointer',
              }}
            >
              {exporting
                ? 'Wird exportiert...'
                : `${reviewedCount} freigegebene Listings exportieren`}
            </button>
          </div>
        ) : null}

        {exportResult ? (
          <section style={exportCardStyle}>
            <h2 style={{ marginTop: 0 }}>{exportResult.count} Listings exportiert</h2>
            <pre
              style={{
                margin: 0,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontSize: '0.9rem',
              }}
            >
              {JSON.stringify(exportResult.exported, null, 2)}
            </pre>
          </section>
        ) : null}

        {loading ? (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Listings werden geladen...</p>
          </section>
        ) : listings.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Noch keine Listings</h2>
            <p style={{ lineHeight: 1.6 }}>
              Zuerst muessen Items bewertet und Listing-Entwuerfe erzeugt werden.
            </p>
            <Link href={`/projects/${projectId}/items`} style={primaryLinkStyle}>
              Zu den Items
            </Link>
          </section>
        ) : (
          <ul style={listStyle}>
            {listings.map((listing) => {
              const isProcessing = processing === listing.id

              return (
                <li key={listing.id} style={cardStyle}>
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
                        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{listing.title}</h2>
                        <p style={{ margin: '0.35rem 0 0', color: '#6f624e' }}>
                          {listing.platform}
                          {listing.category ? ` · ${listing.category}` : ''}
                        </p>
                      </div>
                      <span style={metaPillStyle}>{formatStatus(listing.status)}</span>
                    </div>

                    <p style={{ margin: 0, color: '#5c5346', lineHeight: 1.5 }}>
                      {listing.description}
                    </p>

                    <p style={{ margin: 0 }}>
                      Preis: <strong>{formatEuro(listing.priceCents)}</strong>
                      {listing.minimumPriceCents !== null
                        ? ` · Mindestpreis ${formatEuro(listing.minimumPriceCents)}`
                        : ''}
                    </p>

                    {listing.status === 'draft' ? (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleApprove(listing.id)}
                          disabled={isProcessing}
                          style={{
                            ...buttonStyle,
                            background: isProcessing ? '#8d8476' : '#1f6f5f',
                            color: '#ffffff',
                            border: 0,
                            cursor: isProcessing ? 'progress' : 'pointer',
                          }}
                        >
                          {isProcessing ? 'Bitte warten...' : 'Freigeben'}
                        </button>
                        <Link
                          href={`/projects/${projectId}/listings/${listing.id}/edit`}
                          style={textLinkStyle}
                        >
                          Bearbeiten →
                        </Link>
                      </div>
                    ) : null}

                    {listing.status === 'reviewed' ? (
                      <>
                        <p style={{ margin: 0, color: '#1f6f5f', fontWeight: 700 }}>
                          ✓ Freigegeben
                        </p>
                        <Link
                          href={`/projects/${projectId}/listings/${listing.id}/edit`}
                          style={textLinkStyle}
                        >
                          Bearbeiten →
                        </Link>
                      </>
                    ) : null}

                    {listing.status === 'exported' ? (
                      <p style={{ margin: 0, color: '#245c9a', fontWeight: 700 }}>✓ Exportiert</p>
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
    case 'listing_created':
      return 'Listing erstellt'
    case 'reviewed':
      return 'Freigegeben'
    case 'exported':
      return 'Exportiert'
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

const exportCardStyle = {
  marginTop: '1.5rem',
  padding: '1rem',
  borderRadius: '1rem',
  background: '#f3f8ff',
  border: '1px solid #d6e3f5',
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
