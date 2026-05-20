'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type ChangeEvent, type FormEvent, useEffect, useState } from 'react'

type ListingDraft = {
  id: string
  title: string
  description: string
  priceCents: number
  minimumPriceCents: number | null
  category: string | null
  shippingMode: string | null
  pickupOnly: boolean
  status: string
}

export default function EditListingPage() {
  const { id: projectId, lid } = useParams<{ id: string; lid: string }>()
  const [listing, setListing] = useState<ListingDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let ignore = false

    async function load() {
      const response = await fetch(`/api/projects/${projectId}/listings/${lid}`)
      if (!response.ok) {
        if (!ignore) {
          setError('Listing konnte nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const data = (await response.json()) as { listing: ListingDraft }
      if (!ignore) {
        setListing(data.listing)
        setLoading(false)
      }
    }

    void load()
    return () => {
      ignore = true
    }
  }, [projectId, lid])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!listing) {
      return
    }

    setSaving(true)
    setError(null)
    setSaved(false)

    const response = await fetch(`/api/projects/${projectId}/listings/${lid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: listing.title,
        description: listing.description,
        priceCents: listing.priceCents,
        minimumPriceCents: listing.minimumPriceCents,
        category: listing.category || null,
        shippingMode: listing.shippingMode || null,
        pickupOnly: listing.pickupOnly,
      }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Listing konnte nicht gespeichert werden.'))
      setSaving(false)
      return
    }

    const data = (await response.json()) as { listing: ListingDraft }
    setListing(data.listing)
    setSaved(true)
    setSaving(false)
  }

  function updateField<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
    setListing((current) => (current ? { ...current, [key]: value } : current))
    setSaved(false)
  }

  function handleEuroChange(
    key: 'priceCents' | 'minimumPriceCents',
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = event.currentTarget.value

    if (key === 'minimumPriceCents' && value.trim() === '') {
      updateField(key, null)
      return
    }

    const numberValue = Number(value)
    if (Number.isNaN(numberValue) || numberValue < 0) {
      return
    }

    updateField(key, Math.round(numberValue * 100) as ListingDraft[typeof key])
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
        <Link href={`/projects/${projectId}/listings`} style={backLinkStyle}>
          ← Zurueck zu den Listings
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Listing-Bearbeitung</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Listing bearbeiten</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Passe Titel, Beschreibung und Preis an, bevor du das Listing freigibst.
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
            <p style={{ margin: 0 }}>Listing wird geladen...</p>
          </section>
        ) : listing ? (
          <section style={cardStyle}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
              <label style={fieldStyle}>
                <span>Titel</span>
                <input
                  type="text"
                  maxLength={80}
                  value={listing.title}
                  onChange={(event) => updateField('title', event.currentTarget.value)}
                  disabled={saving}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span>Beschreibung</span>
                <textarea
                  rows={6}
                  maxLength={2000}
                  value={listing.description}
                  onChange={(event) => updateField('description', event.currentTarget.value)}
                  disabled={saving}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '10rem' }}
                />
              </label>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Preis (€)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={(listing.priceCents / 100).toFixed(2)}
                    onChange={(event) => handleEuroChange('priceCents', event)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Mindestpreis (€ , optional)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      listing.minimumPriceCents === null
                        ? ''
                        : (listing.minimumPriceCents / 100).toFixed(2)
                    }
                    onChange={(event) => handleEuroChange('minimumPriceCents', event)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>
              </div>

              <div style={gridStyle}>
                <label style={fieldStyle}>
                  <span>Kategorie (optional)</span>
                  <input
                    type="text"
                    value={listing.category ?? ''}
                    onChange={(event) => updateField('category', event.currentTarget.value || null)}
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>

                <label style={fieldStyle}>
                  <span>Versandmodus (optional)</span>
                  <input
                    type="text"
                    value={listing.shippingMode ?? ''}
                    onChange={(event) =>
                      updateField('shippingMode', event.currentTarget.value || null)
                    }
                    disabled={saving}
                    style={inputStyle}
                  />
                </label>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: '#5c5346',
                }}
              >
                <input
                  type="checkbox"
                  checked={listing.pickupOnly}
                  onChange={(event) => updateField('pickupOnly', event.currentTarget.checked)}
                  disabled={saving}
                />
                Nur Abholung
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
                  {saving ? 'Speichert...' : 'Aenderungen speichern'}
                </button>
              </div>
            </form>
          </section>
        ) : (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Kein Listing gefunden.</p>
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
