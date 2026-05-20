# IF-012-listing-generation-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listing-Generation-API implementieren — `POST /api/projects/[id]/items/[iid]/listing` ruft den
`TemplateListingGenerator` auf, validiert das Ergebnis mit `GeneratedListingSchema`, speichert
einen `ListingDraft` in der DB und setzt den Item-Status auf `listing_created`.

---

## Kontext

- `TemplateListingGenerator`: `packages/listings/src/generators/template-kleinanzeigen.ts`
- `ListingGenerator`-Interface + Re-Exports: `packages/listings/src/index.ts`
- `GeneratedListingSchema`, `UpdateListingDraftSchema`: `packages/shared/src/schemas/listing-draft.ts`
- `ListingDraft`-Modell: `packages/db/prisma/schema.prisma`
- Auth/Session-Pattern: `ai/context/project-snapshot.md`
- `Recommendation`-Modell: Wird via `targetType: 'item'`, `targetId: item.id` gefunden

---

## Ziel

Nach diesem Ticket bekommt ein `scored` Item einen Listing-Entwurf, der automatisch aus
Scoring-Daten und Item-Infos generiert wird. Nutzer können den Entwurf anschließend bearbeiten
und freigeben (IF-013/IF-014).

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/items/[iid]/listing/route.ts   NEU — POST
apps/api/package.json                                          @itemflow/listings ergänzen
apps/api/tsconfig.json                                         listings reference + paths
```

---

## Implementierungsdetails

### `POST /api/projects/[id]/items/[iid]/listing`

```typescript
import { TemplateListingGenerator } from '@itemflow/listings'
import { GeneratedListingSchema } from '@itemflow/shared'

// 1. Auth + Ownership wie in IF-011
// 2. Item laden (findFirst mit projectId-Filter)
//    → 404 wenn nicht gefunden
//    → 409 wenn item.status !== 'scored'

// 3. Recommendation laden
const recommendation = await prisma.recommendation.findFirst({
  where: { targetType: 'item', targetId: item.id },
  orderBy: { createdAt: 'desc' },
  select: { action: true, expectedPriceCents: true, minimumPriceCents: true }
})
// → 409 wenn keine Recommendation vorhanden: 'Item has no recommendation'

// 4. photoAssetIds aus Source-Candidates ableiten
const candidates = await prisma.itemCandidate.findMany({
  where: { id: { in: item.sourceCandidateIds } },
  select: { assetId: true }
})
const photoAssetIds = candidates.map(c => c.assetId)

// 5. Listing generieren + mit GeneratedListingSchema validieren
const generator = new TemplateListingGenerator()
const raw = await generator.generate({
  targetType: 'item',
  item,
  platform: 'kleinanzeigen',
  suggestedPriceCents: recommendation.expectedPriceCents ?? undefined,
  minimumPriceCents: recommendation.minimumPriceCents ?? undefined,
})
const generated = GeneratedListingSchema.parse(raw)  // wirft bei ungültigem Output

// 6. ListingDraft + Item-Status in einer Transaction
const draft = await prisma.$transaction(async (tx) => {
  const created = await tx.listingDraft.create({
    data: {
      projectId: item.projectId,
      targetType: 'item',
      targetId: item.id,
      platform: 'kleinanzeigen',
      title: generated.title,
      description: generated.description,
      priceCents: generated.priceCents,
      minimumPriceCents: generated.minimumPriceCents ?? null,
      category: generated.category ?? null,
      shippingMode: generated.shippingMode ?? null,
      pickupOnly: generated.pickupOnly,
      photoAssetIds,
    }
  })
  await tx.inventoryItem.update({
    where: { id: item.id },
    data: { status: 'listing_created' }
  })
  return created
})

return Response.json({ draft }, { status: 201 })
```

### `@itemflow/listings` in `apps/api` ergänzen

```json
// package.json:
"@itemflow/listings": "workspace:*"
```

```json
// tsconfig.json paths:
"@itemflow/listings": ["packages/listings/src/index.ts"],
"@itemflow/listings/*": ["packages/listings/src/*"]
// tsconfig.json references:
{ "path": "../../packages/listings" }
```

`packages/listings/tsconfig.json` auf `composite: true` prüfen — ergänzen falls fehlend.

---

## Akzeptanzkriterien

- [ ] `POST .../listing` gibt `ListingDraft` zurück (`201`)
- [ ] `ListingDraft` ist in DB gespeichert
- [ ] Item-Status ist nach Aufruf `listing_created`
- [ ] `409` wenn Item nicht `scored`
- [ ] `409` wenn keine Recommendation vorhanden
- [ ] Zweiter Aufruf auf `listing_created` Item gibt `409`
- [ ] `GeneratedListingSchema.parse()` wird aufgerufen — kein unvalidiertes Listing persistiert
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Nur `kleinanzeigen` als Platform im MVP
- `GeneratedListingSchema.parse()` ist Pflicht — kein roher Generator-Output in DB
- Kein Re-Generating über diese Route — `409` wenn bereits `listing_created`
- `photoAssetIds` aus `sourceCandidateIds` ableiten — leeres Array wenn keine Candidates

---

## Abhängigkeiten

- IF-004 (TemplateListingGenerator) — merged ✓
- IF-011 (Scoring API) — Item muss `scored` sein
- IF-010 (Items API) — Item muss existieren

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Bundle-Listings
- Mehrere Listing-Drafts pro Item
- Platform-Auswahl durch Nutzer
- Foto-Upload oder -Auswahl durch Nutzer

---

## Referenzen

Review: REVIEW-IF-012 (nach Implementierung)
