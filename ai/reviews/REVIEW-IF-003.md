# REVIEW-IF-003

Datum: 2026-05-20
Reviewer: Claude Code
Branch: `feature/IF-003-rule-based-scoring-engine`
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-003-rule-based-scoring-engine.md`

Geänderte Dateien:
- `packages/scoring/src/engines/rule-based.ts` (neu)
- `packages/scoring/src/engines/rule-based.test.ts` (neu)
- `packages/scoring/src/index.ts` (Export ergänzt)
- `packages/scoring/package.json` (vitest ergänzt)
- `pnpm-lock.yaml` (aktualisiert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Verbesserungen (Non-Blocker)

**1. Typ-Diskrepanz bei `expectedPriceCents`**

`ScoringResult.expectedPriceCents` ist als `number | null` deklariert, aber
`estimatePrice()` gibt immer `number` zurück — der Wert wird nie `null`.
Downstream-Code braucht den Null-Guard nicht. Kein Bug, aber die Typdefinition
sollte bei der nächsten Interface-Stabilisierung zu `number` geengt werden.

**2. `"elektro"` in SENSITIVE_CATEGORIES und CATEGORY_SCORE_RULES**

Items mit `"elektro"` in der Kategorie bekommen gleichzeitig hohe `resaleValue`/`demand`-
Scores und landen immer in `needs_review`. Das ist ticket-konform und bewusst konservativ —
sollte aber bei der Scoring-Kalibrierung in Phase 1 erneut bewertet werden.

**3. Fehlende Tests für `donate` und `give_away`**

Die Aktionen `donate` und `give_away` sind nicht direkt getestet. Der Code-Pfad
existiert korrekt, ist aber ungetestet. Akzeptabel für MVP — als erstes Ziel beim
Kalibrieren ergänzen.

**4. Kein Test für Bundle mit sensitiver Kategorie**

`scoreBundle()` mit einem sensitiven Item → `needs_review` ist nicht getestet.
Der Code-Pfad ist vorhanden (`results.some(r => r.isSensitiveCategory)`).

---

## Sicherheitsprüfung

- [x] Keine Credentials im Code
- [x] Kein Auto-Publish
- [x] Sensitive Kategorien führen immer zu `needs_review` ✓
- [x] Keine irreversiblen Entscheidungen allein auf Basis von Scores
- [x] Threshold-Overrides erlauben Kalibrierung ohne Code-Änderung

---

## Tests

- [x] 7 Unit-Tests — alle Kern-Szenarien abgedeckt
- [x] Bosch Akkuschrauber → `sell_individually` ✓
- [x] 3 Kinderbücher (quantity 3) → `bundle` ✓
- [x] Defektes Gerät mit `defects` → `recycle_dispose` ✓
- [x] Kindersitz → `needs_review` + `isSensitiveCategory: true` ✓
- [x] Kabel-Durcheinander → `bundle` oder `give_away`, Preis < 10 EUR ✓
- [x] Threshold-Override `sellMinScore: 99` → kein `sell_individually` ✓
- [x] `scoreBundle()` mit 3 Büchern → `bundle` ✓
- [x] `pnpm typecheck` grün
- [x] `pnpm test` grün
- [x] `pnpm lint` grün

---

## Architektur

- [x] `ScoringEngine`-Interface vollständig implementiert
- [x] Kleine pure Hilfsfunktionen — gut testbar und lesbar
- [x] `DEFAULT_THRESHOLDS` + Partial-Override-Pattern korrekt
- [x] Preisheuristik (basePriceCents × conditionFactor × brandFactor) nachvollziehbar
- [x] `averageItemScores` korrekt: Durchschnitt der Komponenten, nicht des vorberechneten Totals
- [x] Bundle-Fit-Boost (+1 bei > 2 Items) greift nur auf `bundleFit`, nicht auf `total` — konsistent mit Einzelartikel-Logik
- [x] Exportierte Konstanten (`PREMIUM_BRANDS` etc.) erlauben externe Nutzung

---

## Empfehlung

**approved** — Implementierung ist korrekt, alle Akzeptanzkriterien erfüllt,
alle Checks grün. Offene Non-Blocker für Kalibrierungsphase vormerken.