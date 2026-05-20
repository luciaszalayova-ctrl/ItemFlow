# IF-032-export-verbessern

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Den Listings-Export für echte Nutzer brauchbar machen: Clipboard-Button und
JSON-Download ergänzen. Außerdem pro Listing einen "Text kopieren"-Button
für direktes Copy-Paste in Kleinanzeigen.

---

## Kontext

**Aktueller Stand** in `apps/api/app/projects/[id]/listings/page.tsx`:

```tsx
{exportResult ? (
  <section style={exportCardStyle}>
    <h2>{exportResult.count} Listings exportiert</h2>
    <pre>{JSON.stringify(exportResult.exported, null, 2)}</pre>
  </section>
) : null}
```

Raw JSON in einem `<pre>` — für echte Nutzer unbrauchbar. Niemand kopiert JSON
manuell in Kleinanzeigen.

---

## Ziel

Nutzer können exportierte Listings direkt verwenden: JSON herunterladen oder
einzelne Listing-Texte per Klick kopieren.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/listings/page.tsx    ERWEITERN
```

---

## Implementierungsdetails

### Neuer State

```typescript
const [copiedId, setCopiedId] = useState<string | null>(null)
```

Kurze visuelle Bestätigung ("Kopiert ✓") pro Listing nach Clipboard-Copy.

---

### 1. Export-Ergebnis-Block ersetzen

Den aktuellen `exportResult`-Block durch eine strukturierte Darstellung ersetzen:

```tsx
{exportResult ? (
  <section style={exportCardStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
      <h2 style={{ margin: 0 }}>{exportResult.count} Listings exportiert</h2>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleCopyAll} style={secondaryButtonStyle}>
          Alle kopieren
        </button>
        <button type="button" onClick={handleDownload} style={secondaryButtonStyle}>
          Als JSON herunterladen
        </button>
      </div>
    </div>
  </section>
) : null}
```

Das `<pre>` entfernen — die Rohdaten werden nicht mehr angezeigt.

---

### 2. Hilfsfunktionen

**`handleCopyAll`** — Alle exportierten Listings als JSON in die Zwischenablage:
```typescript
async function handleCopyAll() {
  await navigator.clipboard.writeText(JSON.stringify(exportResult?.exported, null, 2))
}
```

**`handleDownload`** — JSON-Datei herunterladen:
```typescript
function handleDownload() {
  if (!exportResult) return
  const json = JSON.stringify(exportResult.exported, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `listings-export.json`
  a.click()
  URL.revokeObjectURL(url)
}
```

**`handleCopyListing`** — Einzelnes Listing als formatierten Text kopieren:
```typescript
async function handleCopyListing(listing: ExportedListing) {
  const text = [
    listing.title,
    '',
    listing.description,
    '',
    `Preis: ${(listing.priceCents / 100).toFixed(2)} €`,
  ].join('\n')
  await navigator.clipboard.writeText(text)
  setCopiedId(listing.id)
  setTimeout(() => setCopiedId((current) => (current === listing.id ? null : current)), 2000)
}
```

---

### 3. "Text kopieren"-Button pro exportiertem Listing

In der Listing-Card für `exported`-Listings ergänzen:

```tsx
{listing.status === 'exported' && exportResult ? (
  <button
    type="button"
    onClick={() => {
      const exported = exportResult.exported.find((e) => e.id === listing.id)
      if (exported) void handleCopyListing(exported)
    }}
    style={{
      ...buttonStyle,
      background: copiedId === listing.id ? '#1f6f5f' : '#efe6d6',
      color: copiedId === listing.id ? '#ffffff' : '#4e463b',
      border: 0,
      cursor: 'pointer',
    }}
  >
    {copiedId === listing.id ? 'Kopiert ✓' : 'Text kopieren'}
  </button>
) : null}
```

Der Button erscheint also erst nach dem Export — vorher gibt es nichts zu kopieren.

---

### 4. `secondaryButtonStyle` hinzufügen

```typescript
const secondaryButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.7rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#4e463b',
  border: 0,
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties
```

---

## Akzeptanzkriterien

- [ ] Export-Block zeigt keine rohen JSON-Daten mehr
- [ ] "Alle kopieren" — JSON aller exportierten Listings in Zwischenablage
- [ ] "Als JSON herunterladen" — löst `.json`-Datei-Download aus
- [ ] "Text kopieren" pro `exported`-Listing — formatierter Titel + Beschreibung + Preis
- [ ] Visuelles Feedback "Kopiert ✓" für 2 Sekunden nach Copy
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `navigator.clipboard` ist in modernen Browsern verfügbar (kein Fallback nötig für MVP)
- `URL.createObjectURL` + `revokeObjectURL` — kein Memory Leak
- Dateiname: `listings-export.json` (statisch, kein Datum nötig für MVP)
- `copiedId`-State: nur für Copy-Feedback, kein Persist

---

## Abhängigkeiten

- IF-023 (Listings UI) — merged ✓
- IF-015 (Listings Export API) — merged ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- CSV-Export
- Plattform-spezifische Formatierung (Kleinanzeigen vs. eBay)
- Datum im Dateinamen
- Einzelne Listings gezielt exportieren (nur Gesamt-Export)

---

## Referenzen

Review: REVIEW-IF-032 (nach Implementierung)
