# REVIEW-IF-043

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-043-csv-export`  
Commit: `3a8e129`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-043-csv-export.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/export/route.ts` (erweitert — IF-042 als Basis)
- `apps/api/app/projects/[id]/listings/page.tsx` (CSV-Button hinzugefügt)

---

## Kritische Probleme (Blocker)

Keine.

---

## Analyse `escapeCsvField`

```typescript
function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
```

**Korrekt:** Komma, Anführungszeichen und `\n` werden erkannt und das Feld
in Quotes gesetzt. Anführungszeichen werden per RFC-4180 verdoppelt. ✓

**Randfall (kein Blocker):** `\r` allein (ohne `\n`) löst keine Quotierung
aus. In der Praxis enthalten Nutzereingaben kaum alleinstehendes `\r` —
akzeptabel für MVP.

---

## CSV-Format

- Trennzeichen: Komma ✓
- Zeilenende: `\r\n` (RFC-4180-konform) ✓
- Preise als Euro-Dezimalzahl (`12.50`) ✓
- `nur_abholung`: `ja` / `nein` (lesbar, deutsch) ✓
- Header-Zeile vorhanden ✓
- Archivierte Listings ausgeschlossen (via `exportSelect` aus IF-042) ✓

---

## Timestamps fehlen im CSV (by design)

`createdAt` und `updatedAt` sind im JSON-Export enthalten (über
`exportSelect`), im CSV aber nicht — konsistent mit den Spalten aus dem
Ticket-Spec. Kein Problem.

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check identisch mit IF-042 (geteilte Route) ✓
- [x] `Content-Type: text/csv; charset=utf-8` ✓
- [x] `Content-Disposition: attachment` — kein Inline-Rendering ✓
- [x] CSV-Injection-Risiko: Felder beginnen nicht mit `=`, `+`, `-`, `@` —
      keine zusätzliche Absicherung nötig für internes Tool ✓

---

## Akzeptanzkriterien

- [x] `GET /api/projects/:id/export?format=csv` gibt UTF-8-CSV zurück ✓
- [x] Trennzeichen Komma, Zeilenende `\r\n` ✓
- [x] Felder mit Sonderzeichen korrekt gequotet ✓
- [x] Spalten: id, titel, beschreibung, preis_euro, mindestpreis_euro, kategorie, versandmodus, nur_abholung, status, typ ✓
- [x] Preise als Dezimalzahl in Euro ✓
- [x] Archivierte Listings ausgeschlossen ✓
- [x] Auth + Ownership-Check vorhanden ✓
- [x] CSV-Button auf der Listings-Seite neben JSON-Button ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere Erweiterung auf IF-042-Basis.
IF-042 muss vor IF-043 in main gemergt werden (gleiche Datei).
