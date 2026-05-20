# IF-013-listings-crud-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listings-CRUD-API implementieren — Nutzer können ListingDrafts eines Projekts auflisten
und einzeln lesen und bearbeiten (Titel, Beschreibung, Preis). Voraussetzung für den
Approval-Flow in IF-014.

---

## Kontext

- `ListingDraft`-Modell: `packages/db/prisma/schema.prisma`
- `UpdateListingDraftSchema`: `packages/shared/src/schemas/listing-draft.ts`
- `ListingStatusSchema`: `packages/shared/src/schemas/listing-draft.ts`
- Auth/Session-Pattern + Ownership-Pattern: wie in IF-008 bis IF-012

---

## Ziel

Nach diesem Ticket kann ein Nutzer generierte Listing-Entwürfe sehen und korrigieren
(Titel, Beschreibung, Preis anpassen) bevor er sie freigibt.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/listings/route.ts           NEU — GET
apps/api/app/api/projects/[id]/listings/[lid]/route.ts     NEU — GET, PATCH
```

---

## Implementierungsdetails

### `GET /api/projects/[id]/listings`

Query-Parameter: `status` (optional) — validiert mit `ListingStatusSchema`

```typescript
const listings = await prisma.listingDraft.findMany({
  where: {
    projectId,
    ...(statusFilter ? { status: statusFilter } : {})
  },
  orderBy: { createdAt: 'asc' }
})
return Response.json({ listings })
```

Ownership-Prüfung via Projekt (gleicher Ansatz wie IF-009 bis IF-012).

---

### `GET /api/projects/[id]/listings/[lid]`

```typescript
const listing = await prisma.listingDraft.findFirst({
  where: { id: lid, projectId }
})
if (!listing) return Response.json({ error: 'Not found' }, { status: 404 })
return Response.json({ listing })
```

---

### `PATCH /api/projects/[id]/listings/[lid]`

Validierung mit `UpdateListingDraftSchema` aus `@itemflow/shared`.

**Status-Schutz:** Nur Drafts mit Status `draft` oder `reviewed` sind editierbar.
Alle anderen Status (`exported`, `prefilled`, `published_external`, `archived`) geben `409`:

```typescript
const EDITABLE_STATUSES = ['draft', 'reviewed']
if (!EDITABLE_STATUSES.includes(listing.status)) {
  return Response.json({ error: 'Listing cannot be edited in current status' }, { status: 409 })
}

const parsed = UpdateListingDraftSchema.safeParse(body)
if (!parsed.success) {
  return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
}

const updated = await prisma.listingDraft.update({
  where: { id: listing.id },
  data: parsed.data
})
return Response.json({ listing: updated })
```

---

## Akzeptanzkriterien

- [ ] `GET /api/projects/[id]/listings` gibt Drafts des Projekts zurück
- [ ] `GET` mit `?status=draft` filtert korrekt
- [ ] `GET /api/projects/[id]/listings/[lid]` gibt einzelnen Draft zurück
- [ ] `PATCH` mit gültigem Body aktualisiert Draft
- [ ] `PATCH` mit ungültigem Body gibt `400` mit `details`
- [ ] `PATCH` auf `exported`/`prefilled`/`published_external`/`archived` Draft gibt `409`
- [ ] `403` bei fremdem Projekt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `UpdateListingDraftSchema` aus `@itemflow/shared` nutzen — kein eigenes Schema definieren
- `status`-Feld nicht über PATCH änderbar (kein `status` in `UpdateListingDraftSchema`)
- Ownership immer via Projekt prüfen, nicht direkt via ListingDraft
- `status`-Filter mit `ListingStatusSchema.safeParse()` validieren — kein roher Cast

---

## Abhängigkeiten

- IF-012 (Listing Generation) — erstellt ListingDrafts
- IF-008 (Projects CRUD) — Ownership-Pattern

---

## Referenzen

Review: REVIEW-IF-013 (nach Implementierung)

## Scope-Grenze

Nicht Teil dieses Tickets:
- Listing löschen
- Status-Übergänge explizit triggern (kommt in IF-014)
- `actionLogs` in Response einbetten
- Bundle-Listings
