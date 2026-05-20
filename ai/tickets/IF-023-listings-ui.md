# IF-023-listings-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listings-UI implementieren — `/projects/[id]/listings` zeigt alle Listing-Entwürfe,
ermöglicht einzelnes Freigeben (`POST .../approve`) und exportiert alle freigegebenen
Listings auf einmal (`POST .../export`).

---

## Kontext

- `GET /api/projects/[id]/listings` — listet alle Drafts (IF-013)
- `POST /api/projects/[id]/listings/[lid]/approve` — setzt Draft auf `reviewed` (IF-014)
- `POST /api/projects/[id]/listings/export` — exportiert alle `reviewed` Listings, gibt JSON zurück (IF-015)
- Client Component für Interaktivität

---

## Ziel

Nach diesem Ticket kann ein Nutzer Listing-Entwürfe prüfen, freigeben und als JSON
exportieren — der letzte Schritt vor dem manuellen Kleinanzeigen-Upload.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/listings/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/listings/page.tsx` — Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type ListingDraft = {
  id: string
  title: string
  description: string
  priceCents: number
  platform: string
  status: string
}

type ExportResult = {
  exported: ListingDraft[]
  count: number
}

export default function ListingsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [listings, setListings] = useState<ListingDraft[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/listings`)
      .then(r => r.json())
      .then(data => {
        setListings(data.listings ?? [])
        setLoading(false)
      })
  }, [projectId])

  async function handleApprove(lid: string) {
    setProcessing(lid)
    const res = await fetch(`/api/projects/${projectId}/listings/${lid}/approve`, { method: 'POST' })
    if (res.ok) {
      setListings(prev => prev.map(l => l.id === lid ? { ...l, status: 'reviewed' } : l))
    }
    setProcessing(null)
  }

  async function handleExport() {
    setExporting(true)
    const res = await fetch(`/api/projects/${projectId}/listings/export`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as ExportResult
      setExportResult(data)
      setListings(prev => prev.map(l => l.status === 'reviewed' ? { ...l, status: 'exported' } : l))
    }
    setExporting(false)
  }

  const reviewedCount = listings.filter(l => l.status === 'reviewed').length

  return (
    <main>
      <Link href={`/projects/${projectId}`}>← Zurück zum Projekt</Link>
      <h1>Listings</h1>

      {loading && <p>Lädt…</p>}
      {!loading && listings.length === 0 && (
        <p>Noch keine Listings. Zuerst Items bewerten und Listings generieren.</p>
      )}

      {reviewedCount > 0 && (
        <button onClick={handleExport} disabled={exporting}>
          {exporting ? 'Wird exportiert…' : `${reviewedCount} freigegebene Listings exportieren`}
        </button>
      )}

      {exportResult && (
        <section>
          <h2>{exportResult.count} Listings exportiert</h2>
          <pre>{JSON.stringify(exportResult.exported, null, 2)}</pre>
        </section>
      )}

      <ul>
        {listings.map(listing => (
          <li key={listing.id}>
            <strong>{listing.title}</strong>
            <span> — {(listing.priceCents / 100).toFixed(2)} €</span>
            <span> [{listing.status}]</span>

            {listing.status === 'draft' && (
              <button onClick={() => handleApprove(listing.id)} disabled={processing === listing.id}>
                Freigeben
              </button>
            )}

            {listing.status === 'reviewed' && (
              <span> ✓ Freigegeben</span>
            )}

            {listing.status === 'exported' && (
              <span> ✓ Exportiert</span>
            )}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/listings` listet alle Listing-Drafts
- [ ] "Freigeben"-Button für `draft` Listings → ruft `POST .../approve` auf, Status wechselt zu `reviewed`
- [ ] "Exportieren"-Button erscheint wenn mind. 1 `reviewed` Listing vorhanden
- [ ] Nach Export: JSON-Payload der exportierten Listings angezeigt, Status wechselt zu `exported`
- [ ] Buttons während Verarbeitung deaktiviert
- [ ] Leere Liste zeigt Hinweistext
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Client Component — `'use client'`
- Optimistic UI: Status lokal aktualisieren nach API-Call
- Export-Button nur sichtbar wenn mind. 1 `reviewed` Listing vorhanden
- Export-Ergebnis als `<pre>` anzeigen — kein poliertes Format nötig für MVP

---

## Abhängigkeiten

- IF-013 (Listings CRUD API) — merged ✓
- IF-014 (Listing Approve API) — merged ✓
- IF-015 (Listings Export API) — merged ✓
- IF-022 (Items UI) — Listings entstehen durch Listing-Generierung

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Listing-Inhalt bearbeiten (Titel, Preis — über PATCH-Route möglich, eigene Seite)
- CSV-Export
- Clipboard-Button für einzelne Listings
- Einzelne Listings gezielt exportieren

---

## Referenzen

Review: REVIEW-IF-023 (nach Implementierung)
