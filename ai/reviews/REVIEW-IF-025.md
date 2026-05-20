# REVIEW-IF-025

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-025-bundles-api`  
Commit: `bb53c2a`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-025-bundles-api.md`

Geänderte Dateien:
- `packages/shared/src/schemas/bundle.ts` (erweitert)
- `apps/api/app/api/projects/[id]/bundles/route.ts` (neu)
- `apps/api/app/api/projects/[id]/bundles/[bid]/route.ts` (neu)
- `apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `orderBy: { createdAt: 'asc' }` im GET /bundles**

Stabile, deterministische Reihenfolge in der Bundle-Liste — Ticket-Spec hatte keine
Sortierung vorgegeben. ✓

**2. 400-Response bei ungültigem `?status`-Filter**

```typescript
const parsedStatus = BundleStatusSchema.safeParse(rawStatusFilter)
if (!parsedStatus.success) {
  return Response.json({ error: 'Invalid status' }, { status: 400 })
}
```

Ticket-Spec: ungültige Status-Werte ignorieren oder alle zurückgeben. Codex lehnt
sie mit 400 ab — sauberer für API-Clients. ✓

**3. Reihenfolge der Vorbedingungen in POST /bundles/[bid]/listing**

```typescript
if (bundle.status === 'listing_created') {
  return Response.json({ error: 'Listing bereits erstellt.' }, { status: 409 })
}
if (bundle.status !== 'accepted') {
  return Response.json({ error: 'Bundle ist nicht für Listing-Erstellung freigegeben.' }, { status: 409 })
}
```

Spezifischere Fehlermeldung für den `listing_created`-Fall — Nutzer weiß genau warum
die Aktion nicht erlaubt ist. ✓

**4. `bundleSelect` als wiederverwendbare Konstante**

```typescript
const bundleSelect = {
  id: true, title: true, itemIds: true, rationale: true, status: true, createdAt: true,
} as const
```

In beiden Route-Dateien konsistent — kein Drift zwischen GET- und PATCH-Responses. ✓

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session — kein Leak aus Request-Body ✓
- [x] Ownership-Check auf allen 5 Routen (project.userId === session.user.userId) ✓
- [x] `findFirst({ where: { id: bid, projectId } })` — Bundle-ID allein reicht nicht ✓
- [x] Deleted-Project-Guard (`project.status === 'deleted'`) auf allen Routen ✓
- [x] Allowlist für Item-Status bei Bundle-Erstellung ✓
- [x] Allowlist für Bundle-Status-Änderung (nur von `suggested`) ✓
- [x] `GeneratedListingSchema.parse(raw)` — KI-Ausgabe validiert vor Persistierung ✓
- [x] `prisma.$transaction()` — atomares Bundle+Listing-Erstellen ✓

---

## Kleinere Beobachtungen (keine Blocker)

**Doppelte Validierung in POST /bundles/[bid]/listing:**

```typescript
const raw = await generateListingDraft({ ... })
const generated = GeneratedListingSchema.parse(raw)  // ← redundant
```

`generateListingDraft()` validiert bereits intern mit `GeneratedListingSchema.parse()`.
Die zweite Validierung ist technisch redundant — aber defensiv und schadet nicht.
Bei der Claude-Integration (IF-030) wird diese Zeile sinnvoll, da der Generator
dann extern ist. Kein Handlungsbedarf.

---

## Akzeptanzkriterien

- [x] `POST /api/projects/[id]/bundles` — erstellt Bundle, validiert itemIds ✓
- [x] `GET /api/projects/[id]/bundles` — listet Bundles, optionaler Status-Filter ✓
- [x] `GET /api/projects/[id]/bundles/[bid]` — einzelnes Bundle ✓
- [x] `PATCH /api/projects/[id]/bundles/[bid]` — accept/reject, nur von `suggested` ✓
- [x] `POST /api/projects/[id]/bundles/[bid]/listing` — Listing für `accepted` Bundle, atomare Transaktion ✓
- [x] `CreateBundleSchema`, `UpdateBundleSchema` in `@itemflow/shared` exportiert ✓
- [x] Ownership-Checks auf allen Routen ✓
- [x] KI-Ausgabe mit `GeneratedListingSchema` validiert ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere, konsistente Implementierung. Alle Sicherheits- und
Validierungs-Anforderungen aus CLAUDE.md eingehalten. Besonders positiv:
`bundleSelect`-Konstante vermeidet Drift, und die differenzierten 409-Meldungen
helfen dem Frontend bei der Fehlerdarstellung.
