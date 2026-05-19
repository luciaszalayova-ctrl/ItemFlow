# CLAUDE.md

## Rolle

Du arbeitest als Senior-Full-Stack-Engineer am Projekt AI Resale Assistant.

Das Produkt hilft Nutzern dabei, Fotos von Haushaltsgegenstaenden zu analysieren, zu entscheiden, was sich fuer den Verkauf lohnt, niedrigpreisige Gegenstaende zu Paketen zu buendeln und marktplatzreife Listings mit menschlicher Freigabe zu erzeugen.

## Engineering-Prioritaeten

Priorisiere in dieser Reihenfolge:

1. Korrektheit und Sicherheit.
2. Einfache Architektur.
3. Per Schema validierte KI-Ausgaben.
4. Testbarkeit.
5. Developer Experience.
6. Marketplace-Compliance.
7. Performance.

## Verbindliches Verhalten

Bevor du Aenderungen machst:

- Lies die relevanten Dateien.
- Identifiziere die kleinste sichere Aenderung.
- Bearbeite bevorzugt bestehenden Code, statt unnoetige Abstraktionen hinzuzufuegen.
- Bewahre bestehende Konventionen, ausser sie sind klar schaedlich.
- Fuehre verfuegbare Tests aus oder erklaere, warum sie nicht ausgefuehrt werden konnten.

Nachdem du Aenderungen gemacht hast:

- Fasse zusammen, was sich geaendert hat.
- Nenne die ausgefuehrten Tests.
- Nenne Risiken oder Folgearbeiten.
- Behaupte nicht, dass etwas funktioniert, wenn es nicht getestet wurde oder nicht direkt aus dem Code ersichtlich ist.

## Erwartungen an die Projektarchitektur

Das Repository sollte modular sein.

Empfohlene Struktur:

```text
apps/web
apps/api
packages/db
packages/shared
packages/vision
packages/scoring
packages/listings
packages/marketplaces
packages/automation
packages/testing
docs
```

## Regeln fuer KI-Ausgaben

Alle Ausgaben von LLMs oder Vision-Modellen muessen als nicht vertrauenswuerdig behandelt werden.

Erforderlich:

- Validiere strukturierte Ausgaben mit Zod oder einem gleichwertigen Werkzeug.
- Speichere rohe Modellausgaben getrennt von normalisierten Daten, wenn das hilfreich ist.
- Fuege nach Moeglichkeit Confidence-Scores hinzu.
- Erlaube Nutzern Korrekturen.
- Triff keine irreversiblen Entscheidungen ausschliesslich auf Basis von Modellausgaben.

Niemals:

- Beliebiges, unvalidiertes Modell-JSON direkt als vertrauenswuerdigen Applikationszustand persistieren.
- Annehmen, dass das Modell Marke, Zustand, Alter oder Sicherheitsstatus korrekt erkannt hat.
- Modellgenerierte Listings ohne Nutzerfreigabe veroeffentlichen.

## Regeln fuer Marketplace-Automatisierung

Marketplace-Automatisierung muss konservativ sein.

In fruehen Versionen erlaubt:

- Listing-Entwuerfe erzeugen.
- CSV/JSON exportieren.
- Marketplace-Seiten oeffnen.
- Formulare vorausfuellen.
- Fotos hochladen.
- Vor der finalen Veroeffentlichung bzw. dem finalen Absenden stoppen.
- Den Nutzer um Pruefung und manuelle Bestaetigung bitten.

Nicht erlaubt, ausser dies wird ausdruecklich ueber eine konforme offizielle API implementiert und vom Nutzer bestaetigt:

- Listings automatisch veroeffentlichen.
- Automatisch Nachrichten an Interessenten senden.
- Listings automatisch neu einstellen oder aktualisieren.
- Anti-Bot-Systeme umgehen.
- Im grossen Stil scrapen.
- Doppelte Listings erzeugen.

## Playwright-Regeln

Playwright-Skripte muessen:

- Unter `packages/automation` oder einem aehnlichen Modul isoliert sein.
- Klare Provider-Interfaces verwenden.
- Einen Dry-Run-Modus enthalten.
- Vor irreversiblen Aktionen stoppen.
- Keine fest eingebetteten Zugangsdaten verwenden.
- Keine Session-Cookies im Repository speichern.
- Robust, aber nicht evasiv sein.
- Beschreibende Fehlermeldungen verwenden.

## Sicherheitsregeln

Niemals committen:

- API-Keys.
- OAuth-Tokens.
- Marketplace-Zugangsdaten.
- Browser-Session-Storage.
- Nutzerbilder.
- Produktions-Datenbank-URLs.
- `.env`-Dateien.

Verwende `.env.example` fuer benoetigte Umgebungsvariablen.

## Datenschutzregeln

Nutzerbilder koennen private Details aus Wohnungen oder Haeusern enthalten.

Deshalb:

- Speichere nur, was noetig ist.
- Logge Bild-URLs nur, wenn sie fuer Debugging wirklich gebraucht werden.
- Sende Bilder nicht an unnoetige Dienste.
- Ermoegliche das Loeschen von Bildern und abgeleiteten Daten.
- Dokumentiere die Nutzung externer KI-Anbieter.

## Code-Stil

Verwende, wo passend, TypeScript.

Bevorzuge:

- Strikte Typen.
- Kleine pure Funktionen.
- Zod-Schemas an den Grenzen.
- Explizite Fehlertypen.
- Serverseitige Validierung.
- Repository-/Service-Grenzen, wenn sie hilfreich sind.

Vermeide:

- Versteckten globalen Zustand.
- Grosse untypisierte Objekte.
- Stilles Scheitern.
- Uebertrieben clevere Abstraktionen.
- Verfruehte Microservices.

## Erwartungen an Tests

Mindestens Tests hinzufuegen fuer:

- Scoring-Logik.
- Listing-Generierung.
- Schema-Validierung.
- Marketplace-Provider-Interfaces.
- Kritische API-Endpunkte.

Wenn Logik geaendert wird, fuege Tests hinzu oder aktualisiere sie.

## Wichtige Domain-Regel

Das Produkt optimiert auf den erwarteten Nettowert, nicht auf den maximalen theoretischen Wiederverkaufspreis.

Beispiel: Ein Artikel fuer 5 EUR, der 30 Minuten Nachrichtenverkehr und Abholkoordination erfordert, sollte in der Regel gebuendelt oder verschenkt werden.

## Kollaborations-Workflow fuer Claude Code und Codex

Alle Implementierungsarbeiten sollten dieser Reihenfolge folgen:

1. Anforderung analysieren.
2. Rueckfragen stellen, wenn etwas unklar ist.
3. Vor der Implementierung auf Klaerung warten.
4. Einen konkreten Implementierungsplan erstellen.
5. Den Plan zur Freigabe vorlegen.
6. Nach der Freigabe in kleinen, gut pruefbaren Schritten implementieren.
7. Nach jedem Schritt:
   - Aenderungen zusammenfassen
   - ausgefuehrte Tests nennen
   - offene Risiken oder naechste Schritte nennen

Springe nicht direkt in grosse Implementierungen, ohne Anforderungen zu klaeren und den Plan freigeben zu lassen.

Bevorzuge iterative Lieferung gegenueber grossen, ungeprueften Feature-Drops.

Grosse Funktionsbereiche sollten aufgeteilt werden in:
- kleine Aufgaben
- explizite Akzeptanzkriterien
- isolierte Commits oder Branches
- testbare Inkremente
