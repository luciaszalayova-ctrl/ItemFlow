# REVIEW-IF-046

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-046-marketplace-action-log`  
Commit: `9aabd93`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-046-marketplace-action-log.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/action-log/route.ts` (neu)
- `apps/api/app/api/projects/[id]/export/route.ts` (erweitert)
- `apps/api/app/projects/[id]/listings/page.tsx` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Wichtige Abweichung vom Ticket (korrekt)

**Ein Log-Eintrag pro Listing statt pro Export-Vorgang:**

Das Ticket verlangte einen Eintrag pro Export. Codex erstellt stattdessen
einen Eintrag **pro Listing** im Export (via `createMany`), weil
`MarketplaceActionLog` eine `listingDraftId`-Beziehung hat — ohne diese
hätte der Eintrag keine FK-Relation zum Listing.

Das ist eine sinnvolle Anpassung an das reale Schema. Alle Einträge eines
Exports haben denselben Zeitstempel, sodass die UI sie als zusammengehörig
erkennen kann.

---

## Auffälligkeit (kein Blocker)

**Mehrfach-Einträge pro Export in der UI-Liste:**

Wenn 5 Listings exportiert werden, erscheinen 5 Einträge in "Letzte
Exporte" — alle mit derselben Uhrzeit und Anzahl `(5 Listings)`. Das ist
korrekt aber optisch redundant. Follow-up: Einträge nach Zeitstempel (Sekunde)
gruppieren oder nur den neuesten pro Export-Vorgang zeigen.

---

## Positives

**`Promise.all` für paralleles Laden:**

Listings und Action-Log werden parallel geladen. Log-Fehler blockieren
das Listing-Laden nicht (graceful degradation). ✓

**`formatAction` für lesbare Labels:**

Klare Trennung zwischen Datenbankwert und Anzeigetext. ✓

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check auf `action-log`-Route ✓
- [x] `logExportActions` in try/catch — Export funktioniert auch bei Log-Fehler ✓
- [x] `listingDraft: { projectId: id }` — Logs anderer Projekte können nicht
      abgefragt werden ✓

---

## Akzeptanzkriterien

- [x] JSON-Export legt `MarketplaceActionLog`-Einträge an ✓
- [x] CSV-Export legt Einträge an ✓
- [x] Log-Fehler blockiert Export nicht ✓
- [x] `GET /api/projects/:id/action-log` gibt letzte 20 Einträge zurück ✓
- [x] Auth + Ownership-Check vorhanden ✓
- [x] Listings-Seite zeigt Exporte mit Zeitstempel und Format ✓
- [x] Leerer Log → Abschnitt nicht angezeigt ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Korrekte Anpassung an das reale Schema.
Gruppierung der Mehrfach-Einträge als optionales Follow-up.
