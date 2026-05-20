# IF-041-item-manuell-hinzufuegen

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Items manuell anlegen, die von der Bilderkennung nicht erfasst wurden — über
ein einfaches Formular auf der Items-Seite und einen neuen POST-Endpunkt.

---

## Kontext

`GET /api/projects/:id/items` existiert. `POST` fehlt. Nutzer haben aktuell
keine Möglichkeit, einen Gegenstand manuell einzutragen, wenn er nicht per
Upload/ChatGPT-Import erkannt wurde.

Manuell angelegte Items erhalten `sourceCandidateIds: []` und
`status: 'ready_for_scoring'` — sie können sofort bewertet werden.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/items/route.ts   ERWEITERN (POST hinzufügen)
apps/api/app/projects/[id]/items/page.tsx       ERWEITERN (Formular)
```

---

## Implementierungsdetails

### 1. POST /api/projects/:id/items

In `apps/api/app/api/projects/[id]/items/route.ts` eine `POST`-Funktion
ergänzen:

```typescript
import { z } from 'zod'

const CreateItemSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.string().min(1).max(100).optional(),
  quantity: z.number().int().min(1).default(1),
  description: z.string().max(2000).optional(),
})

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true },
  })
  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  }

  const parsed = CreateItemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Ungültige Eingabe.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const item = await prisma.inventoryItem.create({
    data: {
      projectId,
      title: parsed.data.title,
      category: parsed.data.category ?? null,
      quantity: parsed.data.quantity,
      description: parsed.data.description ?? null,
      sourceCandidateIds: [],
      status: 'ready_for_scoring',
    },
    select: itemSelect,
  })

  return Response.json({ item }, { status: 201 })
}
```

---

### 2. UI: Formular auf der Items-Seite

Ein aufklappbares "Item hinzufügen"-Formular am Ende der Items-Seite —
nach der Listendarstellung.

**Neuer State:**

```typescript
const [showAddForm, setShowAddForm] = useState(false)
const [addTitle, setAddTitle] = useState('')
const [addCategory, setAddCategory] = useState('')
const [adding, setAdding] = useState(false)
```

**Funktion:**

```typescript
async function handleAddItem() {
  if (!addTitle.trim()) return

  setAdding(true)
  setError(null)

  const response = await fetch(`/api/projects/${projectId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: addTitle.trim(),
      ...(addCategory.trim() ? { category: addCategory.trim() } : {}),
    }),
  })

  if (!response.ok) {
    setError(await readError(response, 'Item konnte nicht angelegt werden.'))
    setAdding(false)
    return
  }

  const data = (await response.json()) as { item: ListingDraft }
  setListings((current) => [...current, data.item])
  setAddTitle('')
  setAddCategory('')
  setShowAddForm(false)
  setAdding(false)
}
```

**Hinweis:** `setListings` entspricht dem State-Setter der Items-Liste —
der genaue Name richtet sich nach dem bestehenden Code in `items/page.tsx`.

**Formular im JSX** (unterhalb der Items-Liste, vor dem Footer):

```tsx
<section style={{ marginTop: '2rem' }}>
  {!showAddForm ? (
    <button
      type="button"
      onClick={() => setShowAddForm(true)}
      style={secondaryButtonStyle}
    >
      + Item manuell hinzufügen
    </button>
  ) : (
    <div style={cardStyle}>
      <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Item hinzufügen</h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ fontWeight: 700 }}>Bezeichnung *</span>
          <input
            value={addTitle}
            onChange={(e) => setAddTitle(e.currentTarget.value)}
            placeholder="z. B. IKEA Kallax Regal"
            style={inputStyle}
          />
        </label>
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          <span style={{ fontWeight: 700 }}>Kategorie</span>
          <input
            value={addCategory}
            onChange={(e) => setAddCategory(e.currentTarget.value)}
            placeholder="z. B. Möbel"
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => void handleAddItem()}
            disabled={adding || !addTitle.trim()}
            style={{
              ...buttonStyle,
              background: adding || !addTitle.trim() ? '#8d8476' : '#1f6f5f',
              color: '#ffffff',
              border: 0,
              cursor: adding || !addTitle.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {adding ? 'Wird angelegt...' : 'Hinzufügen'}
          </button>
          <button
            type="button"
            onClick={() => { setShowAddForm(false); setAddTitle(''); setAddCategory('') }}
            style={secondaryButtonStyle}
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  )}
</section>
```

---

## Akzeptanzkriterien

- [ ] `POST /api/projects/:id/items` legt Item mit `status: 'ready_for_scoring'`
  und `sourceCandidateIds: []` an
- [ ] Fehlender `title` → `400`
- [ ] Fremdes Projekt → `403`, fehlendes Projekt → `404`
- [ ] "+ Item manuell hinzufügen"-Button auf der Items-Seite sichtbar
- [ ] Formular klappt auf, Titel ist Pflichtfeld, Kategorie optional
- [ ] Neues Item erscheint sofort in der Liste ohne Reload
- [ ] Formular schließt sich nach Erfolg, Felder werden zurückgesetzt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Nur `title`, `category`, `quantity` im Formular — weitere Felder kann der
  Nutzer über die Edit-Seite (`/items/:iid/edit`) nachtragen.
- `quantity` wird nicht im Formular abgefragt — Default `1` reicht für MVP.
- Neues Item ist sofort scorbar (`ready_for_scoring`) — kein extra Schritt nötig.

---

## Abhängigkeiten

- Keine — IF-041 ist unabhängig

---

## Referenzen

Review: REVIEW-IF-041 (nach Implementierung)
