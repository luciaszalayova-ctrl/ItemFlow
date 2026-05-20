# IF-018-projects-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Projekte-UI implementieren — Nutzer können nach dem Login Projekte sehen und neue
Projekte anlegen. Erster UI-Schritt nach der Login-Seite.

---

## Kontext

- `GET /api/projects` — gibt Projekte des eingeloggten Nutzers zurück
- `POST /api/projects` — legt neues Projekt an (`{ title, description? }`)
- Auth: Session via `auth()` server-seitig, `useSession()` client-seitig nicht nötig
- Stil: inline Styles, kein CSS-Framework — konsistent mit `apps/api/app/login/page.tsx`

---

## Ziel

Nach diesem Ticket kann ein Nutzer Projekte anlegen und die Liste seiner Projekte
sehen. Das ist der Einstiegspunkt in den Upload-Flow.

---

## Betroffene Dateien

```
apps/api/app/projects/page.tsx        NEU — Projektliste (Server Component)
apps/api/app/projects/new/page.tsx    NEU — Projekt anlegen (Client Component)
apps/api/app/page.tsx                 ÄNDERN — Link zu /projects ergänzen
```

---

## Implementierungsdetails

### `apps/api/app/projects/page.tsx` — Server Component

```typescript
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProjectsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const res = await fetch('http://localhost:3001/api/projects', {
    headers: { Cookie: /* session cookie weiterleiten */ },
    cache: 'no-store',
  })
  const { projects } = await res.json()

  return (
    <main>
      <h1>Meine Projekte</h1>
      <Link href="/projects/new">+ Neues Projekt</Link>
      {projects.length === 0 && <p>Noch keine Projekte.</p>}
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <Link href={`/projects/${p.id}`}>{p.title}</Link>
            {p.description && <p>{p.description}</p>}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

**Wichtig:** Für Server-Component-Fetches innerhalb der gleichen Next.js-App
`prisma` direkt nutzen statt `fetch` — kein HTTP-Roundtrip nötig:

```typescript
import { prisma } from '@itemflow/db'

const projects = await prisma.project.findMany({
  where: { userId: session.user.userId, status: { not: 'deleted' } },
  orderBy: { createdAt: 'desc' },
  select: { id: true, title: true, description: true, status: true, createdAt: true },
})
```

### `apps/api/app/projects/new/page.tsx` — Client Component

```typescript
'use client'

export default function NewProjectPage() {
  async function handleSubmit(e) {
    e.preventDefault()
    const title = e.currentTarget.title.value
    const description = e.currentTarget.description.value

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: description || undefined }),
    })

    if (res.ok) {
      const { project } = await res.json()
      window.location.href = `/projects/${project.id}`
    }
  }

  return (
    <main>
      <h1>Neues Projekt</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Titel
          <input name="title" type="text" required />
        </label>
        <label>
          Beschreibung (optional)
          <textarea name="description" />
        </label>
        <button type="submit">Anlegen</button>
      </form>
    </main>
  )
}
```

### `apps/api/app/page.tsx` — Link ergänzen

Link zu `/projects` auf der Home-Seite hinzufügen.

---

## Akzeptanzkriterien

- [ ] `/projects` zeigt Liste aller Projekte des eingeloggten Nutzers
- [ ] Leere Liste zeigt Hinweistext
- [ ] `/projects/new` zeigt Formular für neues Projekt
- [ ] Nach Anlegen wird auf `/projects/[id]` weitergeleitet (auch wenn Seite noch leer ist)
- [ ] Home-Seite `/` hat Link zu `/projects`
- [ ] Unauthentifizierter Zugriff auf `/projects` leitet auf `/login` um
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Server Components: `prisma` direkt nutzen — kein `fetch` auf eigene API
- Client Components: `fetch('/api/...')` nutzen — Session-Cookie wird automatisch mitgeschickt
- Kein CSS-Framework — inline Styles konsistent mit Login-Seite
- Noch keine `/projects/[id]`-Seite nötig — Weiterleitung nach Anlegen reicht

---

## Abhängigkeiten

- IF-008 (Projects CRUD API) — merged ✓
- IF-016 (Login-Seite) — merged ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- `/projects/[id]` Detail-Seite (IF-019)
- Projekt löschen
- Projekt bearbeiten
- Navigation/Header-Komponente

---

## Referenzen

Review: REVIEW-IF-018 (nach Implementierung)
