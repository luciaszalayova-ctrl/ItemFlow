# Architekturentscheidungen

Nutze diese Datei, um wichtige Projektentscheidungen festzuhalten.

## Vorlage

```text
## ADR-000: Title

Datum:

Status:
Vorgeschlagen / Akzeptiert / Abgelehnt / Ersetzt

Kontext:

Entscheidung:

Folgen:

Erwogene Alternativen:
```

## ADR-001: Menschlich beaufsichtigte Marketplace-Automatisierung

Datum: 2026-05-19

Status: Akzeptiert

Kontext:

Marketplace-Automatisierung kann Compliance-, Vertrauens- und Kontorisiken verursachen, wenn das System automatisch veroeffentlicht, erneut postet oder Nachrichten sendet.

Entscheidung:

Das Produkt startet als menschlich beaufsichtigter Assistent. Es darf Listing-Entwuerfe erzeugen, Daten exportieren und Formulare vorausfuellen, muss aber vor irreversiblen Aktionen stoppen, solange keine offizielle konforme API-Integration implementiert ist und der Nutzer nicht ausdruecklich bestaetigt.

Folgen:

- Langsamer als Vollautomatisierung.
- Sicherer fuer Nutzer.
- Leichter zu testen.
- Bessere Produktpositionierung.
- Verringert das Risiko von Plattform-Kontoproblemen.

Erwogene Alternativen:

- Vollautomatisches Browser-Posting.
- Nur manuelles Copy-and-paste.
- Ausschliesslich offizielle API-Integrationen.
