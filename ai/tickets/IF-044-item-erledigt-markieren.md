# IF-044-item-erledigt-markieren

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Items als "erledigt" markieren (US-605): Ein verkauftes, verschenktes oder
entsorgtes Item bekommt `status: 'done'`. Erledigte Items können auf der
Items-Seite aus- oder eingeblendet werden.

---

## Kontext

Im täglichen Workflow arbeitet der Nutzer eine Kiste durch. Wenn ein
Gegenstand verkauft ist, soll er das im Tool festhalten können — ohne das
Item zu löschen (die Historie bleibt erhalten). Aktuell gibt es keinen
"erledigt"-Status und keine Möglichkeit, abgearbeitete Gegenstände
auszublenden.

---

## Betroffene Dateien

```
packages/db/prisma/schema.prisma                                        ERWEITERN
packages/db/prisma/migrations/<timestamp>_inventoryitemstatus_done/     NEU
packages/shared/src/schemas/inventory-item.ts                           ERWEITERN
apps/api/app/api/projects/[id]/items/[iid]/route.ts                     ERWEITERN (PATCH)
apps/api/app/projects/[id]/items/page.tsx                               ERWEITERN
```

---

## Implementierungsdetails

### Schema-Migration

`InventoryItemStatus`-Enum um `done` erweitern:

```prisma
enum InventoryItemStatus {
  draft
  ready_for_scoring
  scored
  listing_created
  handled
  done
}
```

Migration:
```sql
ALTER TYPE "InventoryItemStatus" ADD VALUE 'done';
```

`packages/shared/src/schemas/inventory-item.ts` — `InventoryItemStatusSchema` um `'done'` ergänzen.

### API: PATCH /api/projects/:id/items/:iid

Das bestehende `PatchItemSchema` um `status` erweitern:

```typescript
const PatchItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  brand: z.string().max(100).nullable().optional(),
  model: z.string().max(100).nullable().optional(),
  condition: z.string().max(100).nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  description: z.string().max(2000).nullable().optional(),
  defects: z.string().max(1000).nullable().optional(),
  completeness: z.string().max(200).nullable().optional(),
  status: z.enum(['ready_for_scoring', 'scored', 'done']).optional(),
})
```

Kein separater Endpunkt — der bestehende PATCH reicht.

### UI: Items-Seite

**State:**
```typescript
const [hideDone, setHideDone] = useState(true)
```

**Filter:**
```typescript
const visibleItems = hideDone
  ? items.filter((item) => item.status !== 'done')
  : items
```

**Toggle oberhalb der Liste:**
```tsx
<label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5c5346' }}>
  <input
    type="checkbox"
    checked={hideDone}
    onChange={(e) => setHideDone(e.currentTarget.checked)}
  />
  Erledigte ausblenden
</label>
```

**"Erledigt"-Button je Item** (neben dem bestehenden "Bearbeiten"-Link):

```tsx
<button
  type="button"
  onClick={() => handleToggleDone(item.id, item.status)}
  style={item.status === 'done' ? doneButtonActiveStyle : doneButtonStyle}
>
  {item.status === 'done' ? 'Erledigt ✓' : 'Als erledigt markieren'}
</button>
```

**`handleToggleDone`:**
```typescript
async function handleToggleDone(itemId: string, currentStatus: string) {
  const newStatus = currentStatus === 'done' ? 'ready_for_scoring' : 'done'

  const response = await fetch(`/api/projects/${projectId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  })

  if (!response.ok) {
    return
  }

  setItems((current) =>
    current.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item)),
  )
}
```

**Styles:**
```typescript
const doneButtonStyle = {
  padding: '0.5rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid #cfc5b6',
  background: '#ffffff',
  color: '#5c5346',
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties

const doneButtonActiveStyle = {
  padding: '0.5rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid #a8d5c2',
  background: '#eef8f3',
  color: '#1f6f5f',
  fontWeight: 700,
  cursor: 'pointer',
} satisfies React.CSSProperties
```

---

## Akzeptanzkriterien

- [ ] `PATCH /api/projects/:id/items/:iid` akzeptiert `{ status: 'done' }`
- [ ] Toggle zwischen `done` und `ready_for_scoring` möglich (rückgängig machbar)
- [ ] Button-Label und -Stil ändert sich je nach aktuellem Status
- [ ] Checkbox "Erledigte ausblenden" blendet `done`-Items aus der Liste aus
- [ ] Standard: erledigte Items ausgeblendet (`hideDone: true`)
- [ ] Statusänderung ohne Seitenreload (optimistisches Update)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-010 (Items API) — bereits gemergt
- IF-022 (Items UI) — bereits gemergt

---

## Referenzen

Review: REVIEW-IF-044 (nach Implementierung)
