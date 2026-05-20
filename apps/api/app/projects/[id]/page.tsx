import { prisma } from '@itemflow/db'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { auth } from '@/auth'
import { DEFAULT_AUTO_ACCEPT_THRESHOLD } from '@itemflow/scoring'
import { ProjectSettingsSchema } from '@itemflow/shared'
import { InlineTitleEditor } from './InlineTitleEditor'
import { ThresholdSetting } from './ThresholdSetting'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await auth()
  if (!session?.user?.userId) {
    redirect('/login')
  }

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      status: true,
      settings: true,
      createdAt: true,
    },
  })

  if (!project || project.status === 'deleted' || project.userId !== session.user.userId) {
    notFound()
  }

  const settingsParsed = ProjectSettingsSchema.safeParse(project.settings ?? {})
  const autoAcceptThreshold = settingsParsed.success
    ? settingsParsed.data.autoAcceptThreshold
    : DEFAULT_AUTO_ACCEPT_THRESHOLD

  const [candidateCount, itemCount, listingCount, bundleCount] = await Promise.all([
    prisma.itemCandidate.count({
      where: {
        projectId: id,
        status: 'pending',
      },
    }),
    prisma.inventoryItem.count({
      where: { projectId: id },
    }),
    prisma.listingDraft.count({
      where: {
        projectId: id,
        status: { in: ['draft', 'reviewed'] },
      },
    }),
    prisma.bundle.count({
      where: {
        projectId: id,
        status: { notIn: ['rejected'] },
      },
    }),
  ])

  const nextSteps = [
    {
      href: `/projects/${id}/upload`,
      label: 'Fotos hochladen',
      meta: 'Bilder für die automatische Erkennung erfassen',
    },
    {
      href: `/projects/${id}/import`,
      label: 'ChatGPT importieren',
      meta: 'JSON-Analyse aus ChatGPT einfügen und als Candidates importieren',
    },
    {
      href: `/projects/${id}/candidates`,
      label: `Candidates prüfen (${candidateCount} ausstehend)`,
      meta: 'Erkannte Vorschläge bestätigen oder ablehnen',
    },
    {
      href: `/projects/${id}/items`,
      label: `Items bearbeiten (${itemCount} gesamt)`,
      meta: 'Titel, Zustand und Details für das Scoring verfeinern',
    },
    {
      href: `/projects/${id}/bundles`,
      label: `Bundles (${bundleCount} gesamt)`,
      meta: 'Günstige Artikel zu Paketen bündeln und gemeinsam anbieten',
    },
    {
      href: `/projects/${id}/listings`,
      label: `Listings (${listingCount} offen)`,
      meta: 'Entwürfe prüfen, freigeben und exportieren',
    },
  ]

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
        <Link href="/projects" style={backLinkStyle}>
          ← Alle Projekte
        </Link>

        <header style={{ marginTop: '1.5rem' }}>
          <p style={{ margin: 0, color: '#7b6f5b' }}>Projektübersicht</p>
          <InlineTitleEditor projectId={project.id} initialTitle={project.title} />
          <p style={{ marginTop: 0, color: '#5c5346', lineHeight: 1.6 }}>
            {project.description ?? 'Keine Beschreibung hinterlegt.'}
          </p>
        </header>

        <section style={summaryCardStyle}>
          <div style={summaryGridStyle}>
            <StatCard label="Candidates offen" value={candidateCount} />

            <StatCard label="Items gesamt" value={itemCount} />
            <StatCard label="Bundles" value={bundleCount} />
            <StatCard label="Listings offen" value={listingCount} />
            <StatCard label="Erstellt am" value={formatDate(project.createdAt)} />
          </div>
        </section>

        <ThresholdSetting projectId={project.id} initialThreshold={autoAcceptThreshold} />

        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Nächste Schritte</h2>
          <ul style={stepsListStyle}>
            {nextSteps.map((step) => (
              <li key={step.href} style={stepCardStyle}>
                <Link href={step.href} style={stepLinkStyle}>
                  {step.label}
                </Link>
                <p style={{ margin: '0.4rem 0 0', color: '#5c5346', lineHeight: 1.5 }}>{step.meta}</p>
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={statCardStyle}>
      <p style={{ margin: 0, color: '#7b6f5b', fontSize: '0.9rem' }}>{label}</p>
      <strong style={{ fontSize: '1.8rem' }}>{value}</strong>
    </div>
  )
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const backLinkStyle = {
  color: '#1f6f5f',
  textDecoration: 'none',
  fontWeight: 700,
} satisfies React.CSSProperties

const summaryCardStyle = {
  marginTop: '2rem',
  padding: '1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
  boxShadow: '0 0.75rem 1.5rem rgba(49, 40, 27, 0.05)',
} satisfies React.CSSProperties

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(12rem, 1fr))',
  gap: '1rem',
} satisfies React.CSSProperties

const statCardStyle = {
  display: 'grid',
  gap: '0.35rem',
  padding: '1rem',
  borderRadius: '0.9rem',
  background: '#f7f2e8',
  border: '1px solid #eadfcd',
} satisfies React.CSSProperties

const stepsListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'grid',
  gap: '1rem',
} satisfies React.CSSProperties

const stepCardStyle = {
  padding: '1.25rem 1.5rem',
  borderRadius: '1rem',
  border: '1px solid #d8d0c2',
  background: '#fffdf8',
} satisfies React.CSSProperties

const stepLinkStyle = {
  color: '#1f6f5f',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '1.05rem',
} satisfies React.CSSProperties
