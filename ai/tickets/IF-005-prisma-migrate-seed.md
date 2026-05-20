# IF-005-prisma-migrate-seed

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Prisma-Migration einrichten und ein Dev-Seed-Skript erstellen, das eine lokale
PostgreSQL-Datenbank mit realistischen Testdaten befüllt. Voraussetzung für alle
API-Routen und manuelles Testen der Pipeline ohne Produktionsdaten.

---

## Kontext

- Prisma-Schema: `packages/db/prisma/schema.prisma` (9 Modelle, vollständig definiert)
- Prisma-Client: `packages/db/src/index.ts`
- Datenbankverbindung: `DATABASE_URL` in `.env` (nicht commiten)
- `.env.example` bereits vorhanden

---

## Ziel

Nach diesem Ticket kann ein Entwickler mit `pnpm db:migrate` das Schema in eine
lokale PostgreSQL-Datenbank deployen und mit `pnpm db:seed` realistische Testdaten
laden, die alle Pipeline-Stufen abdecken.

---

## Betroffene Dateien

```
packages/db/prisma/migrations/   NEU (von prisma migrate dev erzeugt)
packages/db/prisma/seed.ts        NEU
packages/db/package.json          scripts ergänzen
packages/db/tsconfig.json         seed.ts einschließen
.env.example                      DATABASE_URL ergänzen falls fehlt
```

---

## Implementierungsdetails

### Scripts in `packages/db/package.json`

```json
"migrate": "prisma migrate dev --name init",
"migrate:deploy": "prisma migrate deploy",
"seed": "tsx prisma/seed.ts",
"studio": "prisma studio"
```

Root `package.json` Scripts ergänzen (falls noch nicht vorhanden):
```json
"db:migrate": "pnpm --filter @itemflow/db migrate",
"db:seed": "pnpm --filter @itemflow/db seed"
```

### Dev-Dependencies in `packages/db/package.json`

```json
"tsx": "^4.0.0"
```

---

### Seed-Daten (`packages/db/prisma/seed.ts`)

**1 Testnutzer:**
```
email: dev@itemflow.local
```

**1 Projekt:** "Kellerwohnung aufräumen"

**6 Assets** (Dateinamen aus den Vision-Fixtures, keine echten Dateien):
```
kinderbuch-bundle.jpg
lego-paket.jpg
ikea-regal.jpg
bosch-akku.jpg
kabel-chaos.jpg
kindersitz.jpg
```
Werte: `storageKey = fileName`, `mimeType = "image/jpeg"`, `sizeBytes = 500000`

**6 ItemCandidates** (je ein Candidate pro Asset, Daten aus `FIXTURE_*` in `packages/testing/src/fixtures/vision.ts`):
- Kinderbuch: rawLabel, category: "books", confidence: 0.85, bundlePotential in attributesJson
- LEGO: rawLabel, category: "toys", confidence: 0.88, brand in attributesJson
- IKEA Regal: rawLabel, category: "furniture", confidence: 0.92
- Bosch Akku: rawLabel, category: "tools", confidence: 0.93
- Kabel: rawLabel, category: "electronics-accessories", confidence: 0.45, uncertaintyNotes in rawModelOutputJson
- Kindersitz: rawLabel, category: "baby-gear", confidence: 0.82, uncertaintyNotes in rawModelOutputJson

**3 InventoryItems** (accepted candidates):
- "Bosch Akkuschrauber mit Ladegeraet", category: "tools", brand: "Bosch", condition: "gut"
- "IKEA Kallax Regal", category: "furniture", brand: "IKEA", condition: "sehr gut"
- "Kindersitz", category: "Kindersitz", condition: "gut"

**Idempotenz:** Seed-Skript prüft ob `dev@itemflow.local` bereits existiert —
wenn ja, überspringen (kein Fehler, kein Duplikat).

---

## Akzeptanzkriterien

- [ ] `pnpm db:migrate` läuft durch und erzeugt `prisma/migrations/`
- [ ] `pnpm db:seed` legt Testdaten an ohne Fehler
- [ ] Zweimaliges `pnpm db:seed` wirft keinen Fehler (Idempotenz)
- [ ] `DATABASE_URL` in `.env.example` dokumentiert
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Keine echten Bilder, keine echten URLs — nur Platzhalter-Dateinamen
- `.env` niemals committen
- Prisma-Schema NICHT verändern
- `tsx` für Seed-Ausführung (kein kompilierter Build nötig)

---

## Referenzen

Offene Fragen: keine  
Review: REVIEW-IF-005 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Produktions-Migrationen oder CI-Migrate-Setup
- Test-Datenbank-Isolation (eigenes Ticket)
- Weitere Seed-Daten (Recommendations, ListingDrafts)
