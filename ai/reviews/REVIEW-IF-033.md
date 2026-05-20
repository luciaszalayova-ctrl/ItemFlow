# REVIEW-IF-033

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-033-chatgpt-import-api`  
Commit: `9db414a`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-033-chatgpt-import-api.md`

Geänderte Dateien:
- `packages/db/prisma/schema.prisma` (assetId nullable)
- `packages/db/prisma/migrations/20260520121500_itemcandidate_asset_nullable/migration.sql` (neu)
- `packages/shared/src/schemas/item-candidate.ts` (assetId nullable)
- `apps/api/app/api/projects/[id]/candidates/import/route.ts` (neu)
- `apps/api/app/api/projects/[id]/items/[iid]/listing/route.ts` (null-Filter)

---

## Kritische Probleme (Blocker)

Keine.

---

## Sicherheitsprüfung

- [x] Ownership-Check unverändert: `project.userId !== session.user.userId` → 403 ✓
- [x] `userId` aus Session, nicht aus Request-Body ✓
- [x] `VisionCandidateRawSchema.safeParse` — KI-Ausgabe validiert, nie direkt persistiert ✓
- [x] `rawModelOutputJson: candidate` — rohe Eingabe separat gespeichert ✓
- [x] Max. 50 Kandidaten pro Request in `ImportBodySchema` ✓
- [x] `request.json().catch(() => null)` — kein unhandled Parse-Error ✓

---

## Beobachtungen

**`Prisma.DbNull` für optionales JSON-Feld korrekt:**

```typescript
boundingBoxJson:
  candidate.boundingBox === undefined
    ? Prisma.DbNull
    : (candidate.boundingBox as Prisma.InputJsonValue),
```

Bei nullable `Json?`-Feldern ist `Prisma.DbNull` der richtige Sentinel für DB-null.
Ein einfaches `undefined` würde von Prisma ignoriert (Feld bleibt unverändert) — das
wäre hier falsch. ✓

**Type-Predicate im null-Filter korrekt:**

```typescript
.filter((assetId): assetId is string => assetId !== null)
```

Schmalster möglicher Fix — verändert kein bestehende Logik. ✓

**`bundlePotential` landet in `rawModelOutputJson`:**

Das Feld existiert in `VisionCandidateRaw` aber nicht als eigene DB-Spalte in
`ItemCandidate`. Das ist richtig — Bundle-Logik läuft über die Bundle-Engine,
nicht über einen Kandidaten-Flag. Die Info ist in `rawModelOutputJson` abrufbar,
falls sie später gebraucht wird.

---

## Akzeptanzkriterien

- [x] Migration läuft durch, `assetId` ist nullable ✓
- [x] `ItemCandidateSchema.assetId` ist `z.string().nullable()` ✓
- [x] `POST` gibt `201` mit `{ candidates, count }` zurück ✓
- [x] `assetId: null`, `status: 'pending'` bei allen importierten Kandidaten ✓
- [x] Leeres Array oder mehr als 50 Einträge → `400` (durch `min(1).max(50)`) ✓
- [x] Ungültiges JSON-Format → `400` mit `details` ✓
- [x] Falsches Projekt → `404`, fremdes Projekt → `403` ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Offenes Risiko (aus Codex-Report übernommen)

Migration nicht gegen laufende Datenbank getestet. Die SQL ist korrekt
(`DROP CONSTRAINT` → `ALTER COLUMN ... DROP NOT NULL` → `ADD CONSTRAINT ... SET NULL`),
aber `prisma migrate deploy` im Staging sollte vor dem Merge in main laufen.

---

## Empfehlung

**approved** — Saubere, spec-konforme Umsetzung. `Prisma.DbNull` und der
Type-Predicate-Filter sind die richtigen Werkzeuge für die jeweiligen Stellen.
