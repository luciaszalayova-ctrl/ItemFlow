# IF-039-listing-regenerieren

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Einen "Neu generieren"-Button auf der Listing-Edit-Seite ergänzen, damit Nutzer
ein schlechtes Template-Ergebnis verwerfen und einen neuen Entwurf erzeugen
können — ohne das Listing zu löschen.

---

## Kontext

`POST /api/projects/:id/items/:iid/listing` und
`POST /api/projects/:id/bundles/:bid/listing` erzeugen ein Listing einmalig.
Danach gibt es keinen Weg zurück — der Nutzer kann nur manuell bearbeiten.
Die Listing-Edit-Seite (`projects/[id]/listings/[lid]/edit/page.tsx`) ist der
richtige Ort für den Button, da dort schlechter Output zuerst auffällt.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/listings/[lid]/regenerate/route.ts  NEU
apps/api/app/projects/[id]/listings/[lid]/edit/page.tsx            ERWEITERN
```

---

## Implementierungsdetails

### 1. Neuer Endpunkt

`POST /api/projects/:id/listings/:lid/regenerate`

```typescript
import { prisma } from '@itemflow/db'
import { TemplateListingGenerator } from '@itemflow/listings'
import { GeneratedListingSchema } from '@itemflow/shared'
import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; lid: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, lid } = await context.params
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

  const listing = await prisma.listingDraft.findFirst({
    where: { id: lid, projectId },
    select: { id: true, targetType: true, targetId: true, status: true },
  })
  if (!listing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
  if (listing.status !== 'draft' && listing.status !== 'reviewed') {
    return Response.json(
      { error: 'Listing kann in diesem Status nicht neu generiert werden.' },
      { status: 409 },
    )
  }

  const generator = new TemplateListingGenerator()

  let raw: unknown
  if (listing.targetType === 'item') {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: listing.targetId, projectId },
      select: {
        id: true, projectId: true, title: true, category: true, brand: true,
        model: true, condition: true, quantity: true, description: true,
        defects: true, completeness: true, sourceCandidateIds: true,
        status: true, createdAt: true, updatedAt: true,
      },
    })
    if (!item) return Response.json({ error: 'Item nicht gefunden.' }, { status: 404 })

    const recommendation = await prisma.recommendation.findFirst({
      where: { targetType: 'item', targetId: item.id },
      orderBy: { createdAt: 'desc' },
      select: { expectedPriceCents: true, minimumPriceCents: true },
    })

    raw = await generator.generate({
      targetType: 'item',
      item,
      platform: 'kleinanzeigen',
      suggestedPriceCents: recommendation?.expectedPriceCents ?? undefined,
      minimumPriceCents: recommendation?.minimumPriceCents ?? undefined,
    })
  } else {
    // targetType === 'bundle'
    const bundle = await prisma.bundle.findFirst({
      where: { id: listing.targetId, projectId },
      select: {
        id: true, projectId: true, title: true, itemIds: true,
        rationale: true, status: true, createdAt: true,
      },
    })
    if (!bundle) return Response.json({ error: 'Bundle nicht gefunden.' }, { status: 404 })

    const bundleItems = bundle.itemIds.length > 0
      ? await prisma.inventoryItem.findMany({
          where: { id: { in: bundle.itemIds }, projectId },
          select: {
            id: true, projectId: true, title: true, category: true, brand: true,
            model: true, condition: true, quantity: true, description: true,
            defects: true, completeness: true, sourceCandidateIds: true,
            status: true, createdAt: true, updatedAt: true,
          },
        })
      : []

    const recommendations = bundleItems.length > 0
      ? await prisma.recommendation.findMany({
          where: { targetType: 'item', targetId: { in: bundleItems.map((i) => i.id) } },
          orderBy: { createdAt: 'desc' },
          select: { targetId: true, expectedPriceCents: true, minimumPriceCents: true },
        })
      : []

    const latestByItem = new Map<string, { expectedPriceCents: number | null; minimumPriceCents: number | null }>()
    for (const r of recommendations) {
      if (!latestByItem.has(r.targetId)) latestByItem.set(r.targetId, r)
    }

    const suggestedPriceCents = recommendations.length > 0
      ? [...latestByItem.values()].reduce((sum, r) => sum + (r.expectedPriceCents ?? 0), 0)
      : undefined

    const minimumPriceCents = recommendations.length > 0
      ? [...latestByItem.values()].reduce((sum, r) => sum + (r.minimumPriceCents ?? 0), 0)
      : undefined

    raw = await generator.generate({
      targetType: 'bundle',
      bundle,
      bundleItems,
      platform: 'kleinanzeigen',
      suggestedPriceCents,
      minimumPriceCents,
    })
  }

  const generated = GeneratedListingSchema.parse(raw)

  const updated = await prisma.listingDraft.update({
    where: { id: listing.id },
    data: {
      title: generated.title,
      description: generated.description,
      priceCents: generated.priceCents,
      minimumPriceCents: generated.minimumPriceCents ?? null,
      category: generated.category ?? null,
      shippingMode: generated.shippingMode ?? null,
      pickupOnly: generated.pickupOnly,
      status: 'draft',
    },
    select: {
      id: true, title: true, description: true, priceCents: true,
      minimumPriceCents: true, category: true, shippingMode: true,
      pickupOnly: true, status: true, updatedAt: true,
    },
  })

  return Response.json({ listing: updated })
}
```

**Hinweis:** Status wird auf `draft` zurückgesetzt — ein bereits freigegebenes
Listing (`reviewed`) muss nach der Neugenerierung erneut geprüft werden.

---

### 2. UI: Button auf der Listing-Edit-Seite

Neuer State:

```typescript
const [regenerating, setRegenerating] = useState(false)
```

Neue Funktion:

```typescript
async function handleRegenerate() {
  if (!listing) return
  if (!confirm('Listing wirklich neu generieren? Manuelle Änderungen gehen verloren.')) return

  setRegenerating(true)
  setError(null)

  const response = await fetch(
    `/api/projects/${projectId}/listings/${lid}/regenerate`,
    { method: 'POST' },
  )

  if (!response.ok) {
    setError(await readError(response, 'Neu generieren fehlgeschlagen.'))
    setRegenerating(false)
    return
  }

  const data = (await response.json()) as { listing: ListingDraft }
  setListing(data.listing)
  setSaved(false)
  setRegenerating(false)
}
```

Button neben dem "Speichern"-Button im Formular:

```tsx
<button
  type="button"
  onClick={() => void handleRegenerate()}
  disabled={regenerating || saving}
  style={secondaryButtonStyle}
>
  {regenerating ? 'Wird generiert...' : 'Neu generieren'}
</button>
```

---

## Akzeptanzkriterien

- [ ] `POST /api/projects/:id/listings/:lid/regenerate` überschreibt Titel,
  Beschreibung, Preis mit neuen Template-Werten
- [ ] Status wird auf `draft` zurückgesetzt (auch bei vorherigem `reviewed`)
- [ ] Listing mit Status `exported` oder `prefilled` → `409`
- [ ] Falsches Projekt / fehlendes Listing → `404`
- [ ] Item-Listings und Bundle-Listings werden beide unterstützt
- [ ] "Neu generieren"-Button auf der Edit-Seite mit Bestätigungsdialog
- [ ] Nach Erfolg: Formularfelder zeigen neuen Inhalt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- Keine — IF-039 ist unabhängig

---

## Referenzen

Review: REVIEW-IF-039 (nach Implementierung)
