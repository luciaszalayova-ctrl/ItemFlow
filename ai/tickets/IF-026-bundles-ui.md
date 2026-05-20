# IF-026-bundles-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Bundle-UI implementieren — `/projects/[id]/bundles` zeigt alle Bundles, erlaubt das
manuelle Erstellen von Bundles aus vorhandenen Items, Akzeptieren/Ablehnen von
Vorschlägen und Listing-Generierung für freigegebene Bundles.

Zusätzlich: Edit-Link auf der bestehenden Listings-Seite (`IF-023`) ergänzen.

---

## Kontext

- `GET /api/projects/[id]/items` — Items laden für Bundle-Erstell-Formular (IF-010)
- `GET /api/projects/[id]/bundles` — alle Bundles laden (IF-025)
- `POST /api/projects/[id]/bundles` — Bundle erstellen (IF-025)
- `PATCH /api/projects/[id]/bundles/[bid]` — accept/reject (IF-025)
- `POST /api/projects/[id]/bundles/[bid]/listing` — Listing generieren (IF-025)
- `GET /api/projects/[id]/listings/[lid]` — für Edit-Link: bereits vorhanden (IF-013)

---

## Ziel

Der Nutzer kann Items mit niedrigem Einzelwert manuell zu Paketen bündeln, diese
prüfen und ein Listing-Entwurf generieren lassen.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/bundles/page.tsx              NEU — Client Component
apps/api/app/projects/[id]/listings/page.tsx             ERWEITERN — Edit-Link hinzufügen
```

---

## Implementierungsdetails

### 1. `apps/api/app/projects/[id]/bundles/page.tsx` — NEU

**Typen (lokal definieren):**
```typescript
type Item = {
  id: string
  title: string
  category: string
  condition: string | null
  status: string
}

type Bundle = {
  id: string
  title: string
  itemIds: string[]
  rationale: string | null
  status: string
}
```

**State:**
```typescript
const [items, setItems] = useState<Item[]>([])
const [bundles, setBundles] = useState<Bundle[]>([])
const [loading, setLoading] = useState(true)
const [processing, setProcessing] = useState<string | null>(null)
const [creating, setCreating] = useState(false)
const [error, setError] = useState<string | null>(null)
// Formular-State für neues Bundle:
const [newTitle, setNewTitle] = useState('')
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
const [showCreateForm, setShowCreateForm] = useState(false)
```

**Laden** — beide Requests parallel mit `ignore`-Flag:
```typescript
useEffect(() => {
  let ignore = false
  async function loadAll() {
    setLoading(true)
    setError(null)
    const [itemsRes, bundlesRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/items`),
      fetch(`/api/projects/${projectId}/bundles`),
    ])
    if (!itemsRes.ok || !bundlesRes.ok) {
      if (!ignore) { setError('Daten konnten nicht geladen werden.'); setLoading(false) }
      return
    }
    const [itemsData, bundlesData] = await Promise.all([itemsRes.json(), bundlesRes.json()])
    if (!ignore) {
      setItems((itemsData as { items?: Item[] }).items ?? [])
      setBundles((bundlesData as { bundles?: Bundle[] }).bundles ?? [])
      setLoading(false)
    }
  }
  void loadAll()
  return () => { ignore = true }
}, [projectId])
```

**Bundle erstellen (`handleCreate`):**
```typescript
async function handleCreate(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (selectedIds.size < 2) {
    setError('Mindestens 2 Items auswählen.')
    return
  }
  setCreating(true)
  setError(null)

  const res = await fetch(`/api/projects/${projectId}/bundles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle, itemIds: Array.from(selectedIds) }),
  })

  if (!res.ok) {
    setError(await readError(res, 'Bundle konnte nicht erstellt werden.'))
    setCreating(false)
    return
  }

  const data = (await res.json()) as { bundle: Bundle }
  setBundles((current) => [data.bundle, ...current])
  setNewTitle('')
  setSelectedIds(new Set())
  setShowCreateForm(false)
  setCreating(false)
}
```

**Checkbox-Toggle für Item-Auswahl:**
```typescript
function toggleItem(itemId: string) {
  setSelectedIds((current) => {
    const next = new Set(current)
    if (next.has(itemId)) next.delete(itemId)
    else next.add(itemId)
    return next
  })
}
```

**Bundle-Action (`handleAction` — accept/reject):**
```typescript
async function handleAction(bundleId: string, status: 'accepted' | 'rejected') {
  setProcessing(bundleId)
  setError(null)
  const res = await fetch(`/api/projects/${projectId}/bundles/${bundleId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    setError(await readError(res, 'Bundle konnte nicht aktualisiert werden.'))
    setProcessing(null)
    return
  }
  const data = (await res.json()) as { bundle: Bundle }
  setBundles((current) => current.map((b) => b.id === bundleId ? data.bundle : b))
  setProcessing(null)
}
```

**Listing generieren (`handleGenerateListing`):**
```typescript
async function handleGenerateListing(bundleId: string) {
  setProcessing(bundleId)
  setError(null)
  const res = await fetch(`/api/projects/${projectId}/bundles/${bundleId}/listing`, {
    method: 'POST',
  })
  if (!res.ok) {
    setError(await readError(res, 'Listing konnte nicht generiert werden.'))
    setProcessing(null)
    return
  }
  setBundles((current) =>
    current.map((b) => b.id === bundleId ? { ...b, status: 'listing_created' } : b)
  )
  setProcessing(null)
}
```

**Layout:**

Header mit "Bundle erstellen"-Toggle-Button (öffnet/schließt Formular).

Formular (sichtbar wenn `showCreateForm`):
- Titel: `<input type="text">` (required, max 120 Zeichen)
- Item-Auswahl: Liste aller Items als Checkboxen — zeigt `item.title` und `item.category`
  - Items mit status `listing_created` oder `handled` deaktiviert anzeigen (cannot bundle)
- "Bundle erstellen"-Button (disabled während `creating`, disabled wenn `selectedIds.size < 2`)
- "Abbrechen"-Link

Bundle-Liste — pro Bundle eine Card:
- Titel + Status-Badge
- Liste der gebündelten Item-Titel (Items aus `items`-Array per ID nachschlagen)
- Rationale wenn vorhanden
- Buttons je nach Status:
  - `suggested`: "Akzeptieren" (grün) + "Ablehnen" (rot/outline), beide disabled wenn `processing === bundle.id`
  - `accepted`: "Listing erstellen" (blau #245c9a)
  - `listing_created`: Link "Listing ansehen →" zu `/projects/[id]/listings`
  - `rejected`: Hinweis "Abgelehnt" (kein Button)

Leere Liste (keine Bundles): Hinweistext + Aufforderung, Bundle zu erstellen.

**`readError()`** — gleiche Hilfsfunktion wie IF-022/023/024.

**Styling** — konsistent mit IF-021/022/023/024.

---

### 2. `apps/api/app/projects/[id]/listings/page.tsx` — ERWEITERN

In jeder Listing-Card (`draft` und `reviewed`) einen Edit-Link ergänzen:

```tsx
<Link
  href={`/projects/${projectId}/listings/${listing.id}/edit`}
  style={textLinkStyle}
>
  Bearbeiten →
</Link>
```

Position: unterhalb des Freigeben-Buttons (bei `draft`) bzw. unterhalb des
"✓ Freigegeben"-Textes (bei `reviewed`). Nicht bei `exported`.

`textLinkStyle` ist bereits in der Datei definiert.

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/bundles` lädt Items und Bundles parallel
- [ ] "Bundle erstellen"-Formular öffnet sich per Toggle
- [ ] Mindestens 2 Items auswählen — sonst Fehlermeldung
- [ ] Items mit status `listing_created`/`handled` im Formular als deaktiviert markiert
- [ ] Erstellen → Bundle erscheint sofort in der Liste
- [ ] Akzeptieren/Ablehnen für `suggested` Bundles
- [ ] "Listing erstellen"-Button für `accepted` Bundles
- [ ] Status-Updates lokal nach API-Erfolg
- [ ] Edit-Link in `listings/page.tsx` für `draft` und `reviewed` Listings
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Client Component — `'use client'`
- `ignore`-Flag in `useEffect`
- `Promise.all` für paralleles Laden
- `readError()` als extrahierte Hilfsfunktion

---

## Abhängigkeiten

- IF-025 (Bundle API) — muss gemergt sein
- IF-023 (Listings UI) — wird erweitert (Edit-Link)
- IF-024 (Listing Edit UI) — Edit-Link zeigt dorthin

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Bundle-Inhalte nachträglich bearbeiten (Items hinzufügen/entfernen)
- KI-generierte Bundle-Vorschläge (Scoring-Engine)
- Bundle löschen

---

## Referenzen

Review: REVIEW-IF-026 (nach Implementierung)
