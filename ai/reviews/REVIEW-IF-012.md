# REVIEW-IF-012

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-012-listing-generation-api`  
Commit: `ed5c3b0`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-012-listing-generation-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/items/[iid]/listing/route.ts` (neu)
- `apps/api/package.json` (`@itemflow/listings` ergänzt)
- `apps/api/tsconfig.json` (listings reference)
- `pnpm-lock.yaml` (Workspace-Sync)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. Deduplizierung der `photoAssetIds`**

Das Ticket spezifizierte `candidates.map(c => c.assetId)` ohne Deduplizierung.
Codex verwendet `Array.from(new Set(...))` — verhindert doppelte Asset-IDs wenn
mehrere Candidates auf dasselbe Asset zeigen.
→ Korrekte Verbesserung. ✓

**2. Early-Return bei leerem `sourceCandidateIds`**

```typescript
item.sourceCandidateIds.length > 0
  ? await prisma.itemCandidate.findMany(...)
  : []
```

Vermeidet unnötige DB-Query wenn das Item keine Source-Candidates hat.
→ Sauber. ✓

**3. Explizite `listing_created`-Prüfung vor der `scored`-Prüfung**

Zwei separate 409-Pfade mit unterschiedlichen Fehlermeldungen:
- `listing_created` → `'Listing already created'`
- alles andere außer `scored` → `'Item is not ready for listing generation'`

Klarer als eine einzelne Allowlist-Prüfung — unterscheidet zwischen
"schon erledigt" und "falscher Zustand".
→ Besser als im Ticket-Spec. ✓

**4. `draftSelect` als Konstante**

Explizites Select auf `listingDraft.create` — kein blindes Prisma-Objekt.
Konsistentes Muster mit `itemSelect`, `scoreableItemSelect` etc. aus IF-010/IF-011. ✓

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt → `403`
- [x] Item-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] `GeneratedListingSchema.parse(raw)` vor DB-Write — kein unvalidierter Generator-Output persistiert
- [x] `prisma.$transaction()` — ListingDraft-Create + Item-Status-Update atomar
- [x] Explicit `draftSelect` — kein blindes Prisma-Objekt zurückgegeben
- [x] Kein Re-Generating: `listing_created` → `409`

---

## Akzeptanzkriterien

- [x] `POST .../listing` gibt `ListingDraft` zurück (`201`)
- [x] `ListingDraft` ist in DB gespeichert
- [x] Item-Status ist nach Aufruf `listing_created`
- [x] `409` wenn Item nicht `scored`
- [x] `409` wenn keine Recommendation vorhanden
- [x] `409` wenn Item bereits `listing_created`
- [x] `GeneratedListingSchema.parse()` aufgerufen ✓
- [x] `@itemflow/listings` in `package.json` + `tsconfig.json` ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Implementierung ist korrekt, sicher und an drei Stellen besser
als der Ticket-Spec (Deduplizierung, Early-Return, differenzierte 409-Meldungen).
