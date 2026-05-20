# IF-021-candidates-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Candidates-Review-UI implementieren — `/projects/[id]/candidates` listet alle
`pending` Candidates und ermöglicht einzelnes Akzeptieren oder Ablehnen per Button.

---

## Kontext

- `GET /api/projects/[id]/candidates?status=pending` — listet ausstehende Candidates
- `PATCH /api/projects/[id]/candidates/[cid]` — `{ action: 'accept' | 'reject' }` (IF-009)
- Nach Accept wird ein InventoryItem angelegt
- Client Component für Interaktivität (Buttons die API aufrufen)

---

## Ziel

Nach diesem Ticket kann ein Nutzer erkannte Items sichten und entscheiden, welche
in die Inventarliste aufgenommen werden.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/candidates/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/candidates/page.tsx` — Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Candidate = {
  id: string
  rawLabel: string
  normalizedName: string
  category: string
  confidence: number
  status: string
}

export default function CandidatesPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/projects/${projectId}/candidates?status=pending`)
      .then(r => r.json())
      .then(data => {
        setCandidates(data.candidates ?? [])
        setLoading(false)
      })
  }, [projectId])

  async function handleAction(cid: string, action: 'accept' | 'reject') {
    setProcessing(cid)
    await fetch(`/api/projects/${projectId}/candidates/${cid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setCandidates(prev => prev.filter(c => c.id !== cid))
    setProcessing(null)
  }

  return (
    <main>
      <Link href={`/projects/${projectId}`}>← Zurück zum Projekt</Link>
      <h1>Candidates prüfen</h1>

      {loading && <p>Lädt…</p>}
      {!loading && candidates.length === 0 && <p>Keine ausstehenden Candidates.</p>}

      <ul>
        {candidates.map(c => (
          <li key={c.id}>
            <strong>{c.normalizedName}</strong>
            <span> — {c.category} (Konfidenz: {Math.round(c.confidence * 100)}%)</span>
            <button
              onClick={() => handleAction(c.id, 'accept')}
              disabled={processing === c.id}
            >
              Akzeptieren
            </button>
            <button
              onClick={() => handleAction(c.id, 'reject')}
              disabled={processing === c.id}
            >
              Ablehnen
            </button>
          </li>
        ))}
      </ul>

      {!loading && candidates.length === 0 && (
        <Link href={`/projects/${projectId}/items`}>Zu den Items →</Link>
      )}
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/candidates` zeigt alle `pending` Candidates
- [ ] Akzeptieren-Button ruft PATCH mit `action: 'accept'` auf und entfernt Candidate aus Liste
- [ ] Ablehnen-Button ruft PATCH mit `action: 'reject'` auf und entfernt Candidate aus Liste
- [ ] Button ist während der Verarbeitung deaktiviert
- [ ] Bei leerer Liste: Hinweistext + Link zu Items
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Optimistic UI: Candidate sofort aus der Liste entfernen nach API-Call (kein Reload)
- Client Component — `'use client'` Direktive
- Fehlerzustand für MVP nicht zwingend nötig — einfacher Ansatz reicht

---

## Abhängigkeiten

- IF-009 (Candidates API) — merged ✓
- IF-020 (Upload UI) — Candidates entstehen durch Upload

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Massenakzeptierung aller Candidates
- Candidate bearbeiten (Name/Kategorie ändern)
- Bild-Vorschau zum Candidate
- Bereits verarbeitete Candidates anzeigen

---

## Referenzen

Review: REVIEW-IF-021 (nach Implementierung)
