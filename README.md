# ItemFlow

ItemFlow ist ein Monorepo fuer einen AI Resale Assistant. Dieses erste Setup enthaelt nur die Projektstruktur und Toolchain, noch keine Business-Logik.

## Voraussetzungen

- Node.js 20 oder neuer
- pnpm 10 oder neuer

## pnpm installieren

Falls `pnpm` nicht gefunden wird:

```bash
# Option A — corepack (in Node.js 16.9+ enthalten, empfohlen)
corepack enable
corepack prepare pnpm@10 --activate

# Option B — global via npm
npm install -g pnpm@10
```

## Lokales Setup

1. Abhaengigkeiten installieren:

   ```bash
   pnpm install
   ```

2. Umgebungsvariablen vorbereiten:

   ```bash
   cp .env.example .env
   ```

3. Datenbank starten und migrieren:

   ```bash
   docker compose up -d
   pnpm db:migrate
   ```

4. Entwicklungsserver starten:

   ```bash
   pnpm dev
   ```

`apps/api` startet auf `http://localhost:3001`.

## Wichtige Befehle

```bash
# Entwicklung
pnpm dev              # API-Dev-Server starten
pnpm build            # Alle Packages bauen

# Qualitaet
pnpm typecheck        # TypeScript pruefen (alle Packages)
pnpm lint             # ESLint (alle Packages)
pnpm test             # Tests (alle Packages)
pnpm format           # Prettier (gesamtes Repo)

# Datenbank
pnpm db:migrate       # Prisma-Migrationen ausfuehren
pnpm db:seed          # Datenbank mit Testdaten befuellen

# Infrastruktur
docker compose up -d  # PostgreSQL lokal starten
docker compose down   # Stoppen
```

## Struktur

```text
apps/
  web
  api
packages/
  shared
  db
  vision
  scoring
  listings
  testing
```

