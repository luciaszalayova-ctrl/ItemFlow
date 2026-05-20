# REVIEW-IF-015

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-015-listings-export-api`  
Commit: `91bc368`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-015-listings-export-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/listings/export/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichung vom Ticket-Spec

**`exportSelect` statt manuelles Mapping**

Das Ticket spezifizierte ein manuelles `.map(l => ({ id, title, ... }))` in der Response.
Codex verwendet stattdessen `exportSelect` als Prisma-Select-Konstante und gibt
`listings` direkt zurück — kein doppeltes Mapping nötig.
Konsistentes Muster mit allen vorherigen Routen. ✓

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt → `403`
- [x] `where: { projectId, status: 'reviewed' }` — nur eigene, freigegebene Listings
- [x] Kein Re-Export: `exported`-Listings fallen aus dem Filter heraus
- [x] `prisma.$transaction()` — Status-Update + ActionLog-Create atomar ✓
- [x] Kein automatisches Veröffentlichen — Route stoppt bei `exported` ✓

---

## Akzeptanzkriterien

- [x] `POST .../export` gibt alle `reviewed`-Listings zurück
- [x] Exportierte Listings haben danach Status `exported`
- [x] Je ein `MarketplaceActionLog`-Eintrag pro Listing (`actionType: 'export'`, `status: 'completed'`)
- [x] Status-Update + ActionLog atomar in `prisma.$transaction()` ✓
- [x] `{ exported: [], count: 0 }` bei keinen `reviewed`-Listings ✓
- [x] `403` bei fremdem Projekt
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Korrekte, sichere Umsetzung. Schließt die MVP-Backend-Pipeline ab:
Upload → Candidates → Items → Score → Listing → Approve → Export ✓
