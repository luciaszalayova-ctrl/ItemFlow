# IF-037-kandidaten-bearbeiten

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Kandidaten auf der Review-Seite inline bearbeiten bevor sie akzeptiert werden —
Name und Kategorie korrigieren, ohne einen separaten Edit-Screen zu öffnen.

---

## Kontext

`PATCH /api/projects/:id/candidates/:cid` akzeptiert aktuell nur
`{ action: 'accept' | 'reject' }`. ChatGPT-Output enthält regelmäßig falsche
Namen oder Kategorien — ohne Editierung vor dem Akzeptieren landen diese
direkt als `title` bzw. `category` im `InventoryItem`.

Die Candidates-Seite zeigt aktuell nur Akzeptieren/Ablehnen-Buttons.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/candidates/[cid]/route.ts   ERWEITERN
apps/api/app/projects/[id]/candidates/page.tsx             ERWEITERN
```

---

## Implementierungsdetails

### 1. PATCH-Route erweitern

Schema auf Union umstellen — entweder `action` oder Feld-Updates:

```typescript
const PatchSchema = z.union([
  z.object({ action: z.enum(['accept', 'reject']) }),
  z
    .object({
      normalizedName: z.string().min(1).optional(),
      category: z.string().min(1).optional(),
    })
    .refine(
      (obj) => obj.normalizedName !== undefined || obj.category !== undefined,
      { message: 'Mindestens ein Feld muss angegeben werden.' },
    ),
])
```

Neuer Branch für den Update-Fall (kein `action`-Feld):

```typescript
if (!('action' in parsed.data)) {
  await prisma.itemCandidate.update({
    where: { id: candidate.id },
    data: {
      ...(parsed.data.normalizedName !== undefined && {
        normalizedName: parsed.data.normalizedName,
      }),
      ...(parsed.data.category !== undefined && {
        category: parsed.data.category,
      }),
    },
  })

  return Response.json({
    candidateId: candidate.id,
    normalizedName: parsed.data.normalizedName,
    category: parsed.data.category,
  })
}
```

Die `accept`/`reject`-Logik bleibt vollständig unverändert.

**Wichtig:** Der Guard `candidate.status !== 'pending'` bleibt — auch Feld-Updates
nur auf `pending`-Kandidaten erlaubt.

---

### 2. UI: Inline-Edit auf der Candidates-Seite

**Neuer State pro Kandidat:**

```typescript
const [editingId, setEditingId] = useState<string | null>(null)
const [editName, setEditName] = useState('')
const [editCategory, setEditCategory] = useState('')
const [saving, setSaving] = useState(false)
```

**Ablauf:**
1. Nutzer klickt "Bearbeiten" → `editingId = candidate.id`, Felder werden mit
   aktuellen Werten vorbefüllt.
2. Nutzer ändert Name/Kategorie und klickt "Speichern".
3. `PATCH` mit `{ normalizedName, category }` → Response-Felder in
   `candidates`-State übernehmen.
4. Felder werden zu Anzeigetext — `editingId = null`.
5. "Abbrechen" setzt `editingId = null` ohne PATCH.

**Nur ein Kandidat gleichzeitig im Edit-Mode** — `editingId` verhindert
parallele Edits.

**Ungefähre UI pro Kandidat im Edit-Mode:**

```tsx
{editingId === candidate.id ? (
  <div style={{ display: 'grid', gap: '0.75rem' }}>
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontWeight: 700 }}>Name</span>
      <input
        value={editName}
        onChange={(e) => setEditName(e.currentTarget.value)}
        style={inputStyle}
      />
    </label>
    <label style={{ display: 'grid', gap: '0.35rem' }}>
      <span style={{ fontWeight: 700 }}>Kategorie</span>
      <input
        value={editCategory}
        onChange={(e) => setEditCategory(e.currentTarget.value)}
        style={inputStyle}
      />
    </label>
    <div style={{ display: 'flex', gap: '0.75rem' }}>
      <button onClick={() => void handleSaveEdit(candidate.id)} disabled={saving} style={...}>
        {saving ? 'Wird gespeichert...' : 'Speichern'}
      </button>
      <button onClick={() => setEditingId(null)} style={secondaryButtonStyle}>
        Abbrechen
      </button>
    </div>
  </div>
) : (
  // bestehende Anzeige + neuer "Bearbeiten"-Link
  <button onClick={() => {
    setEditingId(candidate.id)
    setEditName(candidate.normalizedName)
    setEditCategory(candidate.category)
  }} style={textButtonStyle}>
    Bearbeiten
  </button>
)}
```

---

## Akzeptanzkriterien

- [ ] `PATCH` mit `{ normalizedName, category }` aktualisiert den Kandidaten
- [ ] `PATCH` mit `{ action: 'accept' | 'reject' }` funktioniert unverändert
- [ ] Feld-Update nur auf `pending`-Kandidaten → sonst `409`
- [ ] Mindestens ein Feld bei Update-Payload → sonst `400`
- [ ] "Bearbeiten"-Button öffnet Inline-Felder mit aktuellen Werten
- [ ] "Speichern" schickt PATCH und aktualisiert die Anzeige
- [ ] "Abbrechen" schließt Edit-Mode ohne Request
- [ ] Nur ein Kandidat gleichzeitig im Edit-Mode
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Kein separater Edit-Screen — inline in der Kandidaten-Card.
- `category` ist aktuell ein Freitext-String — kein Select nötig für MVP.
- `confidence` und `rawLabel` sind nicht editierbar (read-only, stammen vom Modell).
- Bestehende Akzeptieren/Ablehnen-Buttons bleiben unverändert sichtbar,
  auch im Edit-Mode.

---

## Abhängigkeiten

- Keine — IF-037 ist unabhängig

---

## Referenzen

Review: REVIEW-IF-037 (nach Implementierung)
