# IF-033-chatgpt-import-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Einen Import-Endpunkt bauen, der ChatGPT-JSON-Output als `ItemCandidate`-Eintraege
speichert. Der Nutzer fuegt die ChatGPT-Antwort per Copy-Paste ein — ItemFlow
validiert und persistiert die Kandidaten, sodass der normale Review-Flow
unveraendert weiterlaufen kann.

---

## Kontext

`VisionCandidateRawSchema` existiert bereits in `packages/shared/src/schemas/item-candidate.ts`.
Die Felder `attributes`, `boundingBox`, `bundlePotential` und `uncertaintyNotes`
haben Defaults oder sind optional — minimales ChatGPT-JSON validiert problemlos.

**Problem:** `ItemCandidate.assetId` ist aktuell `String` (Pflichtfeld) und
referenziert `Asset`. Bei manuellem Import gibt es kein hochgeladenes Foto, daher
muss `assetId` nullable werden.

---

## Betroffene Dateien

```
packages/db/prisma/schema.prisma          MIGRIEREN (assetId nullable)
packages/shared/src/schemas/item-candidate.ts  ANPASSEN (assetId nullable)
apps/api/app/api/projects/[id]/candidates/import/route.ts  NEU
```

---

## Implementierungsdetails

### 1. Prisma-Migration

In `schema.prisma`:

```prisma
model ItemCandidate {
  // vorher: assetId  String
  assetId    String?
  asset      Asset?   @relation(fields: [assetId], references: [id], onDelete: SetNull)
  ...
}
```

Migration mit `pnpm --filter @itemflow/db db:migrate` ausfuehren.

### 2. `ItemCandidateSchema` anpassen

In `packages/shared/src/schemas/item-candidate.ts`:

```typescript
export const ItemCandidateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  assetId: z.string().nullable(),   // war: z.string()
  // alle anderen Felder unveraendert
  ...
})
```

### 3. Import-Endpunkt

Neues File: `apps/api/app/api/projects/[id]/candidates/import/route.ts`

```typescript
import { prisma } from '@itemflow/db'
import { VisionCandidateRawSchema } from '@itemflow/shared'
import { z } from 'zod'
import { auth } from '@/auth'

const ImportBodySchema = z.object({
  candidates: z.array(VisionCandidateRawSchema).min(1).max(50),
})

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true },
  })
  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = ImportBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Ungueltiges Format.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const created = await prisma.$transaction(
    parsed.data.candidates.map((candidate) =>
      prisma.itemCandidate.create({
        data: {
          projectId,
          assetId: null,
          rawLabel: candidate.rawLabel,
          normalizedName: candidate.normalizedName,
          category: candidate.category,
          confidence: candidate.confidence,
          attributesJson: candidate.attributes ?? {},
          boundingBoxJson: candidate.boundingBox ?? null,
          rawModelOutputJson: candidate,
          status: 'pending',
        },
        select: {
          id: true,
          rawLabel: true,
          normalizedName: true,
          category: true,
          confidence: true,
          status: true,
          createdAt: true,
        },
      }),
    ),
  )

  return Response.json({ candidates: created, count: created.length }, { status: 201 })
}
```

---

## Akzeptanzkriterien

- [ ] Migration laeuft durch, `assetId` ist nullable
- [ ] `ItemCandidateSchema.assetId` ist `z.string().nullable()`
- [ ] `POST /api/projects/:id/candidates/import` gibt `201` mit `{ candidates, count }` zurueck
- [ ] Valides Array: Kandidaten werden in DB angelegt, `assetId = null`, `status = 'pending'`
- [ ] Leeres Array oder mehr als 50 Eintraege: `400`
- [ ] Ungueltiges JSON-Format (fehlende Pflichtfelder): `400` mit `details`
- [ ] Falsche `projectId` oder geloeschtes Projekt: `404`
- [ ] Fremdes Projekt: `403`
- [ ] `pnpm typecheck` gruen
- [ ] `pnpm lint` gruen

---

## Rahmenbedingungen

- `rawModelOutputJson` speichert den rohen Kandidaten-Eintrag (unveraendert).
- Max. 50 Kandidaten pro Request (Schutz vor Bulk-Missbrauch).
- Keine Transaktion ueber Projekt-Lookup hinaus noetig — Create-Array reicht.
- Bestehende Candidates-Routen brauchen keine Aenderung; `assetId` ist nach der
  Migration einfach nullable statt immer gesetzt.

---

## Abhaengigkeiten

- IF-023 (Listings UI) — merged ✓
- Kein weiteres Ticket blockiert dieses

---

## Referenzen

Review: REVIEW-IF-033 (nach Implementierung)
