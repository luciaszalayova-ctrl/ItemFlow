# IF-015-listings-export-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listings-Export-API implementieren — `POST /api/projects/[id]/listings/export` gibt alle
`reviewed`-Listings eines Projekts als strukturiertes JSON zurück, setzt ihren Status
auf `exported` und schreibt je einen `MarketplaceActionLog`-Eintrag.

---

## Kontext

- `ListingDraft`-Modell + `ListingStatus`: `packages/db/prisma/schema.prisma`
- `MarketplaceActionLog`-Modell: `packages/db/prisma/schema.prisma`
- Auth/Session-Pattern: wie in IF-012 bis IF-014
- Designprinzip: Niemals automatisch veröffentlichen — Export ist der letzte
  automatisierte Schritt; Nutzer lädt manuell hoch

---

## Ziel

Nach diesem Ticket kann ein Nutzer alle freigegebenen Listings als JSON-Payload
abrufen und für den manuellen Kleinanzeigen-Upload verwenden.
Das schließt die MVP-Backend-Pipeline ab:
Upload → Candidates → Items → Score → Listing → Approve → **Export**

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/listings/export/route.ts   NEU — POST
```

---

## Implementierungsdetails

### `POST /api/projects/[id]/listings/export`

Kein Request-Body — exportiert immer alle `reviewed`-Listings des Projekts.

```typescript
// 1. Auth + Ownership via Projekt (gleicher Ansatz wie IF-012 bis IF-014)

// 2. Alle 'reviewed' Listings laden
const listings = await prisma.listingDraft.findMany({
  where: { projectId, status: 'reviewed' },
  orderBy: { createdAt: 'asc' },
})

// 3. Leere Antwort wenn keine reviewed Listings vorhanden
if (listings.length === 0) {
  return Response.json({ exported: [], count: 0 })
}

// 4. Status + ActionLog atomar in einer Transaction
await prisma.$transaction(async (tx) => {
  await tx.listingDraft.updateMany({
    where: {
      id: { in: listings.map(l => l.id) },
    },
    data: { status: 'exported' },
  })

  await tx.marketplaceActionLog.createMany({
    data: listings.map(l => ({
      listingDraftId: l.id,
      marketplace: l.platform,
      actionType: 'export',
      status: 'completed',
    })),
  })
})

// 5. Listings als Export-Payload zurückgeben
return Response.json({
  exported: listings.map(l => ({
    id: l.id,
    platform: l.platform,
    title: l.title,
    description: l.description,
    priceCents: l.priceCents,
    minimumPriceCents: l.minimumPriceCents,
    category: l.category,
    pickupOnly: l.pickupOnly,
    shippingMode: l.shippingMode,
    photoAssetIds: l.photoAssetIds,
  })),
  count: listings.length,
})
```

---

## Akzeptanzkriterien

- [ ] `POST .../export` gibt alle `reviewed`-Listings zurück
- [ ] Exportierte Listings haben danach Status `exported`
- [ ] Je ein `MarketplaceActionLog`-Eintrag pro exportiertem Listing
- [ ] Status-Update + ActionLog-Create atomar in `prisma.$transaction()`
- [ ] Leere Response (`exported: [], count: 0`) wenn keine `reviewed`-Listings
- [ ] `403` bei fremdem Projekt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Kein Request-Body — immer alle `reviewed`-Listings exportieren
- `exported`-Listings werden bei erneutem Aufruf nicht nochmals exportiert
  (da `where: { status: 'reviewed' }` sie nicht mehr erfasst)
- Kein Re-Export über diese Route
- Keine automatische Veröffentlichung — Export ist der letzte automatisierte Schritt

---

## Abhängigkeiten

- IF-014 (Listing Approve) — Listings müssen `reviewed` sein
- IF-013 (Listings CRUD) — Listings müssen existieren

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- CSV-Export
- Selektiver Export einzelner Listings
- Playwright-Prefill (eigenes Ticket, `packages/automation`)
- Kleinanzeigen-API-Integration

---

## Referenzen

Review: REVIEW-IF-015 (nach Implementierung)
