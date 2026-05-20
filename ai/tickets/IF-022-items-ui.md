# IF-022-items-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Items-UI implementieren — `/projects/[id]/items` listet alle InventoryItems eines
Projekts und ermöglicht direkt Scoring (`POST .../score`) und Listing-Generierung
(`POST .../listing`) per Button.

---

## Kontext

- `GET /api/projects/[id]/items` — lädt alle Items
- `POST /api/projects/[id]/items/[iid]/score` — führt Scoring aus, gibt Recommendation zurück (IF-011)
- `POST /api/projects/[id]/items/[iid]/listing` — generiert Listing-Draft (IF-012)
- Client Component für Interaktivität
- Status-Flow: `draft` → `ready_for_scoring` → `scored` → `listing_created`

---

## Ziel

Nach diesem Ticket kann ein Nutzer Items bewerten und Listings generieren — alles
auf einer Seite ohne Seitenwechsel.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/items/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/items/page.tsx` — Client Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Item = {
  id: string
  title: string
  category: string
  condition: string | null
  status: string
}

type ScoredResult = {
  action: string
  confidence: string
  rationale: string | null
  expectedPriceCents: number | null
  isSensitiveCategory: boolean
}

export default function ItemsPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [scores, setScores] = useState<Record<string, ScoredResult>>({})

  useEffect(() => {
    fetch(`/api/projects/${projectId}/items`)
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setLoading(false)
      })
  }, [projectId])

  async function handleScore(iid: string) {
    setProcessing(iid)
    const res = await fetch(`/api/projects/${projectId}/items/${iid}/score`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setScores(prev => ({ ...prev, [iid]: data.recommendation }))
      setItems(prev => prev.map(item => item.id === iid ? { ...item, status: 'scored' } : item))
    }
    setProcessing(null)
  }

  async function handleGenerateListing(iid: string) {
    setProcessing(iid)
    const res = await fetch(`/api/projects/${projectId}/items/${iid}/listing`, { method: 'POST' })
    if (res.ok) {
      setItems(prev => prev.map(item => item.id === iid ? { ...item, status: 'listing_created' } : item))
    }
    setProcessing(null)
  }

  return (
    <main>
      <Link href={`/projects/${projectId}`}>← Zurück zum Projekt</Link>
      <h1>Items</h1>

      {loading && <p>Lädt…</p>}
      {!loading && items.length === 0 && <p>Noch keine Items. Zuerst Candidates akzeptieren.</p>}

      <ul>
        {items.map(item => (
          <li key={item.id}>
            <strong>{item.title}</strong>
            <span> — {item.category}</span>
            {item.condition && <span> · {item.condition}</span>}
            <span> [{item.status}]</span>

            {item.status === 'ready_for_scoring' && (
              <button onClick={() => handleScore(item.id)} disabled={processing === item.id}>
                Bewerten
              </button>
            )}

            {item.status === 'scored' && !scores[item.id] && (
              <button onClick={() => handleGenerateListing(item.id)} disabled={processing === item.id}>
                Listing erstellen
              </button>
            )}

            {scores[item.id] && (
              <div>
                <p>Empfehlung: <strong>{scores[item.id].action}</strong> — {scores[item.id].rationale}</p>
                {scores[item.id].expectedPriceCents && (
                  <p>Preis: {(scores[item.id].expectedPriceCents! / 100).toFixed(2)} €</p>
                )}
                {scores[item.id].isSensitiveCategory && (
                  <p role="alert">⚠ Sensible Kategorie — bitte Listing sorgfältig prüfen.</p>
                )}
                <button onClick={() => handleGenerateListing(item.id)} disabled={processing === item.id}>
                  Listing erstellen
                </button>
              </div>
            )}

            {item.status === 'listing_created' && (
              <Link href={`/projects/${projectId}/listings`}>Listing ansehen →</Link>
            )}
          </li>
        ))}
      </ul>

      {!loading && items.some(i => i.status === 'listing_created') && (
        <Link href={`/projects/${projectId}/listings`}>Zu den Listings →</Link>
      )}
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/items` listet alle Items des Projekts
- [ ] Status `ready_for_scoring`: "Bewerten"-Button → ruft `POST .../score` auf, zeigt Empfehlung
- [ ] Status `scored`: "Listing erstellen"-Button → ruft `POST .../listing` auf
- [ ] Status `listing_created`: Link zu Listings sichtbar
- [ ] Buttons während Verarbeitung deaktiviert
- [ ] `isSensitiveCategory`-Warnung bei entsprechender Empfehlung
- [ ] Leere Liste zeigt Hinweistext
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Client Component — `'use client'` Direktive
- Optimistic UI: Item-Status lokal aktualisieren nach API-Call
- Scoring-Result direkt in `scores`-State speichern — kein Reload
- `POST`-Requests ohne Body für Score und Listing-Generierung

---

## Abhängigkeiten

- IF-011 (Scoring API) — merged ✓
- IF-012 (Listing Generation API) — merged ✓
- IF-021 (Candidates UI) — Items entstehen durch Accept

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Item-Details bearbeiten (Titel, Zustand — eigene Seite)
- Massenscoring aller Items
- Recommendation-Details als eigene Seite

---

## Referenzen

Review: REVIEW-IF-022 (nach Implementierung)
