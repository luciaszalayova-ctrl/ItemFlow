# IF-038-projekt-loeschen

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Projekte vollständig löschen — inklusive Storage-Dateien und allen
DB-Einträgen. Der bestehende DELETE-Endpunkt macht aktuell nur Soft-Delete
(`status = 'deleted'`); dieses Ticket ersetzt das durch echtes Löschen.
Dazu kommt ein Löschen-Button mit Bestätigungsdialog auf der Projektdetail-Seite.

---

## Kontext

Nutzer laden Fotos ihrer Wohnung hoch. Ohne echte Löschfunktion ist das
Produkt datenschutztechnisch nicht vertretbar (CLAUDE.md: "Nutzerbilder müssen
löschbar sein"). Der Endpunkt `DELETE /api/projects/:id` existiert bereits,
macht aber nur `prisma.project.update({ data: { status: 'deleted' } })` —
Fotos und alle verknüpften Daten bleiben in Storage und DB.

`StorageProvider.delete(key: string)` ist verfügbar und von
`LocalFileSystemStorageProvider` implementiert.

Prisma hat `onDelete: Cascade` für alle Projekt-Relationen — ein
`prisma.project.delete()` entfernt alle verknüpften Records automatisch.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/route.ts      ERSETZEN (DELETE-Handler)
apps/api/app/projects/[id]/page.tsx          ERWEITERN (Löschen-Button)
```

---

## Implementierungsdetails

### 1. DELETE-Route: Soft-Delete durch echtes Löschen ersetzen

```typescript
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  })

  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Storage-Dateien vor DB-Löschung entfernen
  const assets = await prisma.asset.findMany({
    where: { projectId: id },
    select: { storageKey: true },
  })

  const storage = new LocalFileSystemStorageProvider()
  await Promise.allSettled(assets.map((asset) => storage.delete(asset.storageKey)))

  // Projekt hard-deleten — Cascade entfernt alle verknüpften Records
  await prisma.project.delete({ where: { id } })

  return new Response(null, { status: 204 })
}
```

**`Promise.allSettled` statt `Promise.all`** — fehlgeschlagene Storage-Deletes
(z. B. Datei bereits weg) blockieren nicht die DB-Löschung.

---

### 2. Projektdetail-Seite: Löschen-Button

`app/projects/[id]/page.tsx` ist ein Server Component — der Button braucht
einen Client-Wrapper. Einfachste Lösung: eine kleine `DeleteProjectButton`
Client Component in derselben Datei (oder als separates File, Codex entscheidet).

```tsx
'use client'

function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Projekt wirklich löschen? Alle Fotos und Daten werden entfernt.')) return

    setDeleting(true)

    const response = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })

    if (!response.ok) {
      alert('Löschen fehlgeschlagen.')
      setDeleting(false)
      return
    }

    router.push('/projects')
  }

  return (
    <button
      type="button"
      onClick={() => void handleDelete()}
      disabled={deleting}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.7rem 1rem',
        borderRadius: '999px',
        background: 'transparent',
        color: deleting ? '#9b8f7b' : '#9a2f1f',
        border: `1px solid ${deleting ? '#cdbfa9' : '#efc6c0'}`,
        fontWeight: 700,
        cursor: deleting ? 'progress' : 'pointer',
      }}
    >
      {deleting ? 'Wird gelöscht...' : 'Projekt löschen'}
    </button>
  )
}
```

Der Button erscheint am Ende der Projektdetail-Seite, unterhalb der
Naechste-Schritte-Liste. Keine separate Seite nötig.

`confirm()` ist für MVP ausreichend — kein eigenes Modal nötig.

---

## Akzeptanzkriterien

- [ ] `DELETE /api/projects/:id` löscht alle Assets aus Storage
- [ ] `DELETE /api/projects/:id` löscht das Projekt und alle verknüpften
  DB-Records (Candidates, Items, Listings, Bundles, Assets) per Cascade
- [ ] Fehlgeschlagene Storage-Deletes blockieren nicht die DB-Löschung
- [ ] Falsches Projekt → `404`, fremdes Projekt → `403`
- [ ] "Projekt löschen"-Button auf der Projektdetail-Seite sichtbar
- [ ] Bestätigungsdialog erscheint vor dem Löschen
- [ ] Nach erfolgreichem Löschen: Weiterleitung auf `/projects`
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `LocalFileSystemStorageProvider` wird direkt instanziiert (wie in der
  Assets-Route) — kein Provider-Injection nötig für MVP.
- `confirm()` statt eigenem Modal — ausreichend für MVP.
- Soft-Delete-Logik (`status = 'deleted'`) wird entfernt — kein Rückgängigmachen.
- GET-Route in `apps/api/app/api/projects/[id]/route.ts` bleibt unverändert.

---

## Abhängigkeiten

- Keine — IF-038 ist unabhängig

---

## Referenzen

Review: REVIEW-IF-038 (nach Implementierung)
