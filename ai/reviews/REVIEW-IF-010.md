# REVIEW-IF-010

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-010-items-api`  
Commit: `55f12d2`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-010-items-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/items/route.ts` (neu)
- `apps/api/app/api/projects/[id]/items/[iid]/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `InventoryItemStatusSchema.safeParse()` für den Status-Filter**

Das Ticket spezifizierte einen rohen `as InventoryItemStatus`-Cast.
Codex validiert den Query-Parameter mit dem Schema und gibt `400` bei ungültigem Wert.
Konsistentes Muster mit IF-009. ✓

**2. Status-Schutz als Allowlist statt Blocklist**

Das Ticket listete explizit `scored`, `listing_created`, `handled` als gesperrte Zustände.
Codex prüft stattdessen: `status !== 'draft' && status !== 'ready_for_scoring'` → `409`.
Das ist robuster — zukünftige neue Status-Werte werden automatisch gesperrt,
ohne dass die Route angepasst werden muss.
→ Besser als im Ticket spezifiziert. ✓

**3. `findFirst` mit `{ id: iid, projectId }` für Item-Lookup**

Verhindert IDOR — ein Item aus einem fremden Projekt kann nicht über diese Route
gelesen oder geändert werden, selbst wenn die `iid` erraten wird.
Konsistentes Muster mit IF-009. ✓

---

## Verbesserungen (Non-Blocker)

**1. `itemSelect` in beiden Dateien dupliziert**

Gleiche Situation wie bei IF-008/IF-009. Kein Blocker für MVP.
Adressieren wenn eine dritte Item-Route hinzukommt.

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt — `project.userId !== session.user.userId` → 403
- [x] Item-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] Status-Schutz: nur `draft` + `ready_for_scoring` editierbar → `409` sonst
- [x] `UpdateInventoryItemSchema` aus `@itemflow/shared` — kein eigenes Schema
- [x] `status`-Feld nicht in `UpdateInventoryItemSchema` → nicht über PATCH änderbar
- [x] `request.json()` in try/catch
- [x] Explicit `itemSelect` auf Update — kein blindes Prisma-Objekt zurückgegeben

---

## Akzeptanzkriterien

- [x] `GET /api/projects/[id]/items` gibt Items des Projekts zurück
- [x] `GET` mit `?status=ready_for_scoring` filtert korrekt (+ validierter Enum-Wert)
- [x] `GET /api/projects/[id]/items/[iid]` gibt einzelnes Item zurück
- [x] `PATCH` mit gültigem Body aktualisiert Item
- [x] `PATCH` mit ungültigem Body gibt `400` mit `details`
- [x] `PATCH` auf `scored`/`listing_created`/`handled` Item gibt `409`
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Implementierung ist korrekt, sicher und vollständig.
Status-Schutz als Allowlist ist eine sinnvolle Verbesserung gegenüber dem Ticket-Spec.
