# IF-043-csv-export

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

CSV-Export aller Listings eines Projekts — praktisch zum Einfügen in
Tabellenkalkulationen oder zum manuellen Hochladen auf Marktplätzen.

---

## Kontext

IF-042 ergänzt den JSON-Export. CSV ist eine separate Route und ein
separater Download-Button, da das Format für unterschiedliche Nutzung
gedacht ist (JSON = strukturiert/API, CSV = Tabelle/manuell).

Der Endpunkt liegt auf derselben Route wie JSON, nur mit `?format=csv`.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/export/route.ts    ERWEITERN (IF-042 als Basis)
apps/api/app/projects/[id]/listings/page.tsx      ERWEITERN
```

---

## Implementierungsdetails

### CSV-Generierung (kein externes Package nötig)

```typescript
function toCsv(listings: ExportListing[]): string {
  const header = [
    'id', 'titel', 'beschreibung', 'preis_euro', 'mindestpreis_euro',
    'kategorie', 'versandmodus', 'nur_abholung', 'status', 'typ',
  ]

  const rows = listings.map((l) => [
    l.id,
    escapeCsvField(l.title),
    escapeCsvField(l.description),
    l.priceCents != null ? (l.priceCents / 100).toFixed(2) : '',
    l.minimumPriceCents != null ? (l.minimumPriceCents / 100).toFixed(2) : '',
    escapeCsvField(l.category ?? ''),
    escapeCsvField(l.shippingMode ?? ''),
    l.pickupOnly ? 'ja' : 'nein',
    l.status,
    l.targetType,
  ])

  return [header, ...rows].map((row) => row.join(',')).join('\r\n')
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
```

### Route-Erweiterung

```typescript
const format = new URL(request.url).searchParams.get('format') ?? 'json'

if (format === 'csv') {
  const csv = toCsv(listings)
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="itemflow-export-${id}.csv"`,
    },
  })
}
// ... JSON-Pfad wie in IF-042
```

### Download-Button in der UI

```tsx
<a
  href={`/api/projects/${projectId}/export?format=csv`}
  download
  style={exportLinkStyle}
>
  Als CSV exportieren
</a>
```

---

## Akzeptanzkriterien

- [ ] `GET /api/projects/:id/export?format=csv` gibt UTF-8-CSV zurück
- [ ] Trennzeichen: Komma; Zeilenende: `\r\n`; Felder mit Sonderzeichen korrekt escaped
- [ ] Spalten: id, titel, beschreibung, preis_euro, mindestpreis_euro, kategorie, versandmodus, nur_abholung, status, typ
- [ ] Preise als Dezimalzahl in Euro (z. B. `12.50`)
- [ ] Archivierte Listings ausgeschlossen
- [ ] Auth + Ownership-Check vorhanden
- [ ] CSV-Button erscheint auf der Listings-Seite neben JSON-Button
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-042 (JSON-Export) — sollte zuerst gemergt sein, da dieselbe Route erweitert wird

---

## Referenzen

Review: REVIEW-IF-043 (nach Implementierung)
