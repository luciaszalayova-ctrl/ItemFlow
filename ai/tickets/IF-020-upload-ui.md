# IF-020-upload-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Upload-UI implementieren — `/projects/[id]/upload` zeigt ein Datei-Upload-Formular.
Nutzer wählen Bilder aus, die an `POST /api/projects/[id]/assets` gesendet werden.
Nach erfolgreichem Upload werden die erkannten Candidates angezeigt.

---

## Kontext

- `POST /api/projects/[id]/assets` — erwartet `multipart/form-data` mit `file`-Feld (IF-007)
- Response enthält `{ asset, candidates: [...] }`
- Client Component nötig (File-Input, fetch mit FormData)
- Stil: inline Styles, kein CSS-Framework

---

## Ziel

Nach diesem Ticket kann ein Nutzer ein Foto hochladen und sieht sofort wie viele
Items erkannt wurden.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/upload/page.tsx    NEU — Client Component
```

---

## Implementierungsdetails

```typescript
'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UploadPage() {
  const { id: projectId } = useParams<{ id: string }>()
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ candidateCount: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const file = (e.currentTarget.elements.namedItem('file') as HTMLInputElement).files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Upload fehlgeschlagen.')
      setUploading(false)
      return
    }

    const data = await res.json()
    setResult({ candidateCount: data.candidates?.length ?? 0 })
    setUploading(false)
  }

  return (
    <main>
      <Link href={`/projects/${projectId}`}>← Zurück zum Projekt</Link>
      <h1>Fotos hochladen</h1>

      <form onSubmit={handleSubmit}>
        <input name="file" type="file" accept="image/*" required />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Wird hochgeladen…' : 'Hochladen'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      {result && (
        <div>
          <p>Upload erfolgreich — {result.candidateCount} Items erkannt.</p>
          <Link href={`/projects/${projectId}/candidates`}>Candidates prüfen →</Link>
        </div>
      )}
    </main>
  )
}
```

---

## Akzeptanzkriterien

- [ ] `/projects/[id]/upload` zeigt Datei-Input und Upload-Button
- [ ] Nach erfolgreichem Upload wird Anzahl erkannter Candidates angezeigt
- [ ] Link zu `/projects/[id]/candidates` nach Upload sichtbar
- [ ] Fehlermeldung bei fehlgeschlagenem Upload
- [ ] Upload-Button ist während des Uploads deaktiviert
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `fetch` mit `FormData` — kein `Content-Type`-Header setzen (Browser setzt `multipart/form-data` automatisch)
- Client Component — `'use client'` Direktive
- Nur ein Bild pro Upload (kein Multi-File für MVP)

---

## Abhängigkeiten

- IF-007 (Upload API) — merged ✓
- IF-019 (Project Detail) — verlinkt auf diese Seite

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Drag & Drop
- Upload-Fortschrittsbalken
- Mehrere Dateien gleichzeitig hochladen
- Bild-Vorschau vor Upload

---

## Referenzen

Review: REVIEW-IF-020 (nach Implementierung)
