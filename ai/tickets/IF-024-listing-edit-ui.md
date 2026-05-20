# IF-024-listing-edit-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listing-Bearbeitungsseite implementieren — `/projects/[id]/listings/[lid]/edit` erlaubt
es, einen Listing-Entwurf (Titel, Beschreibung, Preis, Abholung) zu bearbeiten, bevor
er freigegeben wird.

---

## Kontext

- `GET /api/projects/[id]/listings/[lid]` — lädt das Listing (IF-013)
- `PATCH /api/projects/[id]/listings/[lid]` — speichert Änderungen (IF-013)
- `UpdateListingDraftSchema` aus `@itemflow/shared` — validierbare Felder:
  `title`, `description`, `priceCents`, `minimumPriceCents`, `category`,
  `shippingMode`, `pickupOnly`
- Nur `draft` und `reviewed` Listings können bearbeitet werden (API liefert 409 sonst)

---

## Ziel

Der Nutzer kann KI-generierte Listings korrigieren, bevor er sie freigibt — zentraler
Human-in-the-Loop-Schritt.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/listings/[lid]/edit/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/listings/[lid]/edit/page.tsx`

**Routing-Parameter:** `id` (projectId), `lid` (listingId) — beide via
`useParams<{ id: string; lid: string }>()`.

**State:**
```typescript
const [listing, setListing] = useState<ListingDraft | null>(null)
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)
const [saved, setSaved] = useState(false)
```

**Typen (lokal definieren, keine Imports aus packages nötig):**
```typescript
type ListingDraft = {
  id: string
  title: string
  description: string
  priceCents: number
  minimumPriceCents: number | null
  category: string | null
  shippingMode: string | null
  pickupOnly: boolean
  status: string
}
```

**Laden:** `useEffect` mit `ignore`-Flag (gleiche Technik wie IF-021/022):
```typescript
useEffect(() => {
  let ignore = false
  async function load() {
    const res = await fetch(`/api/projects/${projectId}/listings/${lid}`)
    if (!res.ok) {
      if (!ignore) { setError('Listing konnte nicht geladen werden.'); setLoading(false) }
      return
    }
    const data = (await res.json()) as { listing: ListingDraft }
    if (!ignore) { setListing(data.listing); setLoading(false) }
  }
  void load()
  return () => { ignore = true }
}, [projectId, lid])
```

**Formular:** controlled inputs für alle Felder. `priceCents` wird als Euro-Wert
angezeigt und eingegeben (`priceCents = Math.round(euroValue * 100)`).

**Speichern:**
```typescript
async function handleSubmit(e: FormEvent<HTMLFormElement>) {
  e.preventDefault()
  setSaving(true)
  setError(null)
  setSaved(false)

  const res = await fetch(`/api/projects/${projectId}/listings/${lid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: listing.title,
      description: listing.description,
      priceCents: listing.priceCents,
      minimumPriceCents: listing.minimumPriceCents,
      category: listing.category || null,
      shippingMode: listing.shippingMode || null,
      pickupOnly: listing.pickupOnly,
    }),
  })

  if (!res.ok) {
    setError(await readError(res, 'Listing konnte nicht gespeichert werden.'))
    setSaving(false)
    return
  }

  setSaved(true)
  setSaving(false)
}
```

**`readError()`** — gleiche Hilfsfunktion wie IF-022:
```typescript
async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string }
    return typeof data.error === 'string' ? data.error : fallback
  } catch { return fallback }
}
```

**Felder im Formular:**
- Titel: `<input type="text">` (max 80 Zeichen)
- Beschreibung: `<textarea>` (max 2000 Zeichen, mind. 6 Zeilen)
- Preis: `<input type="number" step="0.01" min="0">` — Label: "Preis (€)"
- Mindestpreis (optional): gleiche Art, leer = null
- Kategorie: `<input type="text">` (optional)
- Versandmodus: `<input type="text">` (optional)
- Nur Abholung: `<input type="checkbox">`

**Nach erfolgreichem Speichern:** Hinweistext "Gespeichert ✓" einblenden (kein
automatisches Weiterleiten — Nutzer soll weiter bearbeiten können). Zusätzlich Link
"← Zurück zu den Listings" (`/projects/[id]/listings`).

**Visuelles Styling:** konsistent mit IF-021/022/023 — gleiche Farben, `cardStyle`,
`backLinkStyle`, `primaryLinkStyle`-Muster.

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/listings/[lid]/edit` lädt das Listing und zeigt alle Felder befüllt
- [ ] Formular speichert via PATCH, Fehlermeldung bei Fehler
- [ ] Erfolgshinweis nach Speichern sichtbar
- [ ] `priceCents` wird als Euro-Wert dargestellt und korrekt konvertiert (×100 beim Speichern)
- [ ] `minimumPriceCents` ist optional — leer lassen sendet `null`
- [ ] Alle Buttons während Verarbeitung deaktiviert
- [ ] Link zurück zur Listings-Seite immer sichtbar
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Client Component — `'use client'`
- `ignore`-Flag in `useEffect` (unmount safety)
- Kein automatisches Weiterleiten nach Speichern
- `readError()` als Hilfsfunktion extrahieren

---

## Abhängigkeiten

- IF-013 (Listings CRUD API — GET + PATCH) — merged ✓
- IF-023 (Listings UI) — "Listing ansehen" Link dort soll auf Edit-Seite verweisen

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Foto-Upload oder Foto-Auswahl
- Plattform-Auswahl
- Listing löschen
- Status-Änderung (Freigabe bleibt auf der Listings-Seite)

---

## Referenzen

Review: REVIEW-IF-024 (nach Implementierung)
