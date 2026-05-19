# Teststrategie

## Ziel

Sicherstellen, dass das Produkt verlaessliche, nachvollziehbare und sichere Empfehlungen erzeugt.

## Testebenen

## Unit-Tests

Pure Business-Logik testen.

Muss abdecken:

- Scoring-Engine
- Empfehlungsschwellen
- Bundle-Heuristiken
- Generierung von Listing-Texten
- Schema-Validierung
- Preisformatierung
- Kategorie-Mapping

## Integrationstests

Workflows ueber mehrere Module hinweg testen.

Muss abdecken:

- Bildupload bis zur Asset-Erstellung
- Gegenstandskandidat bis zum Inventargegenstand
- Inventargegenstand bis zur Empfehlung
- Empfehlung bis zum Listing-Entwurf
- Erzeugung von Exportformaten

## End-to-End-Tests

Playwright fuer Nutzerablaeufe einsetzen.

Muss abdecken:

- Projekt erstellen
- Fotos hochladen
- erkannte Gegenstaende pruefen
- Empfehlungen erzeugen
- Listing-Entwurf erzeugen
- Listing kopieren/exportieren

## Tests fuer Marketplace-Automatisierung

Muessen standardmaessig im Dry-Run laufen.

Zu testen:

- Formular-Mapping
- Pflichtfelder
- Stop-before-publish-Verhalten
- Umgang mit fehlenden Bildern
- ungueltige Listing-Daten
- Nutzerabbruch

## Tests fuer KI-Provider

Normale Testlaeufe sollen nicht von Live-Modellaufrufen abhaengen.

Verwende:

- Fixtures
- gemockte Provider-Antworten
- Schema-Validierung
- Golden-Testfaelle

## Beispiel-Fixtures

Verwende repraesentative Gegenstaende:

- Kinderbuecher-Bundle
- LEGO-/Duplo-Bundle
- IKEA-Moebelstueck
- Marken-Kleidungsstueck
- unbekanntes Kabel-Bundle
- alte Elektronik
- beschaedigter Gegenstand
- unsicherer/sensibler Gegenstand

## Minimale CI-Pruefungen

- typecheck
- lint
- unit tests
- build
