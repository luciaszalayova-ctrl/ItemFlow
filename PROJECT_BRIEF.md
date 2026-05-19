# Projektueberblick: AI Resale Assistant

## Arbeitstitel

AI Resale Assistant

## Ein-Satz-Zusammenfassung

Ein menschlich beaufsichtigter Assistent, der Haushalten hilft, Unordnung in Geld zu verwandeln, indem er Fotos von Gegenstaenden analysiert, entscheidet, was sich fuer den Verkauf lohnt, niedrigpreisige Gegenstaende zu Paketen buendelt, Marketplace-Listings erzeugt und optional Formulare zur Freigabe durch den Nutzer vorausfuellt.

## Problem

Viele Haushalte besitzen Gegenstaende mit Wiederverkaufswert, aber der Verkauf kostet viel Zeit. Die groesste Reibung entsteht nicht nur beim Veroeffentlichen von Listings, sondern schon bei der Frage, was sich ueberhaupt lohnt, welche Preise realistisch sind, wie gute Beschreibungen geschrieben werden, welche Fotos geeignet sind, welcher Marketplace passt und wie man Transaktionen mit geringem Wert vermeidet, die nur Zeit kosten.

## Zielgruppen

Primaere Nutzer:

- Familien mit Kindern und vielen wiederkehrenden Gegenstaenden wie Kleidung, Spielzeug, Buechern, Babyausstattung, Sportartikeln und Haushaltswaren.
- Menschen, die einen Umzug vorbereiten.
- Menschen, die Keller, Garagen, Abstellraeume oder Dachboeden ausmisten.
- Menschen, die Verschwendung vermeiden, aber dennoch einen Teil des Werts zurueckholen moechten.

Sekundaere Nutzer:

- Haushaltsaufloesungen und Erbschaftssituationen.
- Wohngemeinschaften oder geteilte Haushalte.
- Studierende vor dem Auszug.
- Kleine Wiederverkaeufer mit Bedarf an einem schlanken Intake-Workflow.

## Zentrales Nutzerergebnis

Der Nutzer moechte mit moeglichst wenig wiederholtem Aufwand so viel Wert wie vernuenftig moeglich zurueckholen.

Das Produkt sollte folgende Fragen beantworten:

- Was ist das fuer ein Gegenstand?
- Lohnt es sich, ihn zu verkaufen?
- Sollte er einzeln verkauft, gebuendelt, verschenkt, gespendet, recycelt oder entsorgt werden?
- Wo sollte er eingestellt werden?
- Welcher Preis ist sinnvoll?
- Was sollte im Listing stehen?
- Welche Fotos sollten genutzt werden?
- Welche Schritte brauchen noch menschliche Bestaetigung?

## Produktprinzipien

1. Optimiere auf Nettowert, nicht auf theoretischen Wiederverkaufspreis.
2. Halte den Nutzer im Kontrollpunkt, bevor irgendetwas oeffentlich veroeffentlicht wird.
3. Bevorzuge konservative Automatisierung gegenueber riskantem Plattformverhalten.
4. Validiere alle KI-generierten strukturierten Daten gegen Schemas.
5. Mach jede Empfehlung nachvollziehbar.
6. Behandle Marketplace-Automatisierung als teilautomatisiert, solange keine offizielle API genutzt wird.
7. Starte eng fokussiert und erweitere spaeter.

## MVP-Umfang

Das MVP sollte diesen Ablauf unterstuetzen:

1. Der Nutzer laedt mehrere Fotos von Haushaltsgegenstaenden hoch.
2. Das System speichert die Bilder.
3. Das System analysiert die Bilder und schlaegt Inventargegenstaende vor.
4. Der Nutzer prueft und korrigiert erkannte Gegenstaende.
5. Das System bewertet jeden Gegenstand.
6. Das System empfiehlt eine von folgenden Optionen:
   - einzeln verkaufen
   - buendeln
   - verschenken
   - spenden
   - recyceln/entsorgen
7. Das System erzeugt Entwurfs-Listings fuer verkaufbare Gegenstaende oder Pakete.
8. Der Nutzer kann Listing-Daten kopieren oder exportieren.

## Ausdruecklich ausserhalb des MVP

- Vollautomatische Veroeffentlichung von Listings.
- Vollautomatische Kommunikation mit Interessenten.
- Vollautomatische Preisverhandlungen.
- Zahlungen.
- Erstellung von Versandlabels.
- Marketplace-Scraping im grossen Stil.
- Umgehung von Anti-Bot-Systemen.
- Veroeffentlichung ohne Nutzerfreigabe.

## Erfolgsmetriken

Fruehe MVP-Metriken:

- Zeit vom Foto-Upload bis zur geprueften Gegenstandsliste.
- Anteil korrekt identifizierter Gegenstaende nach Nutzerkorrektur.
- Anteil korrekt klassifizierter Gegenstaende als verkaufen/buendeln/verschenken.
- Anzahl sofort nutzbarer Listings pro Sitzung.
- Vom Nutzer wahrgenommene Zeitersparnis.
- Geschaetzter Brutto-Wiederverkaufswert.
- Geschaetzter Nettowert nach Abzug von Zeitkosten.

Metriken fuer ein kommerzielles Produkt:

- Aktivierungsrate: Nutzer, die ihren ersten Gegenstands-Batch hochladen.
- Rate erzeugter Listings.
- Veroeffentlichungs-/Exportrate.
- Sell-through-Proxy, falls Nutzer Ergebnisse nachverfolgen.
- Woechentliche aktive Ausmist-Sitzungen.
- Bindung waehrend Umzugs- oder Ausmistprojekten.
- Umsatz pro aktivem Haushalt.

## Zentrale Risiken

- Fehlerhafte Objekterkennung.
- Ueberschaetzte Wiederverkaufspreise.
- Plattformautomatisierung, die gegen Nutzungsbedingungen verstoesst.
- Nutzerfrust durch zu viele Vorschlaege fuer sehr niedrigwertige Listings.
- Inkonsistente KI-Ausgaben.
- Datenschutzbedenken bei Fotos aus dem eigenen Zuhause.
- Fragile Browser-Automatisierung.

## Strategische Positionierung

Positioniere das Produkt nicht als "automatischen Marketplace-Spammer".

Positioniere es stattdessen als:

- KI-Ausmistassistent
- KI-Wiederverkaufsplaner
- Haushalts-zu-Geld-Workflow
- Foto-zu-Listing-Assistent
- Familien-Ausmistassistent

## Erste Produkthypothese

Der hoechste Wert entsteht durch die Entscheidung "verkaufen oder ueberspringen" und durch die Buendelungslogik, nicht durch vollautomatisches Posten.

## Empfohlenes erstes Experiment

Nutze eine echte Haushaltskiste mit 20 bis 40 gemischten Gegenstaenden.

Lass das System oder einen manuellen Prototypen Folgendes erzeugen:

- Gegenstandsinventar
- Entscheidung verkaufen/buendeln/verschenken
- Preisvorschlaege
- Listing-Entwuerfe
- geschaetzten Nettowert
- eingesparte Zeit

Vergleiche das anschliessend mit dem tatsaechlichen Urteil des Nutzers und den realen Verkaufsergebnissen.
