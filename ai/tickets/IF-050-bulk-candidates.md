# IF-050-bulk-candidates

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `backlog`

---

## Zusammenfassung

Checkboxen in der Candidates-Liste ermoeglichen das gleichzeitige
Akzeptieren oder Ablehnen mehrerer Kandidaten mit einem Klick.

---

## Kontext

Auch wenn IF-049 (Auto-Accept) die meisten Faelle abdeckt, wird es immer
Situationen geben, in denen Nutzer mehrere unsichere Kandidaten auf einmal
verarbeiten wollen. Das einzelne Durchklicken ist zeitaufwendig.

---

## Anforderungen

### UI-Aenderungen (`app/projects/[id]/candidates/page.tsx`)

- Jede Kandidaten-Karte erhaelt eine Checkbox oben links.
- Zusaetzliche Aktionsleiste erscheint, sobald mindestens eine Checkbox
  markiert ist:
  - Anzahl der Auswahl: „3 ausgewaehlt"
  - Button „Auswahl akzeptieren"
  - Button „Auswahl ablehnen"
  - Button „Auswahl aufheben"
- Oberhalb der Liste: „Alle auswaehlen / Auswahl aufheben"-Toggle.

### API-Erweiterung

- Neuer Endpunkt `PATCH /api/projects/:id/candidates/bulk` mit Body:
  ```json
  { "ids": ["cid1", "cid2"], "action": "accept" | "reject" }
  ```
- Validierung: `ids` nicht leer, max. 50 Eintraege, alle muessen zum Projekt
  gehoeren.
- Verarbeitung in einer DB-Transaktion.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `apps/api/app/projects/[id]/candidates/page.tsx` | Checkboxen, Aktionsleiste, „Alle auswaehlen" |
| `apps/api/app/api/projects/[id]/candidates/route.ts` | oder neue `bulk/route.ts` — Bulk-PATCH |

---

## Akzeptanzkriterien

- [ ] Checkboxen sind in der Candidates-Liste sichtbar.
- [ ] Aktionsleiste erscheint bei Auswahl, verschwindet bei leerer Auswahl.
- [ ] „Alle auswaehlen" waehlt alle aktuell sichtbaren pending-Kandidaten.
- [ ] Bulk-Accept und Bulk-Reject funktionieren korrekt.
- [ ] Verarbeitete Kandidaten verschwinden aus der Liste (wie bei Einzelaktionen).
- [ ] Bulk-Endpunkt validiert Eigentuemer-Pruefung (Kandidaten muessen zum
      eigenen Projekt gehoeren).
- [ ] `pnpm typecheck` und `pnpm lint` laufen fehlerfrei durch.

---

## Abhaengigkeiten

- Ergaenzt IF-049 (Auto-Accept) — unabhaengig, kann parallel implementiert werden.

---

## Review: REVIEW-IF-050 (nach Implementierung)