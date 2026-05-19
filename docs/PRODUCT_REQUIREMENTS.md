# Produktanforderungen

## Produkt

AI Resale Assistant

## MVP: Foto-zu-Wiederverkaufsplan

## Zielsetzung

Nutzern ermoeglichen, Fotos von Haushaltsgegenstaenden hochzuladen und dafuer ein geprueftes Inventar, Empfehlungen zum Verkaufen oder Ueberspringen, Bundle-Vorschlaege und Listing-Entwuerfe zu erhalten.

## User Stories

### Fotos hochladen

Als Nutzer moechte ich mehrere Fotos von Haushaltsgegenstaenden hochladen, damit das System moegliche Wiederverkaufsartikel erkennen kann.

Akzeptanzkriterien:

- Der Nutzer kann mehrere Bilder hochladen.
- Das System zeigt den Upload-Fortschritt an.
- Das System speichert Bilder gemeinsam mit einem Projekt bzw. einer Sitzung.
- Das System lehnt nicht unterstuetzte Dateitypen ab.
- Das System geht sauber mit fehlgeschlagenen Uploads um.

### Gegenstaende erkennen

Als Nutzer moechte ich, dass das System wahrscheinliche Gegenstaende aus Fotos erkennt, damit ich nicht alles manuell eintippen muss.

Akzeptanzkriterien:

- Das System liefert strukturierte Gegenstandskandidaten zurueck.
- Jeder Kandidat hat Name, Kategorie, Confidence, sichtbare Attribute und einen Verweis auf das Quellbild.
- Der Nutzer kann erkannte Gegenstaende bearbeiten, zusammenfuehren, aufteilen oder loeschen.
- Erkennungen mit niedriger Confidence sind klar markiert.

### Inventar pruefen

Als Nutzer moechte ich die Gegenstandsliste korrigieren, bevor Empfehlungen erzeugt werden.

Akzeptanzkriterien:

- Der Nutzer kann Titel, Kategorie, Zustand, Marke, Modell, Menge und Notizen bearbeiten.
- Der Nutzer kann Gegenstaende als bereits erledigt markieren.
- Der Nutzer kann Gegenstaende manuell gruppieren.
- Aenderungen werden gespeichert.

### Gegenstaende bewerten

Als Nutzer moechte ich wissen, ob sich ein Gegenstand zum Verkaufen, Buendeln oder Verschenken lohnt.

Akzeptanzkriterien:

- Das System empfiehlt eine von folgenden Optionen: einzeln verkaufen, buendeln, verschenken, spenden, recyceln/entsorgen.
- Das System erklaert die Empfehlung.
- Das System schaetzt den Aufwand ein.
- Das System schaetzt das Wiederverkaufspotenzial ein.
- Das System liefert eine Confidence mit.

### Listings erzeugen

Als Nutzer moechte ich sofort nutzbare Marketplace-Listing-Entwuerfe erhalten.

Akzeptanzkriterien:

- Das System erzeugt Titel, Beschreibung, Preisvorschlag, Mindestpreis, Plattformempfehlung und Hinweise zu Abholung/Versand.
- Listings koennen kopiert oder exportiert werden.
- Listing-Texte behaupten keine nicht verifizierten Fakten.
- Der Nutzer kann Listing-Texte neu erzeugen oder bearbeiten.

### Gegenstaende buendeln

Als Nutzer moechte ich zusammengehoerige Gegenstaende mit geringem Einzelwert zu Bundles gruppieren.

Akzeptanzkriterien:

- Das System schlaegt Bundle-Gruppen vor.
- Der Nutzer kann Bundles annehmen, bearbeiten oder ablehnen.
- Es wird ein Bundle-Listing-Entwurf erzeugt.
- Die Bundle-Empfehlung enthaelt eine Begruendung.

## Nicht-funktionale Anforderungen

- Alle KI-Ausgaben muessen per Schema validiert werden.
- Alle fuer Nutzer sichtbaren Empfehlungen muessen nachvollziehbar sein.
- Die App muss auch bei Teilausfaellen nutzbar bleiben.
- Nutzerbilder muessen loeschbar sein.
- Marketplace-Automatisierung muss eine Nutzerpruefung erfordern.

## Nicht im Umfang

- Kommunikation mit Kaeufern.
- Zahlungsabwicklung.
- Erzeugung von Versandlabels.
- Automatische Marketplace-Veroeffentlichung.
- Grossflaechiges Scraping.
