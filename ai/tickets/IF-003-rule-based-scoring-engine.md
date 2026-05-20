# IF-003-rule-based-scoring-engine

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

`RuleBasedScoringEngine` implementieren — regelbasierte Implementierung des `ScoringEngine`-Interface,
die `InventoryItem`-Felder (Kategorie, Marke, Zustand, ...) auf numerische Scores mappt
und daraus eine Empfehlung (`sell_individually`, `bundle`, `give_away`, ...) ableitet.
Keine KI-Calls — reine Heuristik nach `docs/SCORING_MODEL.md`.

---

## Kontext

- `ScoringEngine`-Interface: `packages/scoring/src/index.ts`
- Scoring-Formel und Schwellen: `docs/SCORING_MODEL.md`
- Sensible Kategorien: `docs/SCORING_MODEL.md` (Abschnitt Sicherheits- und Qualitätsgrenzen)
- Vordefinierte Schwellen: `DEFAULT_THRESHOLDS` in `packages/scoring/src/index.ts`

---

## Ziel

Nach diesem Ticket kann ein `InventoryItem` (aus der Vision-Pipeline oder manuell erstellt)
automatisch bewertet und einer Empfehlungsaction zugeordnet werden.
Die Engine läuft vollständig lokal, ohne externe Dienste.

---

## Betroffene Dateien

```
packages/scoring/src/engines/rule-based.ts       NEU
packages/scoring/src/engines/rule-based.test.ts  NEU
packages/scoring/src/index.ts                    export ergänzen
```

---

## Implementierungsdetails

### Klasse: `RuleBasedScoringEngine`

```typescript
export class RuleBasedScoringEngine implements ScoringEngine {
  constructor(private readonly thresholds: ScoringThresholds = DEFAULT_THRESHOLDS) {}

  scoreItem(input: ScoringInput): ScoringResult { ... }
  scoreBundle(input: BundleScoringInput): ScoringResult { ... }
}
```

---

### Score-Mapping: Zustand → condition_score (1–5)

| Zustand (case-insensitive, enthält) | Score |
|-------------------------------------|-------|
| `neuwertig`, `wie neu`, `new`       | 5     |
| `sehr gut`, `very good`             | 4     |
| `gut`, `good`                       | 3     |
| `befriedigend`, `akzeptabel`, `ok`  | 2     |
| `defekt`, `kaputt`, `broken`        | 1     |
| `null` / unbekannt                  | 2     |

---

### Score-Mapping: Kategorie → resaleValue + demand (1–5)

| Kategorie (enthält, case-insensitive) | resaleValue | demand |
|---------------------------------------|-------------|--------|
| `elektronik`, `elektro`, `electronic` | 4           | 4      |
| `werkzeug`, `tool`                    | 4           | 3      |
| `spielzeug`, `toy`                    | 3           | 3      |
| `möbel`, `furniture`                  | 3           | 2      |
| `kleidung`, `clothing`                | 2           | 3      |
| `buch`, `bücher`, `book`              | 2           | 2      |
| `kabel`, `cable`, `zubehör`           | 2           | 2      |
| Standard (kein Match)                 | 2           | 2      |

---

### Score-Mapping: Marke → brand_score (1–5)

| Bedingung                         | Score |
|-----------------------------------|-------|
| `brand == null`                   | 1     |
| bekannte Premiummarke (s.u.)      | 5     |
| bekannte Mittelklassemarke (s.u.) | 3     |
| sonstige / unbekannte Marke       | 2     |

**Premium-Brands** (Wortliste im Code als Konstante):  
`BOSCH`, `MAKITA`, `DEWALT`, `APPLE`, `SONY`, `SAMSUNG`, `LEGO`, `PLAYMOBIL`, `NIKE`, `ADIDAS`

**Mittelklasse-Brands**:  
`IKEA`, `PHILIPS`, `TEFAL`, `BRAUN`, `BUFFALO`, `AEG`, `SIEMENS`

---

### Score-Mapping: bundle_fit_score (1–5)

| Bedingung                                     | Score |
|-----------------------------------------------|-------|
| Kategorie ist typisch für Bundles (s.u.) UND quantity > 1 | 5 |
| Kategorie ist typisch für Bundles             | 4     |
| quantity > 1                                  | 3     |
| Standard                                      | 2     |

**Bundle-Kategorien**: `buch`, `bücher`, `spielzeug`, `toy`, `kabel`, `zubehör`, `kleidung`

---

### effort_score (1–5) und shipping_penalty (0–3)

| Bedingung                                | effort_score | shipping_penalty |
|------------------------------------------|-------------|-----------------|
| Kategorie `möbel` / `furniture`          | 5           | 3               |
| Kategorie `elektronik` / Gewicht hoch    | 3           | 2               |
| Bücher, Kleidung, kleines Zubehör        | 2           | 1               |
| Standard                                 | 3           | 1               |

Da `InventoryItem` kein Gewichtsfeld hat: Möbel-Kategorie als Proxy für "groß/schwer".

---

### uncertainty_penalty (0–3)

| Bedingung                                    | Wert |
|---------------------------------------------|------|
| `condition == null` UND `defects == null`    | 2    |
| `condition == null` ODER `defects != null`   | 1    |
| beides vorhanden, keine Defekte              | 0    |

---

### Scoring-Formel

```
sell_score =
  resaleValue + demand + brand + condition
  - effort - shippingPenalty - uncertaintyPenalty

total = sell_score  (wird in ItemScores.total gespeichert)
```

---

### Empfehlungslogik (in Reihenfolge)

```
1. isSensitiveCategory == true
   → action: 'needs_review', confidence: 'low'

2. condition_score == 1 (defekt) UND defects != null
   → action: 'recycle_dispose', confidence: 'high'

3. sell_score >= sellMinScore UND expectedPriceCents >= sellMinPriceCents
   → action: 'sell_individually', confidence: hoch/mittel je nach sell_score

4. expectedPriceCents < giveAwayMaxPriceCents UND effort_score >= giveAwayMinEffortScore
   → action: 'give_away', confidence: 'medium'

5. bundle_fit_score >= bundleMinFitScore
   → action: 'bundle', confidence: 'medium'

6. condition brauchbar, resaleValue <= 2
   → action: 'donate', confidence: 'medium'

7. Fallback
   → action: 'needs_review', confidence: 'low'
```

---

### Preisschätzung (expectedPriceCents)

Einfache Heuristik (kalibrierbar in Phase 1):

```
basePriceCents = resaleValue * 1000  // 1–5 → 10–50 EUR als Basis
conditionFactor = condition_score / 5.0
brandFactor = brand_score == 5 ? 1.5 : brand_score == 3 ? 1.1 : 1.0

expectedPriceCents = round(basePriceCents * conditionFactor * brandFactor)
minimumPriceCents  = round(expectedPriceCents * 0.6)
```

---

### Sensible Kategorien (`isSensitiveCategory`)

`true` wenn `item.category` (case-insensitive) einen dieser Begriffe enthält:

```
kindersitz, kindersitze, helm, helme, babyschale, elektrisch, elektro,
medizin, medikament, kosmetik, lebensmittel, batterie, waffe, waffen
```

Wenn `isSensitiveCategory == true` → action: `needs_review`, confidence: `low`,
unabhängig von allen anderen Scores.

---

### scoreBundle

Aggregiert `ItemScores` aus allen Items (Durchschnitt), erhöht `bundle_fit_score` um 1
wenn mehr als 2 Items, überschreibt `action` mit `bundle` wenn Threshold erfüllt.
Rationale-Text: `"Bundle mit {n} Teilen. Kategorien: {Kategorien}. ..."`.

---

### Confidence-Berechnung

| Bedingung                     | ConfidenceLevel |
|-------------------------------|-----------------|
| `sell_score >= 14`            | `high`          |
| `sell_score >= 10`            | `medium`        |
| `sell_score < 10`             | `low`           |

Bei `needs_review` immer `low`.

---

### Rationale (deutsch)

Kurzer Satz, z.B.:
- `"Einzelverkauf empfohlen: hoher Wiederverkaufswert, bekannte Marke."` 
- `"Bundle empfohlen: geringer Einzelwert, aber gut bündelbar."`
- `"Verschenken empfohlen: geringer Wert, hoher Aufwand."` 
- `"Manuelle Prüfung: Kategorie erfordert Sicherheitsprüfung."`

---

## Akzeptanzkriterien

- [ ] `RuleBasedScoringEngine` implementiert `ScoringEngine`-Interface vollständig
- [ ] `scoreItem()` gibt für jedes Fixture-Szenario (s.u.) korrekte `action` zurück
- [ ] `isSensitiveCategory == true` für Kindersitz-Kategorie
- [ ] `thresholds`-Override im Constructor funktioniert (Test: sellMinScore auf 99 setzen → kein sell_individually)
- [ ] `scoreBundle()` aggregiert Items korrekt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm test` grün
- [ ] `pnpm lint` grün

---

## Test-Anforderungen

`packages/scoring/src/engines/rule-based.test.ts` — mind. 7 Szenarien:

1. **Bosch Akkuschrauber (gut)** → `sell_individually`, confidence `high`
2. **3 Kinderbücher (gut)** → `bundle`, confidence `medium`
3. **Defektes Gerät** → `recycle_dispose`
4. **Kindersitz (egal welcher Zustand)** → `needs_review`, `isSensitiveCategory: true`
5. **Kabel-Durcheinander** → `bundle` oder `give_away` (expected_price < 10 EUR)
6. **Threshold-Override**: `sellMinScore: 99` → kein `sell_individually`
7. **`scoreBundle()`** mit 3 Kinderbüchern → `bundle`

Testdaten können aus `packages/testing/src/fixtures/vision.ts` (IF-002) abgeleitet
oder direkt als InventoryItem-Literale definiert werden.

---

## Rahmenbedingungen

- `ScoringEngine`-Interface NICHT verändern
- Keine externen Dependencies (nur `@itemflow/shared`, `@itemflow/scoring` intern)
- Alle Score-Wort-Listen als exportierte Konstanten (leicht kalibrierbar)
- Rationale-Texte auf Deutsch
- Keine Preislogik-Entscheidungen außerhalb der definierten Heuristik
- Phase-1-Kalibrierung ist nicht Teil dieses Tickets

---

## Referenzen

Entscheidungen: DECISION-001 (indirekt), DEFAULT_THRESHOLDS in `packages/scoring/src/index.ts`  
Offene Fragen: keine  
Review: REVIEW-IF-003 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- KI-basiertes Scoring (Phase 2)
- Datenbankpersistenz der ScoringResult
- API-Route für Scoring
- Kalibrierung der Heuristiken (Phase 1)
- Preisvorschläge aus echten Marktdaten
