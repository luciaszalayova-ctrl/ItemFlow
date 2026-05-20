# REVIEW-IF-014

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-014-listing-approve-api`  
Commit: `d4ce5c2`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-014-listing-approve-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/listings/[lid]/approve/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Qualität

- Bodyless POST korrekt umgesetzt — `_request` ignoriert, kein `request.json()` ✓
- `reviewed`-Check vor dem allgemeinen `!== 'draft'`-Check — differenzierte Fehlermeldungen ✓
- `listingSelect` als Konstante — explizites Select auf Update ✓
- `findFirst` mit `{ id: lid, projectId }` — IDOR verhindert ✓
- `select: { id, status }` beim Lookup — minimales Select für die Prüfung ✓

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt → `403`
- [x] Listing-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] Ausschließlich `draft` → `reviewed` — kein unbeabsichtigter Statussprung möglich
- [x] Kein automatisches Veröffentlichen — Route macht nur `reviewed`, nie mehr ✓

---

## Akzeptanzkriterien

- [x] `POST .../approve` setzt `draft` → `reviewed`, gibt `200` mit Draft zurück
- [x] `409` mit `'Listing already approved'` wenn bereits `reviewed`
- [x] `409` mit `'Listing cannot be approved in current status'` bei anderen Stati
- [x] `404` wenn Listing nicht gefunden
- [x] `403` bei fremdem Projekt
- [x] Kein Request-Body erforderlich ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Korrekte, minimale Umsetzung. Human-in-the-Loop-Constraint
(nur `reviewed`, nie automatisch veröffentlicht) sauber eingehalten.
