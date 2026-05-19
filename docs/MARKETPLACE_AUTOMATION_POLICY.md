# Richtlinie zur Marketplace-Automatisierung

## Zweck

Sichere Grenzen fuer Marketplace-Automatisierung definieren.

## Standardregel

Das Produkt darf den Nutzer unterstuetzen, aber keine irreversiblen Marketplace-Aktionen ohne ausdrueckliche Nutzerbestaetigung ausfuehren.

## Erlaubt

Im MVP und in fruehen Versionen erlaubt:

- Marketplace-reife Listing-Entwuerfe erzeugen.
- Listing-Daten exportieren.
- Listing-Text in die Zwischenablage kopieren.
- Bilder vorbereiten.
- Kategorien vorschlagen.
- Preise vorschlagen.
- Marketplace-Seiten oeffnen.
- Marketplace-Formulare mit Playwright vorausfuellen.
- Vor dem finalen Absenden/Veroeffentlichen stoppen.
- Den Nutzer um manuelle Bestaetigung bitten.

## Standardmaessig nicht erlaubt

Standardmaessig nicht implementieren:

- Automatische Veroeffentlichung.
- Automatisches Reposting.
- Automatisches Neueinstellen.
- Automatische Kommunikation mit Interessenten.
- Automatische Verhandlung.
- Massenposting im Bot-Stil.
- Umgehung von Anti-Bot-Systemen.
- Speicherung von Zugangsdaten im Quellcode.
- Scraping im grossen Stil.
- Gefaelschtes Nutzerverhalten.

## Ausnahme fuer offizielle APIs

Automatische Erstellung von Listings darf nur in Betracht gezogen werden, wenn:

1. Der Marketplace eine offizielle API fuer diese Aktion anbietet.
2. Die Integration den Nutzungsbedingungen des Marketplace entspricht.
3. Der Nutzer die Aktion ausdruecklich autorisiert.
4. Der Nutzer das Listing vor der Veroeffentlichung pruefen kann.
5. Das System protokolliert, was eingereicht wurde.

## Playwright-Regeln

Playwright ist fuer persoenliche oder prototypische Teilautomatisierung akzeptabel, wenn es:

- lokal laeuft.
- die Sitzung bzw. den Browser des Nutzers verwendet.
- Formulare transparent ausfuellt.
- vor dem Veroeffentlichen stoppt.
- nicht versucht, Bot-Schutz zu umgehen.
- keine Bulk-Posting-Schleifen ausfuehrt.

## Compliance-Risikostufen

Geringes Risiko:

- Entwurfs-Generierung.
- Export.
- Copy-and-paste-Helfer.

Mittleres Risiko:

- Browser-Vorausfuellen, das vor dem Absenden stoppt.

Hohes Risiko:

- Automatische Veroeffentlichung ueber Browser-Automatisierung.
- Automatisierte Nachrichten.
- Automatisches Reposting.

Hoechstes Risiko:

- Anti-Bot-Umgehung.
- Kontoerstellung.
- Grossflaechiges Scraping.

## Produktpositionierung

Das Produkt sollte als menschlich beaufsichtigter Assistent vermarktet werden, nicht als Bot.
