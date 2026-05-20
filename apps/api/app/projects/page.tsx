import { prisma } from '@itemflow/db'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { QuickStartButton } from './QuickStartButton'

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user?.userId) {
    redirect('/login')
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.userId,
      status: { not: 'deleted' },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      createdAt: true,
    },
  })

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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#7b6f5b' }}>ItemFlow</p>
            <h1 style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>Meine Projekte</h1>
            <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
              Hier startest du den Upload- und Bewertungs-Flow für neue Resale-Projekte.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <QuickStartButton />
            <Link href="/projects/new" style={secondaryLinkStyle}>
              + Neues Projekt
            </Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <section style={emptyCardStyle}>
            <h2 style={{ marginTop: 0 }}>Noch keine Projekte</h2>
            <p style={{ marginBottom: 0, lineHeight: 1.6 }}>
              Lege dein erstes Projekt an, zum Beispiel für Keller, Dachboden oder Garage.
            </p>
          </section>
        ) : (
          <ul style={listStyle}>
            {projects.map((project) => (
              <li key={project.id} style={cardStyle}>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{project.title}</h2>
                    <span style={metaPillStyle}>{formatDate(project.createdAt)}</span>
                  </div>

                  {project.description ? (
                    <p style={{ margin: 0, color: '#5c5346', lineHeight: 1.6 }}>
                      {project.description}
                    </p>
                  ) : (
                    <p style={{ margin: 0, color: '#8a7d67' }}>Keine Beschreibung hinterlegt.</p>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={statusStyle}>{project.status}</span>
                    <Link href={`/projects/${project.id}`} style={textLinkStyle}>
                      Projekt öffnen
                    </Link>
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const secondaryLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.85rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#4e463b',
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

const statusStyle = {
  color: '#6f624e',
  fontSize: '0.95rem',
  textTransform: 'capitalize',
} satisfies React.CSSProperties

const textLinkStyle = {
  color: '#1f6f5f',
  fontWeight: 700,
  textDecoration: 'none',
} satisfies React.CSSProperties
