'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type Candidate = {
  id: string
  rawLabel: string
  normalizedName: string
  category: string
  confidence: number
  status: string
}

export default function CandidatesPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let ignore = false

    async function loadCandidates() {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/projects/${projectId}/candidates?status=pending`)

      if (!response.ok) {
        if (!ignore) {
          setError('Candidates konnten nicht geladen werden.')
          setLoading(false)
        }
        return
      }

      const data = (await response.json()) as { candidates?: Candidate[] }
      if (!ignore) {
        setCandidates(data.candidates ?? [])
        setLoading(false)
      }
    }

    void loadCandidates()

    return () => {
      ignore = true
    }
  }, [projectId])

  async function handleAction(candidateId: string, action: 'accept' | 'reject') {
    setProcessing(candidateId)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/candidates/${candidateId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })

    if (!response.ok) {
      let message = 'Candidate konnte nicht verarbeitet werden.'

      try {
        const data = (await response.json()) as { error?: string }
        if (typeof data.error === 'string') {
          message = data.error
        }
      } catch {
        // Keep fallback message if server response is not JSON.
      }

      setError(message)
      setProcessing(null)
      return
    }

    setCandidates((current) => current.filter((candidate) => candidate.id !== candidateId))
    setProcessing(null)
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
          maxWidth: '56rem',
          margin: '0 auto',
          padding: '3rem 2rem',
        }}
      >
        <Link href={`/projects/${projectId}`} style={backLinkStyle}>
          ← Zurück zum Projekt
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Candidates-Review</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Candidates prüfen</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Bestätige erkannte Artikel oder lehne unpassende Vorschläge direkt ab.
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

        {loading ? (
          <section style={cardStyle}>
            <p style={{ margin: 0 }}>Candidates werden geladen...</p>
          </section>
        ) : candidates.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Keine ausstehenden Candidates</h2>
            <p style={{ lineHeight: 1.6 }}>
              Alle erkannten Vorschläge sind bereits verarbeitet. Du kannst jetzt mit den Items
              weiterarbeiten.
            </p>
            <Link href={`/projects/${projectId}/items`} style={primaryLinkStyle}>
              Zu den Items
            </Link>
          </section>
        ) : (
          <ul style={listStyle}>
            {candidates.map((candidate) => (
              <li key={candidate.id} style={cardStyle}>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{candidate.normalizedName}</h2>
                      <p style={{ margin: '0.35rem 0 0', color: '#6f624e' }}>
                        Rohlabel: {candidate.rawLabel}
                      </p>
                    </div>
                    <span style={metaPillStyle}>
                      {Math.round(candidate.confidence * 100)} % Konfidenz
                    </span>
                  </div>

                  <p style={{ margin: 0, color: '#5c5346' }}>
                    Kategorie: <strong>{candidate.category}</strong>
                  </p>

                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleAction(candidate.id, 'accept')}
                      disabled={processing === candidate.id}
                      style={{
                        ...buttonStyle,
                        background: processing === candidate.id ? '#8d8476' : '#1f6f5f',
                        color: '#ffffff',
                        border: 0,
                        cursor: processing === candidate.id ? 'progress' : 'pointer',
                      }}
                    >
                      {processing === candidate.id ? 'Bitte warten...' : 'Akzeptieren'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAction(candidate.id, 'reject')}
                      disabled={processing === candidate.id}
                      style={{
                        ...buttonStyle,
                        background: '#fff4f2',
                        color: '#9a2f1f',
                        border: '1px solid #efc6c0',
                        cursor: processing === candidate.id ? 'progress' : 'pointer',
                        opacity: processing === candidate.id ? 0.7 : 1,
                      }}
                    >
                      Ablehnen
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
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
