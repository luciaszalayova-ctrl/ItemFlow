# Scoring-Modell

## Zweck

Das Scoring-Modell entscheidet, ob ein Gegenstand einzeln verkauft, gebuendelt, verschenkt, gespendet, recycelt oder entsorgt werden sollte.

## Prinzip

Optimiere auf erwarteten Nettowert, nicht auf maximalen Bruttopreis.

## Eingaben

Empfohlene Eingaben:

- Gegenstandsname
- Kategorie
- Marke
- Modell
- Zustand
- Vollstaendigkeit
- Menge
- Groesse
- Gewicht
- Versandaufwand
- lokale Nachfrage
- erwarteter Verkaufspreis
- Confidence
- geschaetzte Verkaufszeit
- Bundle-Kompatibilitaet
- Saisonalitaet
- Nutzerpraeferenz

## Einfaches MVP-Scoring

Verwende Skalen von 1 bis 5.

```text
resale_value_score
demand_score
brand_score
condition_score
bundle_fit_score
effort_score
shipping_penalty
uncertainty_penalty
```

Beispielformel:

```text
sell_score =
  resale_value_score
  + demand_score
  + brand_score
  + condition_score
  - effort_score
  - shipping_penalty
  - uncertainty_penalty
```

## Empfehlungsschwellen

Anfaengliche Heuristik:

```text
sell individually:
  sell_score >= 10 and expected_price >= 20 EUR

bundle:
  expected_price < 20 EUR and bundle_fit_score >= 4

give away:
  expected_price < 10 EUR and effort_score >= 3

donate:
  usable condition but weak resale value

recycle/dispose:
  broken, unsafe, incomplete, or not useful
```

Diese Schwellen sollten konfigurierbar sein.

## Nachvollziehbarkeit

Jede Empfehlung sollte eine kurze Begruendung enthalten.

Beispiel:

```text
Empfohlen: bundle
Begruendung: Geringer einzelner Wiederverkaufswert, aber wahrscheinlich attraktiv als Teil eines Kinderbuecher-Bundles.
```

## Confidence

Confidence-Stufen einbeziehen:

- high
- medium
- low

Niedrige Confidence sollte eine Nutzerpruefung ausloesen.

## Sicherheits- und Qualitaetsgrenzen

Empfiehl den Verkauf von Gegenstaenden nicht ohne Pruefung, wenn sie moeglicherweise unsicher, zurueckgerufen, gefaelscht, verboten oder rechtlich eingeschraenkt sind.

Potenziell sensible Kategorien:

- Kindersitze
- Helme
- Elektrogeraete
- Baby-Schlafprodukte
- Medizinprodukte
- Kosmetik
- Lebensmittel
- Batterien
- Waffen
- regulierte Gueter

Fuer diese Kategorien zusaetzliche Vorsicht oder manuelle Pruefung verlangen.
