# Roadmap

## Phase 0: Manueller Prototyp

Ziel:

Den Workflow manuell mit echten Haushaltsgegenstaenden validieren.

Aufgaben:

- Fotos von einer Kiste oder einem Regal machen.
- Gegenstaende manuell identifizieren.
- Empfehlungen erzeugen.
- Listing-Entwuerfe erzeugen.
- Mit dem Urteil des Nutzers vergleichen.

Erfolg:

- Der Nutzer bestaetigt, dass die Empfehlung Zeit spart.
- Mindestens einige Listings sind mit wenig Bearbeitung nutzbar.

## Phase 1: MVP-Grundlage

Ziel:

Foto-Upload, Gegenstandserkennung, Review, Scoring und Listing-Entwuerfe aufbauen.

Funktionen:

- Projekterstellung.
- Mehrfach-Bildupload.
- Vision-Provider-Interface.
- Mock-Vision-Provider.
- Liste mit Gegenstandskandidaten.
- Review-UI.
- Scoring-Engine.
- Listing-Generator.
- Listings exportieren/kopieren.

## Phase 1.5: Hybrider ChatGPT-Import

Ziel:

Den Mock-Provider ueberbruecken, ohne einen kostenpflichtigen KI-Anbieter einzubinden.
Nutzer koennen Fotos in ChatGPT hochladen, das Ergebnis-JSON in ItemFlow einfuegen
und danach den normalen Review-Flow nutzen.

Funktionen:

- Copy-Paste-Prompt fuer ChatGPT (in PROMPTS.md dokumentiert).
- Import-Endpunkt: `POST /api/projects/:id/candidates/import`.
- Validierung per `VisionCandidateRawSchema` (Zod, bereits vorhanden).
- Import-UI: Textarea, Vorschau, Bestaetigung.
- Ergebnis: `ItemCandidate`-Eintraege — identisch zur automatischen Erkennung.

Voraussetzung fuer Phase 2:

- Phase 1.5 ist optional; Phase 2 (echter Vision-Provider) ersetzt sie vollstaendig.
- Beide Pfade erzeugen dieselben `ItemCandidate`-Eintraege — der Rest des Flows ist unveraendert.

## Phase 2: KI-Bildanalyse integrieren

Ziel:

Den Mock-Provider durch echte KI-Bildanalyse ersetzen oder ergaenzen.

Funktionen:

- Strukturierte Vision-Prompts.
- Zod-Validierung.
- Confidence-Bewertung.
- Speicherung roher Ausgaben.
- Fehlerbehandlung.
- Nutzer-Korrekturschleife.

## Phase 3: Besseres Scoring und Bundling

Ziel:

Entscheidungen fuer verkaufen/buendeln/verschenken verbessern.

Funktionen:

- Kategoriespezifisches Scoring.
- Bundle-Vorschlaege.
- Aufwandsschaetzung.
- Unterdrueckung geringwertiger Gegenstaende.
- Nutzerpraeferenzen.

## Phase 4: Preisrecherche

Ziel:

Preisschaetzungen verbessern.

Funktionen:

- Links fuer manuelle Recherche.
- Provider fuer verkaufte/abgeschlossene eBay-Preise, falls verfuegbar.
- Konservative Preisspannen.
- Confidence-Stufen.
- Preisbegruendung.

## Phase 5: Teilautomatisierung

Ziel:

Copy-and-paste-Aufwand reduzieren und den Nutzer dabei in Kontrolle halten.

Funktionen:

- Playwright-Prototyp fuer Vorausfuellen.
- Dry-Run-Modus.
- Vor dem Veroeffentlichen stoppen.
- Vorausfuellen fuer Bildupload.
- Formular-Mapping pro Marketplace.

## Phase 6: Offizielle Marketplace-Integrationen

Ziel:

Konforme API-basierte Integrationen hinzufuegen, wo das moeglich ist.

Funktionen:

- eBay-Inventory-/Listing-API-Integration.
- OAuth.
- Listing-Review.
- Einreichungslogs.
- Fehlerbehandlung.

## Phase 7: Kommerzialisierung

Ziel:

Den validierten Workflow in ein Produkt verwandeln.

Funktionen:

- Onboarding.
- Preisgestaltung.
- Nutzungslimits.
- Projektvorlagen.
- Datenloeschung.
- Analytics.
- Billing.
