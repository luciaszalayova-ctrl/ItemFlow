'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { type FormEvent, useState } from 'react'

type UploadResult = {
  candidateCount: number
}

export default function UploadPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    const file = (form.elements.namedItem('file') as HTMLInputElement).files?.[0]

    if (!file) {
      setError('Bitte waehle ein Bild aus.')
      return
    }

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let message = 'Upload fehlgeschlagen.'

      try {
        const data = (await response.json()) as { error?: string }
        if (typeof data.error === 'string') {
          message = data.error
        }
      } catch {
        // Keep fallback message if server response is not JSON.
      }

      setError(message)
      setUploading(false)
      return
    }

    const data = (await response.json()) as { candidateCount?: number; candidates?: unknown[] }
    setResult({
      candidateCount: data.candidateCount ?? data.candidates?.length ?? 0,
    })
    setUploading(false)
    form.reset()
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
          maxWidth: '44rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}`} style={backLinkStyle}>
          ← Zurueck zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Bild-Upload</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Foto hochladen</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Lade ein einzelnes Bild hoch, damit ItemFlow erste Candidates fuer dieses Projekt
            erkennen kann.
          </p>
        </header>

        <section style={cardStyle}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
            <label style={{ display: 'grid', gap: '0.4rem' }}>
              <span>Bilddatei</span>
              <input
                name="file"
                type="file"
                accept="image/*"
                required
                style={inputStyle}
              />
            </label>

            <button
              type="submit"
              disabled={uploading}
              style={{
                border: 0,
                borderRadius: '999px',
                padding: '0.85rem 1rem',
                background: uploading ? '#8d8476' : '#1f6f5f',
                color: '#ffffff',
                fontWeight: 700,
                cursor: uploading ? 'progress' : 'pointer',
              }}
            >
              {uploading ? 'Wird hochgeladen...' : 'Bild hochladen'}
            </button>
          </form>

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

          {result ? (
            <section style={successCardStyle}>
              <h2 style={{ marginTop: 0 }}>Upload erfolgreich</h2>
              <p style={{ marginTop: 0, lineHeight: 1.6 }}>
                Es wurden <strong>{result.candidateCount}</strong> Candidates erkannt.
              </p>
              <Link href={`/projects/${projectId}/candidates`} style={primaryLinkStyle}>
                Candidates pruefen
              </Link>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  )
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

const inputStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  borderRadius: '0.75rem',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  font: 'inherit',
  boxSizing: 'border-box',
} satisfies React.CSSProperties

const successCardStyle = {
  marginTop: '1rem',
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#eef8f3',
  border: '1px solid #cde6d8',
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
