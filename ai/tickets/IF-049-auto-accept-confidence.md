# IF-049-auto-accept-confidence

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Claude Code** (Logik) + **Codex** (UI/API-Anbindung)  
Status: `backlog`

---

## Zusammenfassung

Kandidaten mit hoher Konfidenz werden beim Import automatisch als
`InventoryItem` angelegt. Nur unsichere Eintraege landen im manuellen
Review-Queue. Nutzer sieht eine Zusammenfassung und kann den Schwellenwert
anpassen.

---

## Kontext

Bei einem Import von 20–40 Gegenstaenden muessen aktuell alle Kandidaten
einzeln akzeptiert werden. Das ist der groesste Zeitfresser im Flow und
widerspricht dem Produktziel „minimaler Aufwand".

Loesungsansatz: Ueber einem konfigurierbaren Schwellenwert laeuft der Kandidat
automatisch durch. Darunter landet er im bekannten Review-Flow.

---

## Anforderungen

### Auto-Accept-Logik

- Beim `POST /api/projects/:id/candidates/import` wird nach dem Speichern
  der Kandidaten fuer jeden Eintrag geprueft, ob `confidence >= threshold`.
- Kandidaten ueber dem Schwellenwert werden sofort als `InventoryItem`
  angelegt und der Candidate-Status auf `accepted` gesetzt.
- Kandidaten darunter bleiben auf `pending` und erscheinen im Review-Queue.
- Der Schwellenwert wird aus `Project.settings.autoAcceptThreshold` gelesen.
  Fehlt das Feld, gilt der Standardwert `0.85`.

### Schwellenwert-Setting

- `Project.settings` ist ein `Json`-Feld im Prisma-Schema (bereits vorhanden).
- Schema-Erweiterung in `packages/shared`: `ProjectSettingsSchema` mit
  `autoAcceptThreshold: z.number().min(0).max(1).default(0.85)`.
- Einstellungsseite oder Inline-Setting auf der Projekt-Uebersicht, um den
  Schwellenwert pro Projekt anzupassen.

### Import-Zusammenfassung

- Nach dem Import zeigt die UI: „X automatisch uebernommen, Y zur Pruefung"
- Link zur Candidates-Review-Seite, wenn Y > 0.
- Link zur Items-Seite, wenn X > 0.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `packages/shared/src/schemas/project.ts` | `ProjectSettingsSchema` mit `autoAcceptThreshold` |
| `apps/api/app/api/projects/[id]/candidates/import/route.ts` | Auto-Accept-Logik nach dem Speichern |
| `apps/api/app/projects/[id]/import/page.tsx` | Zusammenfassungs-UI nach dem Import |
| `apps/api/app/projects/[id]/page.tsx` | Schwellenwert-Setting anzeigen/bearbeiten |

---

## Akzeptanzkriterien

- [ ] Kandidaten mit `confidence >= 0.85` (Standard) werden nach dem Import
      automatisch als `InventoryItem` angelegt.
- [ ] Kandidaten darunter bleiben auf `pending`.
- [ ] Import-Seite zeigt Zusammenfassung: „X automatisch uebernommen, Y zur Pruefung".
- [ ] Schwellenwert ist pro Projekt in den Einstellungen aenderbar (0.0–1.0).
- [ ] `ProjectSettingsSchema` validiert den Wert mit Zod.
- [ ] Unit-Tests fuer die Auto-Accept-Entscheidungslogik vorhanden.
- [ ] `pnpm typecheck` und `pnpm lint` laufen fehlerfrei durch.

---

## Abhaengigkeiten

- Setzt `POST /api/projects/:id/candidates/import` voraus (IF-033, implementiert).
- Ergaenzt IF-050 (Bulk-Aktionen) — unabhaengig, kann parallel laufen.

---

## Risiken

- Falsch-Positives: Gegenstaende mit hoher Konfidenz, die trotzdem falsch
  erkannt wurden. Nutzer kann Schwellenwert senken oder Items nachtraeglich
  bearbeiten. Kein irreversibler Schaden.

---

## Review: REVIEW-IF-049 (nach Implementierung)