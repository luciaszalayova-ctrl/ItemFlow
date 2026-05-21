'use client'

import { useState, type FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const form = event.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('E-Mail oder Passwort ungueltig.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
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
          maxWidth: '28rem',
          padding: '2rem',
          background: '#fffdf8',
          border: '1px solid #d8d0c2',
          borderRadius: '1rem',
          boxShadow: '0 1rem 2rem rgba(49, 40, 27, 0.08)',
        }}
      >
        <p style={{ margin: 0, color: '#7b6f5b', fontSize: '0.9rem' }}>ItemFlow</p>
        <h1 style={{ marginTop: '0.5rem', marginBottom: '1.25rem' }}>Anmelden</h1>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>E-Mail</span>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            <span>Passwort</span>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              style={inputStyle}
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
            {loading ? 'Bitte warten...' : 'Einloggen'}
          </button>
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
} satisfies React.CSSProperties
