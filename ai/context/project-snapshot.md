# Projekt-Snapshot

Letzte Aktualisierung: 2026-05-19  
Erstellt von: Claude Code

---

## Was das Projekt ist

ItemFlow — AI Resale Assistant für Haushalts-Entrümpelung.
Nutzer laden Fotos hoch → System erkennt Items → Scoring → Listing-Entwürfe → Export.
Niemals automatisch veröffentlichen. Human-in-the-loop.

Ziel: erwarteter Nettowert, nicht maximaler Bruttopreis.

---

## Aktueller Stand

### Phase: 1 — MVP-Aufbau (kein Code vollständig fertig)

Was existiert:
- Monorepo-Scaffold (pnpm workspaces, alle Packages)
- Zod-Schemas für alle Domain-Objekte (`packages/shared/src/schemas/`)
- Prisma-Schema (`packages/db/prisma/schema.prisma`)
- Provider-Interfaces: VisionProvider, ScoringEngine, ListingGenerator
- Keine implementierten Features, kein laufendes UI

Was fehlt (P1-Priorität):
- StorageProvider-Implementierung (LocalFS)
- MockVisionProvider
- Scoring-Engine-Implementierung
- MockListingGenerator
- API-Routen (Projekte, Assets, Kandidaten, Items, Listings)
- Review-UI
- Auth (NextAuth)

---

## Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Next.js 14 App Router, TypeScript |
| API | Next.js API Routes |
| Datenbank | PostgreSQL + Prisma |
| Validierung | Zod |
| Monorepo | pnpm workspaces |
| Auth | NextAuth (noch nicht implementiert) |
| Storage Dev | LocalFileSystem (noch nicht implementiert) |
| Storage Prod | TBD (F5b offen — Cloudflare R2 / S3 / Supabase) |
| Deployment | Vercel + managed Postgres |
| Sprache/Markt | Deutsch, Kleinanzeigen-First |

---

## Getroffene Entscheidungen

| ID | Entscheidung | Datei |
|----|-------------|-------|
| ADR-001 | Human-in-the-loop Marketplace-Automation | `docs/DECISIONS.md` |
| DECISION-001 | StorageProvider-Interface mit LocalFS für Dev | `ai/decisions/DECISION-001-storage-provider.md` |
| DECISION-002 | TypeScript Project References für Cross-Package-Imports | `ai/decisions/DECISION-002-ts-project-references.md` |
| F4 | Auth: NextAuth | `docs/BACKLOG.md` |
| F6 | Deployment: Vercel + managed Postgres | `docs/BACKLOG.md` |
| F7 | Markt: Deutsch, Kleinanzeigen-First | `docs/BACKLOG.md` |

---

## Offene Fragen / Blocker

| ID | Frage | Auswirkung |
|----|-------|------------|
| F1 | Monorepo-Tooling: pnpm-only oder + Turborepo? | Build-Performance, kein Blocker |
| F2 | Vision-AI-Provider: Claude / GPT-4o / Gemini? | Phase 2, kein MVP-Blocker |
| F3 | Listing-Generator-Provider | Phase 2, kein MVP-Blocker |
| F5b | Image-Storage Prod: R2 / S3 / Supabase? | **Blocker vor erstem Vercel-Deploy** |
| F8 | Marketplaces im MVP: nur KA oder auch eBay/Vinted? | Listing-Templates |
| F9 | Scoring-Schwellen kalibriert? | Warten auf Phase 0 |
| F11 | UI-Library: shadcn/ui + Tailwind? | Frontend-Setup |
| F12 | Mobile-Browser-Support? | Frontend |

---

## Wichtige Dateipfade

| Zweck | Pfad |
|-------|------|
| Domain-Schemas | `packages/shared/src/schemas/` |
| Prisma-Schema | `packages/db/prisma/schema.prisma` |
| VisionProvider | `packages/vision/src/index.ts` |
| ScoringEngine | `packages/scoring/src/index.ts` |
| ListingGenerator | `packages/listings/src/index.ts` |
| Backlog | `docs/BACKLOG.md` |
| Scoring-Logik | `docs/SCORING_MODEL.md` |
| Listing-Regeln | `docs/LISTING_GENERATION.md` |
| Sicherheit | `docs/SECURITY_AND_PRIVACY.md` |

---

## Sicherheitsregeln (Kurzfassung)

- Keine KI-Outputs ohne Zod-Validierung persistieren
- Niemals automatisch auf Marktplätzen veröffentlichen
- Nutzerfotos als sensible Daten behandeln
- Keine Credentials im Code oder Repo
- Löschung aller Nutzerdaten ermöglichen
