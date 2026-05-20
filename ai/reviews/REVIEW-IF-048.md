# REVIEW-IF-048 — Zero Friction: QuickStart + InlineTitleEditor

**Branch:** feature/IF-048-zero-friction (or merged into current branch)  
**Reviewed:** 2026-05-20  
**Reviewer:** CC (Claude Code)  
**Status:** ✅ Freigabe empfohlen — 2 kleine Hinweise

---

## Was wurde implementiert

- `POST /api/projects` akzeptiert leeren Body und generiert automatisch einen deutschen Datumstitel (`Projekt 20. Mai 2026`)
- `PATCH /api/projects/[id]` neu: aktualisiert Titel und/oder Settings; merged Settings statt zu überschreiben
- `QuickStartButton` auf `/projects` — legt Projekt an und leitet direkt zu `/upload` weiter
- `InlineTitleEditor` auf der Projektseite — Klick auf `<h1>` öffnet Inline-Eingabe, Enter/Escape/Speichern-Button

---

## Befunde

### ✅ Korrekt und sicher

**PATCH-Handler Settings-Merge** ([`apps/api/app/api/projects/[id]/route.ts:90-93`](../../apps/api/app/api/projects/%5Bid%5D/route.ts)):
```ts
const existingSettings = (project.settings ?? {}) as Record<string, unknown>
const updatedSettings = parsed.data.settings
  ? { ...existingSettings, ...parsed.data.settings }
  : undefined
```
Korrekt: Partial-Settings werden gemerged, nicht ersetzt. `ThresholdSetting` sendet nur `{ settings: { autoAcceptThreshold: value } }` — andere künftige Settings-Felder bleiben erhalten.

**Zod-Validierung** — `UpdateProjectSchema` validiert Titel (1–200 Zeichen) und Settings (0–1) vor dem DB-Write. Kein unvalidierter Input landet in der DB.

**Keine NOQA-Stellen** — `generateProjectTitle()` ist ein simpler `toLocaleDateString('de-DE')` Aufruf, kein LLM-Output, keine Injection-Vektoren.

**Auth-Check** — Alle drei HTTP-Methoden (GET, PATCH, DELETE) prüfen Session und Eigentümerschaft konsistent. Reihenfolge: 401 → 404 → 403 ist korrekt (keine Information Leakage über Existenz fremder Projekte).

**InlineTitleEditor UX** — Leerer Titel oder unveränderter Titel werden abgefangen (`!trimmed || trimmed === title`), kein unnötiger API-Aufruf. Fehlerfall setzt Draft auf aktuellen Titel zurück — kein "Ghosting" des Inputs.

---

### ⚠️ Hinweise (kein Blocker)

**1. QuickStartButton — kein Fehler-Feedback für den Nutzer**  
[`apps/api/app/projects/QuickStartButton.tsx:18-21`](../../apps/api/app/projects/QuickStartButton.tsx):
```ts
if (!response.ok) {
  setLoading(false)
  return
}
```
Bei einem Fehler passiert gar nichts — der Button entsperrt sich lautlos. Für MVP akzeptabel, da `POST /api/projects` nur bei auth-Problemen fehlschlägt, aber beim Ausbau sollte hier ein kurzer Toast oder ein Fehlertext erscheinen.

**2. InlineTitleEditor — kein `aria-label` auf dem Edit-Icon**  
Das `✎`-Span in der nicht-editierenden Ansicht hat kein `aria-label`. Screen-Reader-Nutzer sehen nur ein Sonderzeichen. Der `title="Klicken zum Bearbeiten"` auf dem `<h1>` hilft etwas, ist aber kein Ersatz. Für MVP in Ordnung.

---

### ℹ️ Beobachtung: `projects/page.tsx` (Server Component) vs. `QuickStartButton` (Client)

Die Projektliste rendert als Server Component mit direktem DB-Zugriff — das ist die richtige Wahl. `QuickStartButton` ist als Client Component isoliert, die Trennung ist sauber. Keine unnötige Hydration der gesamten Seite.

---

## Tests

- Keine Unit-Tests für `generateProjectTitle()` oder den PATCH-Handler.
- Der Codex-Testlauf muss zeigen, ob bestehende E2E-Tests oder manuelle Tests durchgeführt wurden.
- `generateProjectTitle` ist eine reine Funktion ohne Seiteneffekte — trivial zu testen, aber für MVP nicht kritisch.

---

## Risiken / Folgearbeiten

| # | Beschreibung | Priorität |
|---|---|---|
| 1 | `QuickStartButton` zeigt keinen Fehler bei gescheitertem API-Call | niedrig |
| 2 | `InlineTitleEditor` fehlt `aria-label` für Accessibility | niedrig |
| 3 | `PATCH /api/projects/[id]` hat keine Tests | mittel (bei nächstem Refactoring) |

---

## Ergebnis

**✅ Freigabe empfohlen.** Die Implementierung ist korrekt, sicher und hält sich an die Projektkonventionen. Die zwei offenen Punkte sind für MVP nicht blockierend.
