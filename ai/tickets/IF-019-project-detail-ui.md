# IF-019-project-detail-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Projekt-Detailseite implementieren — `/projects/[id]` zeigt Projektinfo und Navigation
zu den Unterbereichen (Upload, Candidates, Items, Listings).

---

## Kontext

- `prisma.project.findUnique` — Projektdaten laden
- `prisma.itemCandidate.count` / `prisma.inventoryItem.count` / `prisma.listingDraft.count` — Zählungen
- Auth: `auth()` server-seitig, Redirect auf `/login` wenn keine Session
- Stil: inline Styles, kein CSS-Framework

---

## Ziel

Nach diesem Ticket hat jedes Projekt eine Übersichtsseite die den aktuellen Stand
zeigt und zu den nächsten Schritten führt.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/page.tsx    NEU — Server Component
```

---

## Implementierungsdetails

Server Component — alles via `prisma` direkt, kein fetch:

```typescript
import { auth } from '@/auth'
import { prisma } from '@itemflow/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) redirect('/login')

  const { id } = await params
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, title: true, description: true, status: true, userId: true },
  })

  if (!project || project.status === 'deleted' || project.userId !== session.user.userId) {
    notFound()
  }

  const [candidateCount, itemCount, listingCount] = await Promise.all([
    prisma.itemCandidate.count({ where: { projectId: id, status: 'pending' } }),
    prisma.inventoryItem.count({ where: { projectId: id } }),
    prisma.listingDraft.count({ where: { projectId: id, status: { in: ['draft', 'reviewed'] } } }),
  ])

  return (
    <main>
      <Link href="/projects">← Alle Projekte</Link>
      <h1>{project.title}</h1>
      {project.description && <p>{project.description}</p>}

      <section>
        <h2>Nächste Schritte</h2>
        <ul>
          <li><Link href={`/projects/${id}/upload`}>Fotos hochladen</Link></li>
          <li><Link href={`/projects/${id}/candidates`}>Candidates prüfen ({candidateCount} ausstehend)</Link></li>
          <li><Link href={`/projects/${id}/items`}>Items bearbeiten ({itemCount} gesamt)</Link></li>
          <li><Link href={`/projects/${id}/listings`}>Listings ({listingCount} offen)</Link></li>
        </ul>
      </section>
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/projects/[id]` zeigt Projekttitel und Beschreibung
- [ ] Zählungen für Candidates (pending), Items (gesamt), Listings (draft+reviewed) werden angezeigt
- [ ] Links zu Upload, Candidates, Items, Listings vorhanden
- [ ] `notFound()` bei fremdem oder gelöschtem Projekt
- [ ] Unauthentifizierter Zugriff → Redirect auf `/login`
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Server Component — `prisma` direkt, kein fetch
- `Promise.all` für parallele Zählungen
- Ownership-Prüfung: `project.userId !== session.user.userId` → `notFound()`

---

## Abhängigkeiten

- IF-018 (Projects UI) — `/projects`-Liste verlinkt auf diese Seite
- IF-008, IF-009, IF-010 — Daten müssen existieren

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Projekt löschen oder bearbeiten
- Asset-Liste anzeigen
- Status-Übersicht als Fortschrittsbalken

---

## Referenzen

Review: REVIEW-IF-019 (nach Implementierung)
