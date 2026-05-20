# IF-031-bundle-listing-generator

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Bundle-Listings nutzen aktuell die alte `generateListingDraft()`-Funktion mit
hartkodiertem Preis (500 ct). Item-Listings verwenden bereits korrekt den
`TemplateListingGenerator` mit Scoring-Preisen. Dieses Ticket bringt Bundle-Listings
auf denselben Stand.

---

## Kontext

**Was bereits korrekt funktioniert (Item-Listings):**

`apps/api/app/api/projects/[id]/items/[iid]/listing/route.ts` lädt die Recommendation,
übergibt `suggestedPriceCents` und `minimumPriceCents` an `TemplateListingGenerator.generate()`.
`TemplateListingGenerator.generateItem()` nutzt `input.suggestedPriceCents ?? 500`.

**Was noch fehlt (Bundle-Listings):**

`apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts` ruft `generateListingDraft()`
auf — eine einfachere Hilfsfunktion ohne Preisübergabe und ohne `bundleItems`:

```typescript
const raw = await generateListingDraft({
  title: bundle.title,
  description: bundle.rationale ?? '',
  condition: 'Verschiedene Zustände',
  category: 'Paket',
})
```

**`TemplateListingGenerator.generateBundle()`** erwartet:
```typescript
{
  targetType: 'bundle',
  bundle: Bundle,         // title, itemIds, rationale, status, ...
  bundleItems: InventoryItem[],  // die tatsächlichen Items
  suggestedPriceCents?: number,  // optionaler Gesamtpreis
  minimumPriceCents?: number,
  platform: 'kleinanzeigen',
}
```

---

## Ziel

Bundle-Listings bekommen realistische Preise aus den Item-Empfehlungen, und der
Generator nutzt die vollständigen Item-Daten für einen besseren Beschreibungstext.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts    ERWEITERN
```

Keine Änderung an `packages/listings` nötig — `TemplateListingGenerator` und
`generateBundle()` unterstützen alles bereits.

---

## Implementierungsdetails

### `bundles/[bid]/listing/route.ts`

**Schritt 1 — Import anpassen:**
```typescript
import { TemplateListingGenerator } from '@itemflow/listings'
// generateListingDraft entfernen
```

**Schritt 2 — Bundle-Items laden:**
```typescript
const bundleItems =
  bundle.itemIds.length > 0
    ? await prisma.inventoryItem.findMany({
        where: { id: { in: bundle.itemIds }, projectId },
        select: {
          id: true, projectId: true, title: true, category: true,
          brand: true, model: true, condition: true, quantity: true,
          description: true, defects: true, completeness: true,
          sourceCandidateIds: true, status: true, createdAt: true, updatedAt: true,
        },
      })
    : []
```

**Schritt 3 — Empfehlungen der Bundle-Items laden und Preise summieren:**
```typescript
const recommendations = bundleItems.length > 0
  ? await prisma.recommendation.findMany({
      where: { targetType: 'item', targetId: { in: bundleItems.map((i) => i.id) } },
      orderBy: { createdAt: 'desc' },
      select: { targetId: true, expectedPriceCents: true, minimumPriceCents: true },
    })
  : []

// Neueste Empfehlung pro Item
const latestByItem = new Map<string, { expectedPriceCents: number | null; minimumPriceCents: number | null }>()
for (const rec of recommendations) {
  if (!latestByItem.has(rec.targetId)) {
    latestByItem.set(rec.targetId, rec)
  }
}

const suggestedPriceCents = recommendations.length > 0
  ? [...latestByItem.values()].reduce((sum, r) => sum + (r.expectedPriceCents ?? 0), 0)
  : undefined

const minimumPriceCents = recommendations.length > 0
  ? [...latestByItem.values()].reduce((sum, r) => sum + (r.minimumPriceCents ?? 0), 0)
  : undefined
```

**Schritt 4 — `TemplateListingGenerator` verwenden:**
```typescript
const generator = new TemplateListingGenerator()
const raw = await generator.generate({
  targetType: 'bundle',
  bundle,          // Prisma-Objekt passt zum Bundle-Typ aus @itemflow/shared
  bundleItems,
  platform: 'kleinanzeigen',
  suggestedPriceCents: suggestedPriceCents ?? undefined,
  minimumPriceCents: minimumPriceCents ?? undefined,
})
const generated = GeneratedListingSchema.parse(raw)
```

**Schritt 5 — Transaktion bleibt unverändert** (listingDraft.create + bundle.update).

---

## Akzeptanzkriterien

- [ ] Bundle-Listings nutzen `TemplateListingGenerator` statt `generateListingDraft()`
- [ ] Bundle-Items werden aus DB geladen und an Generator übergeben
- [ ] Preis = Summe der `expectedPriceCents` der neuesten Item-Empfehlungen
- [ ] Mindestpreis = Summe der `minimumPriceCents` der neuesten Item-Empfehlungen
- [ ] Wenn keine Empfehlungen vorhanden: Fallback auf Generator-Default (500 ct)
- [ ] `GeneratedListingSchema.parse()` validiert die Ausgabe
- [ ] Atomare Transaktion bleibt erhalten
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-025 (Bundle API) — merged ✓
- IF-004 / IF-015 (TemplateListingGenerator) — merged ✓
- IF-011 (Scoring API — Recommendations) — merged ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Eigene Recommendation für Bundles (separates Scoring-Feature)
- Preislogik für Item-Listings ändern (bereits korrekt)

---

## Referenzen

Review: REVIEW-IF-031 (nach Implementierung)
