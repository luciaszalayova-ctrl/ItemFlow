'use client'

import { type FormEvent, useState } from 'react'

export default function NewProjectPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = event.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement).value.trim()
    const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim()

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description.length > 0 ? description : undefined,
      }),
    })

    if (!response.ok) {
      setLoading(false)

      if (response.status === 400) {
        setError('Bitte pruefe Titel und Beschreibung.')
        return
      }

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      setError('Projekt konnte gerade nicht angelegt werden.')
      return
    }

    const { project } = (await response.json()) as { project: { id: string } }
    window.location.href = `/projects/${project.id}`
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f5f1e8',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '36rem',
          padding: '2rem',
          background: '#fffdf8',
          border: '1px solid #d8d0c2',
          borderRadius: '1rem',
          boxShadow: '0 1rem 2rem rgba(49, 40, 27, 0.08)',
        }}
      >
        <p style={{ margin: 0, color: '#7b6f5b', fontSize: '0.9rem' }}>ItemFlow</p>
        <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Neues Projekt</h1>
        <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.5 }}>
          Lege ein neues Sammelprojekt an, um spaeter Fotos hochzuladen und Artikel zu
          bewerten.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>Titel</span>
            <input
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="z. B. Kellerwohnung aufraeumen"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>Beschreibung (optional)</span>
            <textarea
              name="description"
              rows={5}
              maxLength={1000}
              placeholder="Welche Ecke oder welcher Raum wird ausgeraeumt?"
              style={{ ...inputStyle, resize: 'vertical', minHeight: '8rem' }}
            />
          </label>

          {error ? (
            <p
              role="alert"
              style={{
                margin: 0,
                padding: '0.75rem 0.9rem',
                borderRadius: '0.75rem',
                background: '#fde9e7',
                color: '#9a2f1f',
              }}
            >
              {error}
            </p>
          ) : null}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                border: 0,
                borderRadius: '999px',
                padding: '0.85rem 1rem',
                background: loading ? '#8d8476' : '#1f6f5f',
                color: '#ffffff',
                fontWeight: 700,
                cursor: loading ? 'progress' : 'pointer',
              }}
            >
              {loading ? 'Wird angelegt...' : 'Projekt anlegen'}
            </button>

            <a
              href="/projects"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.85rem 1rem',
                borderRadius: '999px',
                border: '1px solid #d8d0c2',
                color: '#4e463b',
                textDecoration: 'none',
                background: '#fffdf8',
                fontWeight: 600,
              }}
            >
              Zurueck zur Liste
            </a>
          </div>
        </form>
      </section>
    </main>
  )
}

const inputStyle = {
  width: '100%',
  padding: '0.8rem 0.9rem',
  borderRadius: '0.75rem',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  font: 'inherit',
  boxSizing: 'border-box',
} satisfies React.CSSProperties
