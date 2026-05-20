# IF-008-projects-crud-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Projects-CRUD-API implementieren — `GET/POST /api/projects` und
`GET/DELETE /api/projects/[id]`. Authentifizierte Nutzer können Projekte anlegen,
auflisten und löschen. Voraussetzung für sinnvolles Testen von IF-007 (Upload).

---

## Kontext

- Auth: `apps/api/auth.ts` — `auth()` gibt Session mit `session.user.userId` zurück
- DB: `prisma` aus `@itemflow/db`, Model `Project` in `schema.prisma`
- Validierung: `CreateProjectSchema`, `ProjectSchema` aus `@itemflow/shared`
- Middleware schützt alle `/api/*` — Session ist in Route-Handlers garantiert vorhanden

---

## Ziel

Nach diesem Ticket kann ein Nutzer via API ein Projekt anlegen und abrufen,
bevor er Fotos hochlädt (IF-007).

---

## Betroffene Dateien

```
apps/api/app/api/projects/route.ts            NEU — GET, POST
apps/api/app/api/projects/[id]/route.ts       NEU — GET, DELETE
```

---

## Implementierungsdetails

### Gemeinsames Pattern für alle Routes

```typescript
import { auth } from '@/auth'
import { prisma } from '@itemflow/db'

// Session ist durch Middleware garantiert, trotzdem defensiv prüfen:
const session = await auth()
if (!session?.user?.userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
const userId = session.user.userId
```

Fehler-Response-Format einheitlich:
```json
{ "error": "Beschreibung auf Englisch" }
```

---

### `GET /api/projects` — Projekte auflisten

Gibt alle nicht-gelöschten Projekte des eingeloggten Nutzers zurück,
absteigend nach `createdAt`.

```typescript
const projects = await prisma.project.findMany({
  where: { userId, status: { not: 'deleted' } },
  orderBy: { createdAt: 'desc' },
  select: { id: true, title: true, description: true, status: true, createdAt: true, updatedAt: true }
})
return Response.json({ projects })
```

---

### `POST /api/projects` — Projekt anlegen

Request-Body: `{ title: string, description?: string }`

Validierung mit `CreateProjectSchema.safeParse()`:
```typescript
import { CreateProjectSchema } from '@itemflow/shared'

const body = await request.json()
const parsed = CreateProjectSchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
}
const project = await prisma.project.create({
  data: { userId, title: parsed.data.title, description: parsed.data.description ?? null }
})
return Response.json({ project }, { status: 201 })
```

---

### `GET /api/projects/[id]` — Einzelnes Projekt

```typescript
const project = await prisma.project.findUnique({ where: { id } })
if (!project || project.status === 'deleted') {
  return Response.json({ error: 'Not found' }, { status: 404 })
}
if (project.userId !== userId) {
  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
return Response.json({ project })
```

---

### `DELETE /api/projects/[id]` — Projekt löschen (Soft-Delete)

Setzt `status: 'deleted'` — kein echtes DB-Delete (Audit-Trail, Wiederherstellung möglich).

```typescript
await prisma.project.update({
  where: { id },
  data: { status: 'deleted' }
})
return new Response(null, { status: 204 })
```

404/403-Prüfung wie bei GET.

---

## Akzeptanzkriterien

- [ ] `POST /api/projects` legt Projekt an und gibt `201` zurück
- [ ] `GET /api/projects` gibt nur Projekte des eingeloggten Nutzers zurück
- [ ] `GET /api/projects/[id]` gibt `403` bei fremdem Projekt
- [ ] `DELETE /api/projects/[id]` setzt `status: 'deleted'`, gibt `204` zurück
- [ ] `POST` mit fehlendem `title` gibt `400` mit Validierungsdetails zurück
- [ ] `passwordHash` und `settings` erscheinen nicht in Responses
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `CreateProjectSchema` aus `@itemflow/shared` für Input-Validierung nutzen
- Kein echtes DB-Delete — immer Soft-Delete via `status: 'deleted'`
- `userId` immer aus Session, niemals aus Request-Body oder URL
- `select` explizit angeben — kein blindes Zurückgeben des ganzen Prisma-Objekts

---

## Abhängigkeiten

- IF-006 (Auth) — merged ✓
- IF-005 (Migrate) — Datenbank muss laufen

---

## Referenzen

Offene Fragen: keine  
Review: REVIEW-IF-008 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- `PATCH /api/projects/[id]` (Titel/Beschreibung ändern — eigenes Ticket)
- Projekt-Status-Übergänge (active → archived)
- Asset-Count oder andere aggregierte Felder in der List-Response
- Pagination
