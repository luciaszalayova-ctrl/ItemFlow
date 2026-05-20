# Architektur

## Ziel

Einen modularen, menschlich beaufsichtigten Wiederverkaufsassistenten bauen, der sich von der Listing-Generierung hin zu konformen Marketplace-Integrationen weiterentwickeln kann.

## Empfohlene Architektur

```text
apps/web
  Benutzeroberflaeche

apps/api
  API-Routen, Jobs, Authentifizierung

packages/db
  Datenbankschema und Migrationen

packages/shared
  Geteilte Typen, Schemas, Konstanten

packages/vision
  Provider fuer Bildanalyse und Normalisierung

packages/scoring
  Entscheidungslogik fuer verkaufen/buendeln/verschenken

packages/listings
  Listing-Generierung, Templates, plattformspezifische Formatierung

packages/marketplaces
  Marketplace-Provider-Interfaces

packages/automation
  Playwright-basierte Teilautomatisierung

packages/testing
  Fixtures und Test-Helfer

docs
  Produkt- und Engineering-Dokumentation
```

## Zentrale Domain-Objekte

### Project

Eine Ausmist-Sitzung oder ein Batch.

Beispiele:

- Kellerkiste
- Kinderkleidung Fruehjahr 2026
- Garagenregal
- Umzugsverkauf

### Asset

Ein hochgeladenes Foto oder Video.

### ItemCandidate

Ein vom Modell erkannter moeglicher Gegenstand vor der Nutzerbestaetigung.

### InventoryItem

Ein vom Nutzer gepruefter Gegenstand.

### Bundle

Eine Gruppe von Gegenstaenden, die gemeinsam verkauft werden soll oder vom System dafuer empfohlen wird.

### Recommendation

Eine Entscheidung fuer verkaufen/buendeln/verschenken/spenden/recyceln.

### ListingDraft

Ein marktplatzreifer Entwurf, der aus einem Gegenstand oder Bundle erzeugt wurde.

## Provider-Interfaces

Nutze fuer externe Abhaengigkeiten Provider-Interfaces.

Beispiele:

```text
VisionProvider
PricingProvider
ListingGenerator
MarketplaceProvider
AutomationProvider
StorageProvider
```

## KI-Grenze

Alle KI-Systeme sitzen hinter Provider-Interfaces.

Die Anwendung sollte nicht im gesamten Code direkt von einem einzelnen Modellanbieter abhaengen.

## Datenfluss

Automatischer Pfad (VisionProvider):

```text
Fotos hochladen
-> Asset-Eintraege anlegen
-> Assets analysieren (VisionProvider)
-> ItemCandidate-Eintraege anlegen
-> Nutzer prueft Kandidaten
-> InventoryItem-Eintraege anlegen
-> Inventargegenstaende bewerten
-> Recommendation-Eintraege anlegen
-> ListingDraft-Eintraege erzeugen
-> exportieren oder Marketplace-Formulare vorausfuellen
```

Manueller Pfad (ChatGPT-Import, Phase 1.5):

```text
Nutzer laedt Fotos manuell in ChatGPT hoch
-> Nutzer fuegt JSON-Antwort in ItemFlow ein
-> POST /api/projects/:id/candidates/import
-> Validierung per VisionCandidateRawSchema
-> ItemCandidate-Eintraege anlegen
-> (weiter wie automatischer Pfad ab "Nutzer prueft Kandidaten")
```

Beide Pfade erzeugen identische `ItemCandidate`-Eintraege.
Ab der Kandidaten-Review ist der Flow in beiden Faellen gleich.

## Strategie fuer Marketplace-Integrationen

Stufe 1:

- Listing-Entwuerfe kopieren/exportieren.

Stufe 2:

- Browser-Vorausfuellen mit Nutzerbestaetigung.

Stufe 3:

- Offizielle API-Integration, falls verfuegbar.

## Designprinzip

Marketplace-Integrationen sollten austauschbar sein. Der Kernwert des Produkts darf nicht von einem einzelnen Marketplace abhaengen.
