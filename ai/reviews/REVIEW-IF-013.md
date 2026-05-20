# REVIEW-IF-013

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-013-listings-crud-api`  
Commit: `20acd1d`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-013-listings-crud-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/listings/route.ts` (neu)
- `apps/api/app/api/projects/[id]/listings/[lid]/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Qualität

Saubere Umsetzung — konsistentes Muster mit IF-009 bis IF-012 ohne Abweichungen.

- `listingSelect` als Konstante in beiden Dateien — explizites Select, kein blindes Prisma-Objekt
- `ListingStatusSchema.safeParse()` für den Status-Filter — kein roher Cast ✓
- `findFirst` mit `{ id: lid, projectId }` — IDOR verhindert ✓
- Status-Schutz als Allowlist: `status !== 'draft' && status !== 'reviewed'` → `409` — konsistent mit IF-010/IF-012 ✓
- `UpdateListingDraftSchema` aus `@itemflow/shared` — kein eigenes Schema ✓
- `request.json()` in try/catch ✓
- `select: listingSelect` auf Update — kein blindes Prisma-Objekt ✓

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt → `403`
- [x] Listing-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] `status`-Feld nicht in `UpdateListingDraftSchema` → nicht über PATCH änderbar
- [x] Status-Schutz: nur `draft` + `reviewed` editierbar

---

## Akzeptanzkriterien

- [x] `GET /api/projects/[id]/listings` gibt Drafts des Projekts zurück
- [x] `GET` mit `?status=draft` filtert korrekt (+ validierter Enum-Wert)
- [x] `GET /api/projects/[id]/listings/[lid]` gibt einzelnen Draft zurück
- [x] `PATCH` mit gültigem Body aktualisiert Draft
- [x] `PATCH` mit ungültigem Body gibt `400` mit `details`
- [x] `PATCH` auf `exported`/`prefilled`/`published_external`/`archived` gibt `409`
- [x] `403` bei fremdem Projekt
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Makellose Umsetzung, vollständig konsistent mit den vorherigen Routen.
