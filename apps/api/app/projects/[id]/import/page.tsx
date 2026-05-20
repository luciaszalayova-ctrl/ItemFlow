'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { type VisionCandidateRaw, VisionCandidateRawSchema } from '@itemflow/shared'
import { z } from 'zod'

const MANUAL_PROMPT = `Analysiere das/die Bild(er) und erkenne alle verkaeuflichen Haushaltgegenstaende.
Antworte NUR mit einem JSON-Array — kein Markdown, kein Fliesstext, keine Erklaerungen.

Format:
[
  {
    "rawLabel": "Bosch-Akkuschrauber blau",
    "normalizedName": "Akkuschrauber",
    "category": "Werkzeug",
    "confidence": 0.92
  }
]

Regeln:
- Nur verkaeufliche Gegenstaende (keine Waende, Boeden, fest eingebaute Moebel)
- Maximal 15 Eintraege pro Bild
- confidence 0.9+ nur wenn Gegenstand eindeutig erkennbar
- confidence 0.5-0.7 wenn unsicher (Marke unklar, Zustand unbekannt)
- rawLabel: genau das was du siehst (z. B. "blauer Koffer mit Raedern")
- normalizedName: normalisierter Gattungsname (z. B. "Koffer")
- category: eine von: Elektronik, Spielzeug, Kleidung, Bücher, Haushalt, Werkzeug, Sport, Möbel, Sonstiges

Optionale Felder:
- "uncertaintyNotes": "Marke nicht lesbar"
- "bundlePotential": true
- "attributes": { "brand": "Bosch", "color": "blau" }`

export default function ChatGptImportPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [json, setJson] = useState('')
  const [parsed, setParsed] = useState<VisionCandidateRaw[] | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [promptCopied, setPromptCopied] = useState(false)

  function handlePreview() {
    const result = parseInput(json)
    if (!result.ok) {
      setParsed(null)
      setParseError(result.error)
      return
    }

    setParsed(result.data)
    setParseError(null)
    setError(null)
  }

  async function handleImport() {
    if (!parsed) return

    setSubmitting(true)
    setError(null)

    const response = await fetch(`/api/projects/${projectId}/candidates/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates: parsed }),
    })

    if (!response.ok) {
      setError(await readError(response, 'Import konnte nicht gespeichert werden.'))
      setSubmitting(false)
      return
    }

    router.push(`/projects/${projectId}/candidates`)
  }

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(MANUAL_PROMPT)
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
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
          <p style={{ margin: 0, color: '#7b6f5b' }}>Manueller Import</p>
          <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>ChatGPT-Import</h1>
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            Lade deine Fotos in ChatGPT hoch, nutze den Prompt unten und fuege die JSON-Antwort
            hier ein. Nach dem Import geht es direkt im normalen Candidates-Review weiter.
          </p>
        </header>

        <section style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>ChatGPT-Prompt anzeigen</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => void handleCopyPrompt()}
                style={{
                  ...secondaryButtonStyle,
                  background: promptCopied ? '#1f6f5f' : '#efe6d6',
                  color: promptCopied ? '#ffffff' : '#4e463b',
                }}
              >
                {promptCopied ? 'Prompt kopiert ✓' : 'Prompt kopieren'}
              </button>
              <a
                href={`https://chatgpt.com/?q=${encodeURIComponent(MANUAL_PROMPT)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={secondaryButtonStyle}
              >
                In ChatGPT öffnen
              </a>
              <button
                type="button"
                onClick={() => setShowPrompt((current) => !current)}
                style={secondaryButtonStyle}
              >
                {showPrompt ? 'Prompt ausblenden' : 'Prompt anzeigen'}
              </button>
            </div>
          </div>

          {showPrompt ? (
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
              <pre style={promptStyle}>{MANUAL_PROMPT}</pre>
            </div>
          ) : null}
        </section>

        <section style={cardStyle}>
          <label htmlFor="chatgpt-json" style={{ display: 'block', fontWeight: 700 }}>
            ChatGPT-JSON
          </label>
          <textarea
            id="chatgpt-json"
            value={json}
            onChange={(event) => {
              setJson(event.target.value)
              setParseError(null)
              setError(null)
            }}
            placeholder='[{"rawLabel":"...","normalizedName":"...","category":"...","confidence":0.9}]'
            rows={14}
            spellCheck={false}
            style={textareaStyle}
          />

          {parseError ? (
            <p role="alert" style={errorStyle}>
              {parseError}
            </p>
          ) : null}

          {error ? (
            <p role="alert" style={errorStyle}>
              {error}
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={handlePreview}
              style={{
                ...secondaryButtonStyle,
                cursor: 'pointer',
              }}
            >
              Vorschau
            </button>
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={!parsed || submitting}
              style={{
                ...buttonStyle,
                background: !parsed || submitting ? '#8d8476' : '#1f6f5f',
                color: '#ffffff',
                border: 0,
                cursor: !parsed || submitting ? 'not-allowed' : 'pointer',
              }}
            >
              {submitting ? 'Wird importiert...' : 'Importieren'}
            </button>
          </div>
        </section>

        {parsed ? (
          <section style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <h2 style={{ margin: 0 }}>Vorschau</h2>
              <span style={metaPillStyle}>{parsed.length} Eintraege</span>
            </div>

            <ul style={listStyle}>
              {parsed.map((candidate, index) => (
                <li key={`${candidate.normalizedName}-${index}`} style={previewCardStyle}>
                  <div style={{ display: 'grid', gap: '0.6rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem' }}>
                          {candidate.normalizedName}
                        </h3>
                        <p style={{ margin: '0.3rem 0 0', color: '#6f624e' }}>
                          Rohlabel: {candidate.rawLabel}
                        </p>
                      </div>
                      <span style={metaPillStyle}>{candidate.category}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={confidenceTrackStyle}>
                        <div
                          style={{
                            width: `${Math.round(candidate.confidence * 100)}%`,
                            height: '100%',
                            background: candidate.confidence >= 0.8 ? '#1f6f5f' : '#c07a2a',
                            borderRadius: '999px',
                          }}
                        />
                      </div>
                      <span style={{ color: '#5c5346', fontWeight: 700 }}>
                        {candidate.confidence.toFixed(2)}
                      </span>
                    </div>

                    {candidate.uncertaintyNotes ? (
                      <p style={{ margin: 0, color: '#7a6040' }}>
                        Hinweis: {candidate.uncertaintyNotes}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function parseInput(
  raw: string,
): { ok: true; data: VisionCandidateRaw[] } | { ok: false; error: string } {
  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Kein gueltiges JSON.' }
  }

  const result = z.array(VisionCandidateRawSchema).safeParse(parsed)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return {
      ok: false,
      error: `Ungueltiges Format: ${firstIssue?.message ?? 'Unbekannter Fehler'} (Eintrag ${(firstIssue?.path[0] ?? '?').toString()})`,
    }
  }

  if (result.data.length === 0) {
    return { ok: false, error: 'Das Array ist leer.' }
  }

  return { ok: true, data: result.data }
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
  marginTop: '1.5rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
  boxShadow: '0 0.75rem 1.5rem rgba(49, 40, 27, 0.05)',
} satisfies React.CSSProperties

const listStyle = {
  listStyle: 'none',
  padding: 0,
  margin: '1.25rem 0 0',
  display: 'grid',
  gap: '1rem',
} satisfies React.CSSProperties

const previewCardStyle = {
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#f9f4ea',
  border: '1px solid #e1d8ca',
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
} satisfies React.CSSProperties

const metaPillStyle = {
  alignSelf: 'flex-start',
  padding: '0.35rem 0.65rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#6f624e',
  fontSize: '0.9rem',
} satisfies React.CSSProperties

const textareaStyle = {
  width: '100%',
  marginTop: '0.75rem',
  padding: '1rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffaf2',
  color: '#2d2a24',
  fontFamily: 'monospace',
  fontSize: '0.95rem',
  lineHeight: 1.5,
  resize: 'vertical',
  boxSizing: 'border-box',
} satisfies React.CSSProperties

const promptStyle = {
  margin: 0,
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#f9f4ea',
  border: '1px solid #e1d8ca',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowX: 'auto',
  fontSize: '0.92rem',
  lineHeight: 1.55,
} satisfies React.CSSProperties

const errorStyle = {
  marginTop: '1rem',
  marginBottom: 0,
  padding: '0.75rem 0.9rem',
  borderRadius: '0.75rem',
  background: '#fde9e7',
  color: '#9a2f1f',
} satisfies React.CSSProperties

const confidenceTrackStyle = {
  width: '8rem',
  height: '0.5rem',
  background: '#e2d9ca',
  borderRadius: '999px',
  overflow: 'hidden',
} satisfies React.CSSProperties
