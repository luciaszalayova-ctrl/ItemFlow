# Commands

## Setup

```bash
# Einmalig pro Rechner — danach funktioniert "pnpm" direkt ohne Prefix
corepack enable                        # pnpm-Shim im PATH registrieren
corepack prepare pnpm@10 --activate    # pnpm 10 als aktive Version setzen

pnpm install                           # Abhaengigkeiten installieren
cp .env.example .env                   # Umgebungsvariablen vorbereiten
```

---

## Entwicklung

```bash
pnpm dev          # API-Dev-Server starten (http://localhost:3001)
pnpm build        # Alle Packages bauen (inkl. prisma generate + tsc)
```

---

## Qualitaet

```bash
pnpm typecheck    # TypeScript pruefen (alle Packages)
pnpm lint         # ESLint (alle Packages)
pnpm test         # Tests (alle Packages)
pnpm format       # Prettier ueber gesamtes Repo
```

---

## Datenbank — lokal (Docker + Postgres)

```bash
docker compose up -d                             # Postgres-Container starten
docker compose down                              # Container stoppen
docker compose down -v                           # Container + Volumes loeschen (Reset)

pnpm db:migrate                                  # Migration ausfuehren (dotenv aus .env)
pnpm db:seed                                     # Testdaten einspielen

# Direkt im db-Package ausfuehren:
pnpm --filter @itemflow/db studio                # Prisma Studio oeffnen
pnpm --filter @itemflow/db prisma:generate       # Client neu generieren
```

---

## Datenbank — Neon (Produktion / Vercel)

```bash
# Prisma Client fuer alle Targets neu generieren (lokal ausfuehren, dann committen)
npx prisma generate --schema=packages/db/prisma/schema.prisma

# Migration auf Neon deployen — liest URLs aus .env.neon
pnpm --filter @itemflow/db migrate:deploy

# Prisma Studio gegen Neon oeffnen
pnpm --filter @itemflow/db studio:neon

# Benutzer auf Neon anlegen/aktualisieren
USER_EMAIL="..." USER_PASSWORD="..." pnpm --filter @itemflow/db create-user:neon

# Neuen Migrationsnamen vergeben (Entwicklung gegen Neon-Dev-Branch)
pnpm --filter @itemflow/db migrate
```

Neon-URLs in `.env` (lokal) bzw. Vercel Environment Variables (Produktion):

```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

`DATABASE_URL` = gepoolte URL (PgBouncer, fuer die App)
`DATABASE_URL_UNPOOLED` = direkte URL (fuer Prisma Migrate)

---

## Auth

```bash
# AUTH_SECRET generieren (einmalig, Wert in .env und Vercel setzen)
openssl rand -base64 32
```

---

## Einzelne Packages

```bash
pnpm --filter @itemflow/api dev          # Nur API starten
pnpm --filter @itemflow/api build        # Nur API bauen
pnpm --filter @itemflow/api typecheck    # Nur API pruefen
pnpm --filter @itemflow/db build         # DB-Package bauen (generate + tsc)
pnpm --filter @itemflow/db studio        # Prisma Studio
```

---

## Vercel

```bash
vercel env pull .env.local               # Vercel-Umgebungsvariablen lokal ziehen
vercel build                             # Build lokal wie Vercel simulieren
vercel deploy                            # Preview-Deploy
vercel deploy --prod                     # Produktions-Deploy
```
