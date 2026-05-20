# IF-028-item-edit-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Item-Bearbeitungsseite implementieren — `/projects/[id]/items/[iid]/edit` erlaubt es,
ein Inventar-Item zu bearbeiten, bevor es bewertet wird. Muster identisch mit IF-024
(Listing-Edit-UI).

---

## Kontext

- `GET /api/projects/[id]/items/[iid]` — lädt das Item (IF-010)
- `PATCH /api/projects/[id]/items/[iid]` — speichert Änderungen (IF-010)
- `UpdateInventoryItemSchema` aus `@itemflow/shared`:
  `title`, `category`, `brand`, `model`, `condition`, `quantity`,
  `description`, `defects`, `completeness` — alle optional
- Nur `draft` und `ready_for_scoring` Items können bearbeitet werden (API 409 sonst)

---

## Ziel

Der Nutzer kann KI-erkannte Item-Daten korrigieren — Marke, Zustand, Beschreibung —
bevor das Scoring-Ergebnis davon abhängt.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/items/[iid]/edit/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/items/[iid]/edit/page.tsx`

**Routing-Parameter:** `id` (projectId), `iid` (itemId) via
`useParams<{ id: string; iid: string }>()`.

**Typen (lokal definieren):**
```typescript
type InventoryItem = {
  id: string
  title: string
  category: string
  brand: string | null
  model: string | null
  condition: string | null
  quantity: number
  description: string | null
  defects: string | null
  completeness: string | null
  status: string
}
```

**State:**
```typescript
const [item, setItem] = useState<InventoryItem | null>(null)
const [loading, setLoading] = useState(true)
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)
const [saved, setSaved] = useState(false)
```

**Laden** mit `ignore`-Flag (gleich wie IF-024):
```typescript
useEffect(() => {
  let ignore = false
  async function load() {
    const res = await fetch(`/api/projects/${projectId}/items/${iid}`)
    if (!res.ok) {
      if (!ignore) { setError('Item konnte nicht geladen werden.'); setLoading(false) }
      return
    }
    const data = (await res.json()) as { item: InventoryItem }
    if (!ignore) { setItem(data.item); setLoading(false) }
  }
  void load()
  return () => { ignore = true }
}, [projectId, iid])
```

**Generischer Updater** (Muster aus IF-024):
```typescript
function updateField<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
  setItem((current) => (current ? { ...current, [key]: value } : current))
  setSaved(false)
}
```

**Speichern:**
```typescript
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()
  if (!item) return
  setSaving(true); setError(null); setSaved(false)

  const res = await fetch(`/api/projects/${projectId}/items/${iid}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: item.title,
      category: item.category,
      brand: item.brand || null,
      model: item.model || null,
      condition: item.condition || null,
      quantity: item.quantity,
      description: item.description || null,
      defects: item.defects || null,
      completeness: item.completeness || null,
    }),
  })

  if (!res.ok) {
    setError(await readError(res, 'Item konnte nicht gespeichert werden.'))
    setSaving(false)
    return
  }

  const data = (await res.json()) as { item: InventoryItem }
  setItem(data.item)
  setSaved(true)
  setSaving(false)
}
```

**Felder im Formular:**
- Titel: `<input type="text" maxLength={200}>` (required)
- Kategorie: `<input type="text">` (required)
- Marke (optional): `<input type="text">`
- Modell (optional): `<input type="text">`
- Zustand (optional): `<input type="text">` — Hinweis: z.B. "Sehr gut", "Gut", "Akzeptabel"
- Anzahl: `<input type="number" min={1}>` (required)
- Beschreibung (optional): `<textarea rows={4}>`
- Mängel (optional): `<textarea rows={3}>`
- Vollständigkeit (optional): `<input type="text">` — Hinweis: z.B. "Komplett", "Ohne Zubehör"

Zwei-Spalten-Grid für kurze Felder (Marke/Modell, Zustand/Anzahl) — gleich wie IF-024.

**Nach Speichern:** "Gespeichert ✓" einblenden, kein automatisches Weiterleiten.
Link "← Zurück zu den Items" immer sichtbar oben.

**`readError()`** — gleiche Hilfsfunktion wie IF-022/023/024.

**Styling** — konsistent mit IF-021 bis IF-026.

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/items/[iid]/edit` lädt das Item und zeigt alle Felder befüllt
- [ ] Formular speichert via PATCH, Fehlermeldung bei Fehler
- [ ] Erfolgshinweis "Gespeichert ✓" nach Speichern sichtbar
- [ ] Leere optionale Felder senden `null`
- [ ] State synchronisiert sich mit API-Antwort nach Speichern
- [ ] Alle Inputs während Speichern deaktiviert
- [ ] Link zurück zu Items immer sichtbar
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Client Component — `'use client'`
- `ignore`-Flag in `useEffect`
- `updateField<K>()` generischer Updater (Muster aus IF-024)
- `readError()` als Hilfsfunktion

---

## Abhängigkeiten

- IF-010 (Items API — GET + PATCH) — merged ✓
- IF-022 (Items UI) — Edit-Link von dort auf diese Seite sinnvoll (kein eigenes Ticket)

## Scope-Grenze

Nicht Teil dieses Tickets:
- Status-Änderung des Items
- Item löschen
- Foto-Zuweisung

---

## Referenzen

Review: REVIEW-IF-028 (nach Implementierung)
