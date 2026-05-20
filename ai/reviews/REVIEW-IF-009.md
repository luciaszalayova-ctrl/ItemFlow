# REVIEW-IF-009

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-009-candidates-api`  
Commit: `62b17a9`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-009-candidates-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/candidates/route.ts` (neu)
- `apps/api/app/api/projects/[id]/candidates/[cid]/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `prisma.$transaction()` beim Accept (Qualitätsverbesserung)**

Das Ticket spezifizierte kein Transaction-Wrapping für den Accept-Pfad.
Codex hat Candidate-Update + InventoryItem-Create korrekt in eine Transaktion
gepackt. Das verhindert inkonsistente DB-Zustände wenn der zweite Write fehlschlägt
(Candidate auf `accepted`, aber kein InventoryItem).
→ Besser als im Ticket spezifiziert. ✓

**2. `CandidateStatusSchema.safeParse()` für den Status-Filter**

Das Ticket spezifizierte einen rohen `as CandidateStatus`-Cast.
Codex validiert den Query-Parameter mit dem Schema und gibt `400` bei ungültigem Wert.
→ Korrektere Boundary-Validierung. ✓

**3. `findFirst` mit `{ id: cid, projectId }` für Candidate-Lookup**

Zusätzlicher Cross-Check: Candidate muss zum Projekt gehören.
Verhindert IDOR wenn eine `cid` aus einem anderen Projekt erraten wird.
→ Defense-in-depth, über Ticket-Spec hinaus. ✓

---

## Verbesserungen (Non-Blocker)

**1. `candidateSelect` in GET nicht als Konstante in `[cid]/route.ts` wiederverwendbar**

Die beiden Route-Dateien sind getrennt, daher kein Sharing. Akzeptabel.
→ Kein Blocker.

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt (nicht direkt via Candidate) — `project.userId !== session.user.userId`
- [x] Candidate-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] `409` bei bereits verarbeitetem Candidate (`status !== 'pending'`)
- [x] `request.json()` in try/catch
- [x] Keine internen/sensitiven Felder in Responses (explizite selects)
- [x] Soft-deleted Projekte werden als `Not found` behandelt

---

## Akzeptanzkriterien

- [x] `GET /api/projects/[id]/candidates` gibt Candidates des Projekts zurück
- [x] `GET` mit `?status=pending` filtert korrekt (+ validierter Enum-Wert)
- [x] `GET` gibt `403` bei fremdem Projekt
- [x] `PATCH accept` → Candidate `accepted`, InventoryItem angelegt, `inventoryItemId` in Response (`201`)
- [x] `PATCH reject` → Candidate `rejected`
- [x] `PATCH` auf bereits verarbeiteten Candidate → `409`
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Implementierung erfüllt alle Akzeptanzkriterien und geht an zwei
Stellen über den Ticket-Spec hinaus (Transaction, Enum-Validierung). Beides ist
eine Verbesserung, kein Scope-Creep.
