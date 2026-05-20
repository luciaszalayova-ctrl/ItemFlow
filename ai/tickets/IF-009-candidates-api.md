# IF-009-candidates-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `draft`

---

## Zusammenfassung

Candidates-API implementieren — Nutzer können erkannte ItemCandidates eines Projekts
auflisten und einzeln akzeptieren oder ablehnen. Beim Akzeptieren wird automatisch
ein `InventoryItem` angelegt. Zweiter Schritt der Upload-Pipeline nach IF-007.

---

## Kontext

- Candidates werden durch IF-007 (Upload) angelegt, Status initial: `pending`
- `ItemCandidate`-Schema: `packages/shared/src/schemas/item-candidate.ts`
- `InventoryItem`-Schema: `packages/shared/src/schemas/inventory-item.ts`
- Prisma-Modelle: `ItemCandidate`, `InventoryItem` in `packages/db/prisma/schema.prisma`
- Auth/Session-Pattern: `ai/context/project-snapshot.md`

---

## Ziel

Nach diesem Ticket kann ein Nutzer die erkannten Candidates eines Uploads sehen
und entscheiden: akzeptieren (→ InventoryItem) oder ablehnen.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/candidates/route.ts          NEU — GET
apps/api/app/api/projects/[id]/candidates/[cid]/route.ts    NEU — PATCH
```

---

## Implementierungsdetails

### `GET /api/projects/[id]/candidates`

Query-Parameter: `status` (optional) — filtert nach CandidateStatus (`pending`, `accepted`, `rejected`, ...)

```typescript
const { searchParams } = new URL(request.url)
const statusFilter = searchParams.get('status')

const candidates = await prisma.itemCandidate.findMany({
  where: {
    projectId: id,
    ...(statusFilter ? { status: statusFilter as CandidateStatus } : {})
  },
  orderBy: { createdAt: 'asc' },
  select: {
    id: true, assetId: true, rawLabel: true, normalizedName: true,
    category: true, attributesJson: true, confidence: true,
    rawModelOutputJson: true, status: true, createdAt: true
  }
})
// Projekt-Ownership prüfen bevor Candidates zurückgeben
return Response.json({ candidates })
```

Ownership-Prüfung: Projekt via `prisma.project.findUnique` laden, `403` wenn `project.userId !== userId`.

---

### `PATCH /api/projects/[id]/candidates/[cid]`

Request-Body:
```typescript
{ action: 'accept' | 'reject' }
```

Validierung:
```typescript
const ActionSchema = z.object({ action: z.enum(['accept', 'reject']) })
const parsed = ActionSchema.safeParse(body)
if (!parsed.success) return Response.json({ error: 'Invalid action' }, { status: 400 })
```

**Bei `action: 'reject'`:**
```typescript
await prisma.itemCandidate.update({
  where: { id: cid },
  data: { status: 'rejected' }
})
return Response.json({ candidateId: cid, status: 'rejected' })
```

**Bei `action: 'accept'`:**
```typescript
// 1. Candidate auf 'accepted' setzen
await prisma.itemCandidate.update({ where: { id: cid }, data: { status: 'accepted' } })

// 2. InventoryItem aus Candidate-Daten anlegen
const item = await prisma.inventoryItem.create({
  data: {
    projectId: candidate.projectId,
    title: candidate.normalizedName,
    category: candidate.category,
    brand: extractBrand(candidate.attributesJson),  // siehe unten
    sourceCandidateIds: [candidate.id],
    status: 'ready_for_scoring'
  }
})
return Response.json({ candidateId: cid, status: 'accepted', inventoryItemId: item.id }, { status: 201 })
```

**`extractBrand()`** — liest `brand` aus `attributesJson` wenn vorhanden:
```typescript
function extractBrand(attributesJson: unknown): string | null {
  if (typeof attributesJson === 'object' && attributesJson !== null) {
    const brand = (attributesJson as Record<string, unknown>)['brand']
    return typeof brand === 'string' ? brand : null
  }
  return null
}
```

**Bereits akzeptiert/abgelehnt:** Wenn `candidate.status !== 'pending'` → `409 Conflict`:
```typescript
return Response.json({ error: 'Candidate already processed' }, { status: 409 })
```

---

## Akzeptanzkriterien

- [ ] `GET /api/projects/[id]/candidates` gibt Candidates des Projekts zurück
- [ ] `GET` mit `?status=pending` filtert korrekt
- [ ] `GET` gibt `403` bei fremdem Projekt
- [ ] `PATCH accept` → Candidate `accepted`, InventoryItem angelegt, `inventoryItemId` in Response
- [ ] `PATCH reject` → Candidate `rejected`
- [ ] `PATCH` auf bereits verarbeiteten Candidate → `409`
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `status`-Filter in GET ist optional — ohne Filter alle Candidates zurückgeben
- `rawModelOutputJson` und `attributesJson` in Response mitschicken (wird für UI gebraucht)
- Keine automatische Massenakzeptierung — immer einzeln
- Beim Akzeptieren: `title = normalizedName`, `category` direkt übernehmen — Nutzer kann später via Items-API bearbeiten (IF-010)

---

## Abhängigkeiten

- IF-007 (Upload) — erstellt Candidates
- IF-008 (Projects CRUD) — Ownership-Pattern

---

## Referenzen

Review: REVIEW-IF-009 (nach Implementierung)

## Scope-Grenze

Nicht Teil dieses Tickets:
- Massenakzeptierung mehrerer Candidates
- `merged` / `split` Status-Übergänge (Bundle-Logik)
- Candidate editieren (normalizedName, category anpassen)
