# IF-040-asset-loeschen

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Einzelne hochgeladene Fotos löschen — aus Storage und DB. Die Upload-Seite
wird um eine Liste bereits hochgeladener Assets mit Löschen-Button erweitert.

---

## Kontext

Nutzer laden Fotos ihrer Wohnung hoch. Einzelne Fotos (z. B. versehentlich
hochgeladen, falsches Motiv) können aktuell nicht entfernt werden.
`StorageProvider.delete(key)` ist verfügbar und implementiert.

`ItemCandidate.assetId` ist seit IF-033 nullable (`onDelete: SetNull`) —
beim Löschen eines Assets werden verknüpfte Candidates nicht gelöscht,
ihre `assetId` wird auf `null` gesetzt.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/assets/[aid]/route.ts  NEU
apps/api/app/projects/[id]/upload/page.tsx            ERWEITERN
```

---

## Implementierungsdetails

### 1. Neuer Endpunkt

`DELETE /api/projects/:id/assets/:aid`

```typescript
import { prisma } from '@itemflow/db'
import { LocalFileSystemStorageProvider } from '@itemflow/vision'
import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; aid: string }> }

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, aid } = await context.params
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

  const asset = await prisma.asset.findFirst({
    where: { id: aid, projectId },
    select: { id: true, storageKey: true },
  })
  if (!asset) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const storage = new LocalFileSystemStorageProvider()
  await storage.delete(asset.storageKey).catch(() => {
    // Datei bereits weg — DB-Eintrag trotzdem entfernen
  })

  await prisma.asset.delete({ where: { id: asset.id } })

  return new Response(null, { status: 204 })
}
```

`prisma.asset.delete()` setzt via `onDelete: SetNull` automatisch
`assetId = null` auf allen verknüpften `ItemCandidate`-Records.

---

### 2. Upload-Seite erweitern

Die Upload-Seite lädt beim Mount alle Assets des Projekts und zeigt sie
als Liste unterhalb des Upload-Formulars.

**Neuer State:**

```typescript
type AssetEntry = { id: string; fileName: string; sizeBytes: number }
const [assets, setAssets] = useState<AssetEntry[]>([])
const [deletingId, setDeletingId] = useState<string | null>(null)
```

**Assets laden** — in einem separaten `useEffect` (unabhängig vom Upload):

```typescript
useEffect(() => {
  let ignore = false

  async function loadAssets() {
    const response = await fetch(`/api/projects/${projectId}/assets`)
    if (!response.ok || ignore) return
    const data = (await response.json()) as { assets?: AssetEntry[] }
    if (!ignore) setAssets(data.assets ?? [])
  }

  void loadAssets()
  return () => { ignore = true }
}, [projectId])
```

**Hinweis:** `GET /api/projects/:id/assets` existiert noch nicht — muss im
selben Ticket ergänzt werden (siehe unten).

Nach erfolgreichem Upload: `setAssets((current) => [...current, newAsset])`
falls die POST-Response einen `asset`-Eintrag zurückgibt. Alternativ: einfach
neu laden.

**Löschen-Funktion:**

```typescript
async function handleDeleteAsset(assetId: string, fileName: string) {
  if (!confirm(`"${fileName}" wirklich löschen?`)) return

  setDeletingId(assetId)
  const response = await fetch(`/api/projects/${projectId}/assets/${assetId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    setError('Foto konnte nicht gelöscht werden.')
    setDeletingId(null)
    return
  }

  setAssets((current) => current.filter((a) => a.id !== assetId))
  setDeletingId(null)
}
```

**Asset-Liste im JSX** (unterhalb des Upload-Formulars):

```tsx
{assets.length > 0 ? (
  <section style={{ marginTop: '2rem' }}>
    <h2 style={{ marginBottom: '0.75rem', fontSize: '1.1rem' }}>
      Hochgeladene Fotos ({assets.length})
    </h2>
    <ul style={assetListStyle}>
      {assets.map((asset) => (
        <li key={asset.id} style={assetItemStyle}>
          <span style={{ color: '#5c5346' }}>
            {asset.fileName}
            <span style={{ color: '#9b8f7b', marginLeft: '0.5rem' }}>
              ({formatBytes(asset.sizeBytes)})
            </span>
          </span>
          <button
            type="button"
            onClick={() => void handleDeleteAsset(asset.id, asset.fileName)}
            disabled={deletingId === asset.id}
            style={deleteButtonStyle}
          >
            {deletingId === asset.id ? '...' : 'Löschen'}
          </button>
        </li>
      ))}
    </ul>
  </section>
) : null}
```

Hilfsfunktion:

```typescript
function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

---

### 3. GET /api/projects/:id/assets ergänzen

Die bestehende `apps/api/app/api/projects/[id]/assets/route.ts` hat nur `POST`.
Ein `GET` für die Liste hinzufügen:

```typescript
export async function GET(_request: Request, context: RouteContext) {
  // Auth + Ownership-Check wie POST

  const { id: projectId } = await context.params
  // ... project check ...

  const assets = await prisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, fileName: true, sizeBytes: true, createdAt: true },
  })

  return Response.json({ assets })
}
```

---

## Akzeptanzkriterien

- [ ] `DELETE /api/projects/:id/assets/:aid` löscht Datei aus Storage und DB
- [ ] Storage-Fehler (Datei bereits weg) blockiert DB-Löschung nicht
- [ ] Falsches Projekt / fremdes Asset → `404` / `403`
- [ ] `GET /api/projects/:id/assets` gibt Asset-Liste zurück
- [ ] Upload-Seite zeigt hochgeladene Fotos mit Dateiname und Größe
- [ ] Löschen-Button mit Bestätigungsdialog pro Asset
- [ ] Asset verschwindet nach Löschen aus der Liste ohne Reload
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Kandidaten, die durch das Asset entstanden sind, werden nicht gelöscht —
  ihre `assetId` wird via `onDelete: SetNull` auf `null` gesetzt.
- Keine Vorschau/Thumbnail der Fotos — nur Dateiname und Größe.
- `confirm()` für MVP ausreichend.

---

## Abhängigkeiten

- IF-033 (assetId nullable) — bereits in main ✓

---

## Referenzen

Review: REVIEW-IF-040 (nach Implementierung)
