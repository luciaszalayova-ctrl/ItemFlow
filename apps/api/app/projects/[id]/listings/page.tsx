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
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  async function handleCopyAll() {
    await navigator.clipboard.writeText(JSON.stringify(exportResult?.exported, null, 2))
  }

  function handleDownload() {
    if (!exportResult) return

    const json = JSON.stringify(exportResult.exported, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = 'listings-export.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopyListing(listing: ExportedListing) {
    const text = [
      listing.title,
      '',
      listing.description,
      '',
      `Preis: ${(listing.priceCents / 100).toFixed(2)} €`,
    ].join('\n')

    await navigator.clipboard.writeText(text)
    setCopiedId(listing.id)
    setTimeout(() => {
      setCopiedId((current) => (current === listing.id ? null : current))
    }, 2000)
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
          ← Zurück zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Listing-Workflow</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Listings</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Prüfe erzeugte Entwürfe, gib passende Listings frei und exportiere sie als JSON für
            den manuellen Upload.
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href={`/api/projects/${projectId}/export?format=json`} download style={exportLinkStyle}>
              Als JSON exportieren
            </a>
            <a href={`/api/projects/${projectId}/export?format=csv`} download style={exportLinkStyle}>
              Als CSV exportieren
            </a>
          </div>
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <h2 style={{ margin: 0 }}>{exportResult.count} Listings exportiert</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => void handleCopyAll()} style={secondaryButtonStyle}>
                  Alle kopieren
                </button>
                <button type="button" onClick={handleDownload} style={secondaryButtonStyle}>
                  Als JSON herunterladen
                </button>
              </div>
            </div>
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
              Zuerst müssen Items bewertet und Listing-Entwürfe erzeugt werden.
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
                      <div style={{ display: 'grid', gap: '0.75rem' }}>
                        <p style={{ margin: 0, color: '#245c9a', fontWeight: 700 }}>
                          ✓ Exportiert
                        </p>
                        {exportResult ? (
                          <button
                            type="button"
                            onClick={() => {
                              const exported = exportResult.exported.find((entry) => entry.id === listing.id)
                              if (exported) void handleCopyListing(exported)
                            }}
                            style={{
                              ...buttonStyle,
                              background: copiedId === listing.id ? '#1f6f5f' : '#efe6d6',
                              color: copiedId === listing.id ? '#ffffff' : '#4e463b',
                              border: 0,
                              cursor: 'pointer',
                            }}
                          >
                            {copiedId === listing.id ? 'Kopiert ✓' : 'Text kopieren'}
                          </button>
                        ) : null}
                      </div>
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

const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.7rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#4e463b',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
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

const exportLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#2d2a24',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
} satisfies React.CSSProperties
