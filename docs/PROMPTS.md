# Prompt-Bibliothek

## Prompt fuer Vision-Analyse

```text
Du analysierst Fotos von Haushaltsgegenstaenden fuer einen Wiederverkaufsassistenten.

Gib nur strukturierte Gegenstandskandidaten zurueck.

Identifiziere fuer jeden sichtbaren Gegenstand:
- wahrscheinlichen Gegenstandsnamen
- Kategorie
- sichtbare Marke, wenn klar lesbar
- sichtbares Modell, wenn klar lesbar
- Hinweise auf den Zustand
- Menge
- Confidence
- Hinweise auf Unsicherheit

Erfinde keine Marke, kein Modell, kein Alter und keinen Zustand.
Wenn du unsicher bist, sage das klar.
Wenn mehrere kleine zusammengehoerige Gegenstaende gebuendelt werden sollten, gib Bundle-Potenzial an.
```

## Prompt fuer Listing-Generierung

```text
Erstelle einen Marketplace-Listing-Entwurf fuer den folgenden geprueften Gegenstand oder das folgende Bundle.

Anforderungen:
- Verwende praezise und konservative Formulierungen.
- Erfinde keine Fakten.
- Erwaehne Maengel oder Unsicherheit.
- Empfiehl einen realistischen Startpreis und einen Mindestpreis.
- Verwende deutschen Marketplace-Stil.
- Mache Abholung/Versand klar.
- Enthalte einen kurzen Titel und eine Beschreibung.
```

## Prompt fuer Scoring-Erklaerung

```text
Erklaere, warum dieser Gegenstand einzeln verkauft, gebuendelt, verschenkt, gespendet oder recycelt/entsorgt werden sollte.

Halte die Erklaerung kurz und praktisch.
Fokussiere auf erwarteten Nettowert, Aufwand, Nachfrage, Zustand und Unsicherheit.
```

## Prompt fuer Business-Analyse

```text
Analysiere diese Feature-Idee fuer den AI Resale Assistant.

Bewerte:
- Nutzwert
- eingesparte Zeit
- Umsatzpotenzial
- technische Komplexitaet
- Marketplace-Compliance-Risiko
- MVP-Fit
- empfohlenes naechstes Experiment

Gib eine knappe Empfehlung zurueck.
```

## Prompt fuer das Codex-Projekt-Bootstrap

```text
Baue das erste MVP eines KI-gestuetzten Wiederverkaufsassistenten fuer das Ausmisten von Haushalten.

Ziel:
Nutzer laden Fotos von Haushaltsgegenstaenden hoch. Die App erkennt wahrscheinliche Gegenstaende, erstellt eine Inventarliste, laesst Nutzer Gegenstaende pruefen/korrigieren und erzeugt Wiederverkaufsempfehlungen.

Tech:
Next.js, TypeScript, Postgres, Prisma, Zod, Playwright, Objekt-Storage-Abstraktion.

MVP-Umfang:
1. UI fuer Bildupload
2. Datenmodell fuer Inventargegenstaende
3. Interface fuer Vision-Analyse-Jobs, zunaechst mit Mock-Provider
4. Review-Screen fuer erkannte Gegenstaende
5. Scoring-Engine: einzeln verkaufen / buendeln / verschenken / entsorgen
6. Listing-Generator mit Titel, Beschreibung, Preisvorschlag, Mindestpreis, Plattformempfehlung
7. Tests fuer Scoring und Listing-Generierung
8. README mit lokalem Setup

Wichtig:
Implementiere noch kein echtes Marketplace-Posting.
Nutze Provider-Interfaces, damit spaeter eBay API, Kleinanzeigen Playwright und Vinted Playwright hinzugefuegt werden koennen.
Halte alle KI-Ausgaben mit Zod schema-validiert.
```
