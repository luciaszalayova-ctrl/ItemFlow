import { auth } from '@/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const links = [
  '/api/projects',
  '/api/projects/:id/candidates',
  '/api/projects/:id/items',
  '/api/projects/:id/listings',
]

export default async function HomePage() {
  const session = await auth()
  if (!session?.user?.email) {
    redirect('/login')
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
        <p style={{ margin: 0, color: '#7b6f5b' }}>ItemFlow</p>
        <h1 style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>Resale Assistant Workspace</h1>
        <p style={{ marginTop: 0, lineHeight: 1.6 }}>
          Eingeloggt als: <strong>{session.user.email}</strong>
        </p>
        <p style={{ lineHeight: 1.6 }}>
          Die API ist bereit. Von hier aus kannst du die geschützten Endpunkte im Browser oder per
          REST-Client testen.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <Link href="/projects" style={primaryLinkStyle}>
            Zu meinen Projekten
          </Link>
        </div>

        <section
          style={{
            marginTop: '2rem',
            padding: '1.5rem',
            borderRadius: '1rem',
            border: '1px solid #d8d0c2',
            background: '#fffdf8',
          }}
        >
          <h2 style={{ marginTop: 0 }}>Nächste sinnvolle Endpunkte</h2>
          <ul style={{ marginBottom: 0, paddingLeft: '1.25rem', lineHeight: 1.8 }}>
            {links.map((link) => (
              <li key={link}>
                <code>{link}</code>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}

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
