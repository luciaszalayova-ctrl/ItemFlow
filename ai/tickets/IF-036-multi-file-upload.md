# IF-036-multi-file-upload

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Die Upload-Seite auf Mehrfach-Dateiauswahl umstellen: Nutzer wählen mehrere Bilder
gleichzeitig, die Seite lädt sie nacheinander hoch und zeigt eine
Zusammenfassung mit Gesamtzahl erkannter Candidates und aufgetretener Fehler.

---

## Kontext

`apps/api/app/projects/[id]/upload/page.tsx` nimmt aktuell nur eine Datei:
`files?.[0]` und ein einzelner Fetch. Der API-Endpunkt
`POST /api/projects/:id/assets` akzeptiert ein `file`-Feld pro Request — das
bleibt unverändert.

Lösung: Frontend iteriert über alle ausgewählten Dateien und sendet sie
nacheinander. Der Endpunkt selbst braucht keine Änderung.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/upload/page.tsx    ERSETZEN
```

---

## Implementierungsdetails

### Neuer State

```typescript
const [uploading, setUploading] = useState(false)
const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
const [result, setResult] = useState<{ candidateCount: number; fileCount: number } | null>(null)
const [errors, setErrors] = useState<string[]>([])
```

### `handleSubmit`

```typescript
async function handleSubmit(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  const form = event.currentTarget
  const files = Array.from(
    (form.elements.namedItem('files') as HTMLInputElement).files ?? []
  )

  if (files.length === 0) {
    setErrors(['Bitte waehle mindestens ein Bild aus.'])
    return
  }

  setUploading(true)
  setErrors([])
  setResult(null)
  setProgress({ done: 0, total: files.length })

  let totalCandidates = 0
  const uploadErrors: string[] = []

  for (const file of files) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      try {
        const data = (await response.json()) as { error?: string }
        uploadErrors.push(`${file.name}: ${data.error ?? 'Upload fehlgeschlagen.'}`)
      } catch {
        uploadErrors.push(`${file.name}: Upload fehlgeschlagen.`)
      }
    } else {
      const data = (await response.json()) as { candidateCount?: number }
      totalCandidates += data.candidateCount ?? 0
    }

    setProgress((current) =>
      current ? { ...current, done: current.done + 1 } : null
    )
  }

  setResult({ candidateCount: totalCandidates, fileCount: files.length - uploadErrors.length })
  setErrors(uploadErrors)
  setUploading(false)
  form.reset()
}
```

### Input-Feld

```tsx
<input
  name="files"
  type="file"
  accept="image/*"
  multiple
  required
  style={inputStyle}
/>
```

### Fortschrittsanzeige (während Upload)

```tsx
{progress ? (
  <p style={{ margin: 0, color: '#5c5346' }}>
    {progress.done} / {progress.total} Dateien hochgeladen...
  </p>
) : null}
```

### Ergebnis-Block

```tsx
{result ? (
  <section style={successCardStyle}>
    <h2 style={{ marginTop: 0 }}>Upload abgeschlossen</h2>
    <p style={{ marginTop: 0, lineHeight: 1.6 }}>
      <strong>{result.fileCount}</strong>{' '}
      {result.fileCount === 1 ? 'Bild' : 'Bilder'} hochgeladen —{' '}
      <strong>{result.candidateCount}</strong> Candidates erkannt.
    </p>
    <Link href={`/projects/${projectId}/candidates`} style={primaryLinkStyle}>
      Candidates pruefen
    </Link>
  </section>
) : null}
```

### Fehler-Block (partiell fehlgeschlagene Uploads)

```tsx
{errors.length > 0 ? (
  <ul role="alert" style={errorListStyle}>
    {errors.map((err) => (
      <li key={err}>{err}</li>
    ))}
  </ul>
) : null}
```

Neuer Style:

```typescript
const errorListStyle = {
  marginTop: '1rem',
  marginBottom: 0,
  padding: '0.75rem 0.9rem 0.75rem 1.75rem',
  borderRadius: '0.75rem',
  background: '#fde9e7',
  color: '#9a2f1f',
  lineHeight: 1.6,
} satisfies React.CSSProperties
```

---

## Akzeptanzkriterien

- [ ] `<input multiple>` akzeptiert mehrere Bilder gleichzeitig
- [ ] Dateien werden nacheinander an `POST /api/projects/:id/assets` gesendet
- [ ] Fortschritt "X / Y Dateien hochgeladen..." während des Uploads sichtbar
- [ ] Erfolgs-Block zeigt Anzahl Bilder und Gesamt-Candidates nach Abschluss
- [ ] Schlägt ein einzelnes Bild fehl, werden die anderen trotzdem hochgeladen
- [ ] Fehlgeschlagene Dateien werden mit Dateiname und Fehlermeldung gelistet
- [ ] Keine Änderung an `POST /api/projects/:id/assets`
- [ ] `pnpm typecheck` gruen
- [ ] `pnpm lint` gruen

---

## Rahmenbedingungen

- Sequentieller Upload (ein Request pro Datei) ist für MVP ausreichend.
- Kein Drag-and-drop in diesem Ticket — natives `multiple` reicht.
- Der Input-Name wechselt von `file` zu `files` — darauf im `handleSubmit` achten.
- Header-Text anpassen: "Foto hochladen" → "Fotos hochladen".

---

## Abhängigkeiten

- Keine — IF-036 ist unabhängig von IF-033/034/035

---

## Referenzen

Review: REVIEW-IF-036 (nach Implementierung)
