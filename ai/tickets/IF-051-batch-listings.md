# IF-051-batch-listings

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Claude Code** (API) + **Codex** (UI)  
Status: `backlog`

---

## Zusammenfassung

Ein einzelner Button generiert Listing-Entwuerfe fuer alle verkaufbaren
Items eines Projekts. Anschliessend koennen alle Entwuerfe in einer
Batch-Review-Ansicht gesichtet, inline bearbeitet und gemeinsam freigegeben
werden.

---

## Kontext

Aktuell muss das Listing pro Item einzeln ausgeloest werden. Bei 15–20
Items bedeutet das 15–20 Klicks nur fuer die Generierung. Danach muessen
die Listings ebenfalls einzeln geoeffnet werden. Das ist nicht akzeptabel
fuer das Produktziel „minimaler Aufwand".

---

## Anforderungen

### Batch-Generierung

- Neuer Endpunkt `POST /api/projects/:id/listings/generate-all`.
- Verarbeitet alle `InventoryItem`-Eintraege des Projekts mit Status
  `scored` oder `ready_for_scoring`, die noch kein `ListingDraft` haben.
- Generiert fuer jedes Item ein `ListingDraft` mit dem bestehenden
  `ListingGenerator`.
- Gibt zurueck: `{ created: number, skipped: number }`.
- Fehler bei einzelnen Items blockieren nicht die anderen (best-effort,
  Fehler werden geloggt).

### Batch-Review-Ansicht

- Neue Seite oder Section auf `/projects/[id]/listings`.
- Alle Listing-Entwuerfe des Projekts untereinander — scrollbare Liste.
- Jeder Eintrag zeigt: Titel, Beschreibung (gekuerzt), Preis, Status-Badge.
- Inline-Bearbeitung: Klick auf Titel oder Beschreibung oeffnet ein
  Textfeld direkt in der Karte (kein Seitenwechsel).
- Checkbox pro Listing fuer Sammel-Freigabe.

### Sammel-Freigabe

- Aktionsleiste (erscheint bei Auswahl): „X Listings freigeben"
- Setzt Status aller ausgewaehlten Listings auf `reviewed`.
- Danach direkt „Alle freigegebenen exportieren"-Button sichtbar.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `apps/api/app/api/projects/[id]/listings/route.ts` | oder neue `generate-all/route.ts` |
| `apps/api/app/projects/[id]/listings/page.tsx` | Batch-Review-Ansicht mit Inline-Edit und Checkboxen |
| `apps/api/app/api/projects/[id]/listings/[lid]/route.ts` | PATCH fuer Inline-Edit (bereits vorhanden, pruefen) |

---

## Akzeptanzkriterien

- [ ] Button „Listings fuer alle Items generieren" auf der Items- oder
      Listings-Seite sichtbar.
- [ ] Klick generiert Entwuerfe fuer alle noch nicht verarbeiteten Items.
- [ ] Zusammenfassung „X neue Listings erstellt" nach der Generierung.
- [ ] Listings-Seite zeigt alle Entwuerfe untereinander (Batch-Ansicht).
- [ ] Inline-Bearbeitung von Titel, Beschreibung und Preis ohne Seitenwechsel.
- [ ] Checkboxen und Sammel-Freigabe funktionieren korrekt.
- [ ] Fehler bei einzelnen Items (z. B. fehlende Scoring-Daten) blockieren
      andere Items nicht.
- [ ] `pnpm typecheck` und `pnpm lint` laufen fehlerfrei durch.

---

## Abhaengigkeiten

- Setzt funktionierende Listing-Generierung voraus (IF-012, implementiert).
- Setzt `ListingGenerator` in `packages/listings` voraus (implementiert).

---

## Risiken

- Bei vielen Items (20+) kann die Batch-Generierung langsam sein. Fuer das
  MVP akzeptabel — spaeter als Background-Job mit Progress-Anzeige.

---

## Review: REVIEW-IF-051 (nach Implementierung)