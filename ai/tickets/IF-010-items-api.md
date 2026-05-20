# IF-010-items-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Items-API implementieren — Nutzer können InventoryItems eines Projekts auflisten
und vor dem Scoring bearbeiten (Titel, Zustand, Marke, Mängel korrigieren).

---

## Kontext

- InventoryItems entstehen durch IF-009 (Candidate akzeptieren)
- `UpdateInventoryItemSchema`: `packages/shared/src/schemas/inventory-item.ts`
- Prisma-Modell: `InventoryItem` in `packages/db/prisma/schema.prisma`
- Auth/Session-Pattern: `ai/context/project-snapshot.md`

---

## Ziel

Nach diesem Ticket kann ein Nutzer erkannte Items vor dem Scoring verfeinern:
Titel korrigieren, Zustand eintragen, Mängel notieren — alles was die
Scoring-Qualität verbessert.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/items/route.ts          NEU — GET
apps/api/app/api/projects/[id]/items/[iid]/route.ts    NEU — GET, PATCH
```

---

## Implementierungsdetails

### `GET /api/projects/[id]/items`

Query-Parameter: `status` (optional) — filtert nach InventoryItemStatus

```typescript
const items = await prisma.inventoryItem.findMany({
  where: {
    projectId: id,
    ...(statusFilter ? { status: statusFilter as InventoryItemStatus } : {})
  },
  orderBy: { createdAt: 'asc' }
})
return Response.json({ items })
```

Ownership-Prüfung via Projekt (gleicher Ansatz wie IF-009).

---

### `GET /api/projects/[id]/items/[iid]`

```typescript
const item = await prisma.inventoryItem.findUnique({ where: { id: iid } })
if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
if (item.projectId !== id) return Response.json({ error: 'Not found' }, { status: 404 })
// Ownership via Projekt prüfen
return Response.json({ item })
```

---

### `PATCH /api/projects/[id]/items/[iid]`

Validierung mit `UpdateInventoryItemSchema.safeParse()`:

```typescript
import { UpdateInventoryItemSchema } from '@itemflow/shared'

const parsed = UpdateInventoryItemSchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
}

const updated = await prisma.inventoryItem.update({
  where: { id: iid },
  data: parsed.data
})
return Response.json({ item: updated })
```

**Status-Schutz:** Items mit Status `scored`, `listing_created` oder `handled` dürfen
nicht mehr über diese Route bearbeitet werden:
```typescript
const EDITABLE_STATUSES = ['draft', 'ready_for_scoring']
if (!EDITABLE_STATUSES.includes(item.status)) {
  return Response.json({ error: 'Item cannot be edited in current status' }, { status: 409 })
}
```

---

## Akzeptanzkriterien

- [ ] `GET /api/projects/[id]/items` gibt Items des Projekts zurück
- [ ] `GET` mit `?status=ready_for_scoring` filtert korrekt
- [ ] `GET /api/projects/[id]/items/[iid]` gibt einzelnes Item zurück
- [ ] `PATCH` mit gültigem Body aktualisiert Item
- [ ] `PATCH` mit ungültigem Body gibt `400` mit Validierungsdetails
- [ ] `PATCH` auf `scored`/`listing_created`/`handled` Item gibt `409`
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `UpdateInventoryItemSchema` aus `@itemflow/shared` nutzen — kein eigenes Schema definieren
- `status`-Feld ist über diese Route nicht änderbar (kein `status` in `UpdateInventoryItemSchema`)
- Ownership immer via Projekt prüfen, nicht direkt via Item

---

## Abhängigkeiten

- IF-009 (Candidates) — erstellt InventoryItems
- IF-008 (Projects CRUD) — Ownership-Pattern

---

## Referenzen

Review: REVIEW-IF-010 (nach Implementierung)

## Scope-Grenze

Nicht Teil dieses Tickets:
- Item löschen
- Status-Übergänge explizit triggern
- Bundle-Zuordnung
