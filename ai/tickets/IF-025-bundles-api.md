# IF-025-bundles-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Bundle-API implementieren — Nutzer können Items mit niedrigem Einzelwert zu Paketen
bündeln. Das Prisma-Modell `Bundle` existiert bereits im Schema. Dieses Ticket fügt
die API-Routen, Zod-Schemas und die Listing-Generierung für Bundles hinzu.

---

## Kontext

Das Produkt optimiert auf den erwarteten Nettowert (CLAUDE.md). Ein Artikel für 2 €
lohnt sich oft nicht einzeln zu verkaufen — als Teil eines "Bücher-Pakets" schon.

**Vorhandenes Prisma-Modell:**
```prisma
model Bundle {
  id        String       @id @default(cuid())
  projectId String
  project   Project      @relation(...)
  title     String
  itemIds   String[]
  rationale String?
  status    BundleStatus @default(suggested)
  createdAt DateTime     @default(now())
}

enum BundleStatus {
  suggested
  accepted
  rejected
  listing_created
}
```

---

## Ziel

Nach diesem Ticket kann ein Nutzer manuell Bundles erstellen, Items zuordnen,
Bundles akzeptieren oder ablehnen, und für akzeptierte Bundles ein Listing generieren.

---

## Betroffene Dateien

```
packages/shared/src/schemas/bundle.ts                         NEU
packages/shared/src/index.ts                                  ERWEITERN
apps/api/app/api/projects/[id]/bundles/route.ts               NEU
apps/api/app/api/projects/[id]/bundles/[bid]/route.ts         NEU
apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts NEU
```

---

## Implementierungsdetails

### 1. `packages/shared/src/schemas/bundle.ts` — NEU

```typescript
import { z } from 'zod'

export const BundleStatusSchema = z.enum([
  'suggested',
  'accepted',
  'rejected',
  'listing_created',
])
export type BundleStatus = z.infer<typeof BundleStatusSchema>

export const BundleSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  itemIds: z.array(z.string()),
  rationale: z.string().nullable(),
  status: BundleStatusSchema,
  createdAt: z.coerce.date(),
})
export type Bundle = z.infer<typeof BundleSchema>

export const CreateBundleSchema = z.object({
  title: z.string().min(1).max(120),
  itemIds: z.array(z.string().cuid()).min(2),
  rationale: z.string().max(500).optional(),
})
export type CreateBundle = z.infer<typeof CreateBundleSchema>

export const UpdateBundleSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})
export type UpdateBundle = z.infer<typeof UpdateBundleSchema>
```

### 2. `packages/shared/src/index.ts` — ERWEITERN

Export hinzufügen:
```typescript
export * from './schemas/bundle.js'
```

### 3. `apps/api/app/api/projects/[id]/bundles/route.ts` — NEU

**`GET`** — Alle Bundles eines Projekts auflisten:
```typescript
// Response: { bundles: Bundle[] }
// Filter: ?status=accepted (optional) — ohne Filter alle zurückgeben
// Ownership-Check via project.userId === session.user.userId
// select: id, title, itemIds, rationale, status, createdAt
```

**`POST`** — Bundle erstellen (manuell, durch den Nutzer):
```typescript
// Body: CreateBundleSchema { title, itemIds (min 2), rationale? }
// Validierung: alle itemIds müssen zu Items des Projekts gehören
//   → prisma.inventoryItem.findMany({ where: { id: { in: itemIds }, projectId } })
//   → Fehler 422 wenn nicht alle gefunden
// Allowlist: Items mit status 'draft', 'ready_for_scoring', 'scored' dürfen gebündelt werden
//   → Status 'listing_created' oder 'handled' → 422 "Item bereits verarbeitet"
// Erstellen: prisma.bundle.create({ data: { projectId, title, itemIds, rationale, status: 'suggested' } })
// Response: { bundle: Bundle }
```

**Sicherheit:**
- `userId` ausschließlich aus Session
- Ownership: Project muss dem Session-User gehören und nicht `deleted` sein
- Kein Leak von anderen Projekten

### 4. `apps/api/app/api/projects/[id]/bundles/[bid]/route.ts` — NEU

**`GET`** — Einzelnes Bundle laden:
```typescript
// Response: { bundle: Bundle }
// 404 wenn nicht gefunden oder falsches Projekt
```

**`PATCH`** — Bundle-Status ändern (`accepted` oder `rejected`):
```typescript
// Body: UpdateBundleSchema { status: 'accepted' | 'rejected' }
// Allowlist: nur von 'suggested' aus erlaubt (409 sonst)
// Response: { bundle: Bundle }
```

### 5. `apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts` — NEU

**`POST`** — Listing-Entwurf für ein Bundle generieren:
```typescript
// Vorbedingung: bundle.status === 'accepted' — sonst 409
// Vorbedingung: bundle.status !== 'listing_created' — sonst 409

// Listing generieren:
// import { generateListingDraft } from '@itemflow/listings'
// Kontext für den Generator:
//   title: bundle.title
//   description: bundle.rationale ?? ''
//   condition: 'Verschiedene Zustände'
//   category: 'Paket'
// Response-Listing validieren mit GeneratedListingSchema (aus @itemflow/shared)

// Transaktion:
// prisma.$transaction([
//   prisma.listingDraft.create({
//     data: {
//       projectId,
//       targetType: 'bundle',
//       targetId: bundle.id,
//       platform: 'kleinanzeigen',
//       title: generated.title,
//       description: generated.description,
//       priceCents: generated.priceCents,
//       minimumPriceCents: generated.minimumPriceCents ?? null,
//       category: generated.category ?? null,
//       shippingMode: generated.shippingMode ?? null,
//       pickupOnly: generated.pickupOnly,
//       photoAssetIds: [],
//     },
//   }),
//   prisma.bundle.update({
//     where: { id: bundle.id },
//     data: { status: 'listing_created' },
//   }),
// ])

// Response: { listing: ListingDraft }
```

---

## Akzeptanzkriterien

- [ ] `POST /api/projects/[id]/bundles` — erstellt Bundle, validiert itemIds
- [ ] `GET /api/projects/[id]/bundles` — listet Bundles des Projekts
- [ ] `GET /api/projects/[id]/bundles/[bid]` — lädt einzelnes Bundle
- [ ] `PATCH /api/projects/[id]/bundles/[bid]` — accept/reject, nur von `suggested`
- [ ] `POST /api/projects/[id]/bundles/[bid]/listing` — generiert Listing für `accepted` Bundle
- [ ] `CreateBundleSchema` und `UpdateBundleSchema` in `@itemflow/shared` exportiert
- [ ] Ownership-Checks auf allen Routen
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Kein `userId` aus Request-Body — immer aus Session
- `prisma.$transaction()` für atomares Bundle+Listing-Erstellen
- Zod-Validierung aller AI-Ausgaben (GeneratedListingSchema) vor Persistierung
- Fehlerfall gibt generische Meldung + HTTP-Statuscode zurück

---

## Abhängigkeiten

- IF-004 (Listing-Generator) — merged ✓
- IF-012 (Listing-Generierungs-API für Items) — Muster für Bundle-Listing übernehmen
- IF-013 (Listings CRUD) — merged ✓
- Bundle-Modell im Prisma-Schema — bereits vorhanden ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- KI-basierte automatische Bundle-Vorschläge (Scoring-Engine schlägt Bundles vor)
- Bundle-UI (kommt in IF-026)
- Bundle-Items nachträglich bearbeiten (eigenes Ticket wenn nötig)
- CSV-Export von Bundle-Listings

---

## Referenzen

Review: REVIEW-IF-025 (nach Implementierung)
