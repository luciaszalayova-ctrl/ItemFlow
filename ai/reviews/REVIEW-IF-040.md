# REVIEW-IF-040

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-040-asset-loeschen`  
Commit: `53bc287`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-040-asset-loeschen.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/assets/[aid]/route.ts` (neu)
- `apps/api/app/api/projects/[id]/assets/route.ts` (GET hinzugefügt, POST erweitert)
- `apps/api/app/projects/[id]/upload/page.tsx` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**GET `/api/projects/:id/assets` hinzugefügt:**

Nicht im Ticket verlangt, aber notwendig, damit die Upload-Seite bestehende
Assets beim Laden der Seite anzeigen kann. Saubere Lösung — kein lokaler
State-Trick, der nach einem Hard-Reload veraltet wäre. ✓

**POST gibt jetzt auch `asset`-Objekt zurück:**

Ermöglicht, neu hochgeladene Assets direkt in die Asset-Liste der Upload-Seite
einzufügen ohne einen zweiten GET. Rückwärtskompatibel, da bisherige Felder
(`candidateCount`) erhalten bleiben. ✓

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check auf `[aid]`-Route: `projectId`-Match vor Löschung ✓
- [x] `storage.delete().catch(() => {})` — Storage-Fehler blockieren nicht den DB-Delete ✓
- [x] `prisma.asset.delete()` — FK-Cascade setzt `assetId` in zugehörigen
      Candidates auf `null` (per Migration IF-033) ✓
- [x] `window.confirm` verhindert versehentliches Löschen ✓
- [x] 204 ohne Body bei Erfolg ✓

---

## Akzeptanzkriterien

- [x] `DELETE /api/projects/:id/assets/:aid` löscht Storage-Datei und DB-Eintrag ✓
- [x] Storage-Fehler sind nicht blockierend ✓
- [x] Verknüpfte Candidates behalten `assetId: null` (kein Cascade auf Candidates) ✓
- [x] Upload-Seite zeigt bestehende Assets nach Seitenlade ✓
- [x] Asset verschwindet nach Löschen aus der Liste (optimistisch oder nach Reload) ✓
- [x] Bestätigungsdialog vor Löschung ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Alle Akzeptanzkriterien erfüllt. Die zusätzlichen GET- und
POST-Erweiterungen sind sinnvoll und fügen sich kohärent ins bestehende
Pattern ein.
