# REVIEW-IF-049 — Auto-Accept: Threshold-basierte Kandidatenübernahme

**Branch:** feature/IF-049-auto-accept (oder gemerged)  
**Reviewed:** 2026-05-20  
**Reviewer:** CC (Claude Code)  
**Status:** ✅ Freigabe empfohlen — 1 mittlerer Hinweis, 1 kleiner Hinweis

---

## Was wurde implementiert

- `ProjectSettingsSchema` mit `autoAcceptThreshold` (0–1, Default 0.85) in `packages/shared`
- `shouldAutoAccept(confidence, threshold): boolean` in `packages/scoring` mit 6 Unit-Tests — alle grün
- Import-Route liest Threshold aus `project.settings`, akzeptiert Kandidaten mit hoher Konfidenz direkt, gibt `autoAccepted` + `pendingCount` zurück
- Import-Page zeigt Zusammenfassung + kontextuelle Links statt sofort weiterzuleiten
- `ThresholdSetting`-Client-Komponente auf der Projektseite

---

## Befunde

### ✅ Korrekt und sicher

**`shouldAutoAccept` — pure Funktion, vollständig getestet**  
[`packages/scoring/src/auto-accept.ts`](../../packages/scoring/src/auto-accept.ts):
```ts
export function shouldAutoAccept(confidence: number, threshold: number): boolean {
  return confidence >= threshold
}
```
Einfach, deterministisch, keine Seiteneffekte. Die 6 Tests decken Boundary-Cases ab: `confidence === threshold` (inklusiv), `threshold === 0` (accept all), `threshold === 1` (nur perfekte Konfidenz). Gut.

**Zwei-Stufen-Transaktion im Import-Handler**  
[`apps/api/app/api/projects/[id]/candidates/import/route.ts:58-112`](../../apps/api/app/api/projects/%5Bid%5D/candidates/import/route.ts):  
Erst werden alle Candidates in einer Transaktion gespeichert (`status: 'pending'`), dann werden die Auto-Accept-Kandidaten in einer zweiten Transaktion zu `InventoryItem`s umgewandelt und auf `accepted` gesetzt. Die Trennung ist korrekt — Candidates existieren immer vollständig, bevor Auto-Accept läuft.

**Settings-Fallback** — Wenn `project.settings` ungültig oder fehlt, fällt der Code auf `DEFAULT_AUTO_ACCEPT_THRESHOLD` zurück. Kein Crash, keine Silent-Failure.

**ThresholdSetting — Input-Validierung clientseitig**  
[`apps/api/app/projects/[id]/ThresholdSetting.tsx:14-15`](../../apps/api/app/projects/%5Bid%5D/ThresholdSetting.tsx):
```ts
const value = Number(draft) / 100
if (isNaN(value) || value < 0 || value > 1) return
```
Client-Guard ist vorhanden. Server-seitig validiert `UpdateProjectSchema` ebenfalls (0–1). Doppelte Absicherung — korrekt.

**Import-Page Zusammenfassung** — Statt sofort zu redirecten zeigt die Seite `autoAccepted` und `pendingCount` an und bietet kontextuelle Links ("Zu den Items" / "Candidates prüfen"). Das ist die richtige UX: Der Nutzer sieht, was passiert ist, ohne blind weitergeleitet zu werden.

---

### ⚠️ Mittlerer Hinweis

**Matching-Logik beim Rücksuchen von rawCandidate ist fragil**  
[`apps/api/app/api/projects/[id]/candidates/import/route.ts:87-89`](../../apps/api/app/api/projects/%5Bid%5D/candidates/import/route.ts):
```ts
const rawCandidate = parsed.data.candidates.find(
  (r) => r.rawLabel === candidate.rawLabel && r.normalizedName === candidate.normalizedName,
)
```
Das Rücksuchen des `rawCandidate` aus dem Input-Array (für `brand`-Extraktion) verwendet `rawLabel + normalizedName` als Schlüssel. Bei Duplikaten im Input (zwei identische Einträge) liefert `find()` immer den ersten — das `brand`-Attribut könnte dabei falsch zugeordnet werden.

**Empfehlung:** Die Candidates sollten mit einem Index oder einer clientseitig zugewiesenen ID zugeordnet werden, nicht per Textmatch. Für MVP mit manuell eingegebenem ChatGPT-JSON ist das unwahrscheinlich ein Problem, aber beim Ausbau (z. B. Upload mehrerer Bilder mit ähnlichen Items) kann es zu falschen Brand-Zuordnungen kommen.

---

### ℹ️ Kleiner Hinweis

**`ThresholdSetting` — kein Error-Feedback bei gescheitertem PATCH**  
[`apps/api/app/projects/[id]/ThresholdSetting.tsx:24-27`](../../apps/api/app/projects/%5Bid%5D/ThresholdSetting.tsx):
```ts
if (response.ok) {
  setThreshold(value)
  setSaved(true)
  setTimeout(() => setSaved(false), 2000)
}
setSaving(false)
```
Wenn der Server-Call scheitert, wird `setSaving(false)` gesetzt, aber der Nutzer sieht keine Fehlermeldung. Der Threshold bleibt im Draft-Zustand (richtig), aber ohne Feedback weiß der Nutzer nicht, ob gespeichert wurde oder nicht. Für MVP akzeptabel.

---

## Tests

- **6 Unit-Tests für `shouldAutoAccept`** — alle grün, vollständige Boundary-Abdeckung. ✅
- **Keine Integrationstests** für die Import-Route mit Auto-Accept-Pfad.
- **Keine Tests** für `ThresholdSetting`-Komponente.

---

## Schema-Konsistenz: `UpdateProjectSchema` vs. `ProjectSettingsSchema`

```ts
// shared/src/schemas/project.ts
export const ProjectSettingsSchema = z.object({
  autoAcceptThreshold: z.number().min(0).max(1).default(0.85),
})

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  settings: z.object({
    autoAcceptThreshold: z.number().min(0).max(1),
  }).optional(),
})
```

Das `settings`-Objekt in `UpdateProjectSchema` ist eine leichte Duplizierung von `ProjectSettingsSchema` (ohne `.default()`). Solange es nur ein Feld gibt, ist das unproblematisch. Bei Erweiterung sollte `UpdateProjectSchema` auf ein `ProjectSettingsSchema.partial()` refaktoriert werden.

---

## Risiken / Folgearbeiten

| # | Beschreibung | Priorität |
|---|---|---|
| 1 | `rawCandidate`-Lookup per Textmatch kann bei Duplikaten falsch zuordnen | mittel |
| 2 | `ThresholdSetting` zeigt keinen Fehler bei gescheitertem PATCH | niedrig |
| 3 | `UpdateProjectSchema.settings` ist Duplikat von `ProjectSettingsSchema` | niedrig (Refactoring) |
| 4 | Import-Route hat keine Integrationstests für Auto-Accept-Pfad | mittel (bei nächstem Test-Sprint) |

---

## Ergebnis

**✅ Freigabe empfohlen.** Der Kernmechanismus (pure Funktion, DB-Transaktionen, Fallback-Handling) ist korrekt und sicher. Die fragile Matching-Logik (Hinweis 1) ist für den aktuellen Use-Case (manueller ChatGPT-Import) unkritisch, sollte aber vor der Erweiterung auf automatischen Upload-Flow behoben werden.
