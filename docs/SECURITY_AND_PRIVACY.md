# Sicherheit und Datenschutz

## Datenschutzkontext

Nutzer laden Fotos aus ihrem Zuhause hoch. Diese Fotos koennen Folgendes offenlegen:

- Grundriss oder Raumaufteilung
- Gegenstaende von Kindern
- Adressen oder Etiketten
- persoenliche Dokumente
- Wertgegenstaende
- Gesichter
- Standort-Hinweise

Behandle Uploads als sensible Nutzerdaten.

## Erforderliche Schutzmassnahmen

- Bilder sicher speichern.
- Bildinhalte nicht loggen.
- Keine oeffentlichen Bild-URLs bereitstellen, ausser wenn das notwendig ist.
- Nutzern erlauben, Projekte und Assets zu loeschen.
- Nutzung externer KI-Anbieter dokumentieren.
- Daten nicht an unnoetige Dritte senden.
- Gespeicherte abgeleitete Daten minimieren.

## Geheimnisse

Niemals committen:

- API-Keys
- OAuth-Tokens
- Datenbank-Zugangsdaten
- Browser-Cookies
- Session-Storage
- `.env`

Verwende:

- `.env.example`
- Secret-Manager in Produktion
- lokale Umgebungsvariablen in der Entwicklung

## Marketplace-Konten

Marketplace-Zugangsdaten sollten im MVP nicht eingesammelt werden.

Fuer Prototypen mit Browser-Vorausfuellen:

- Lokale Browser-Sitzungen bevorzugen.
- Keine Passwoerter speichern.
- Keine Cookies im Repository speichern.
- Login nicht automatisieren, ausser er wurde ausdruecklich sicher entworfen.

## KI-Sicherheit

KI-Ausgaben sind Vorschlaege, keine Fakten.

Fuer Listings:

- Keinen Zustand erfinden.
- Keine Marke/kein Modell erfinden.
- Maengel nicht verschweigen.
- Bei Bedarf Unsicherheit sprachlich kenntlich machen.
- Fuer sensible Kategorien manuelle Pruefung verlangen.

## Sensible Gegenstandskategorien

Markieren oder manuelle Pruefung verlangen fuer:

- Babyschalen und Kindersitze
- Helme
- Elektrogeraete
- Batterien
- Medizinprodukte
- Kosmetik
- Lebensmittel
- Messer/Waffen
- regulierte Gueter
- rueckgerufene Produkte
- Markenware mit Faelschungsrisiko

## Loeschung

Das Produkt sollte das Loeschen von Folgendem unterstuetzen:

- Projekten
- Assets
- Gegenstandskandidaten
- Inventargegenstaenden
- Listing-Entwuerfen
- abgeleiteten KI-Ausgaben
