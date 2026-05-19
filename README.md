# ItemFlow

ItemFlow ist ein Monorepo fuer einen AI Resale Assistant. Dieses erste Setup enthaelt nur die Projektstruktur und Toolchain, noch keine Business-Logik.

## Voraussetzungen

- Node.js 20 oder neuer
- pnpm 10 oder neuer

## Lokales Setup

1. Abhaengigkeiten installieren:

   ```bash
   pnpm install
   ```

2. Umgebungsvariablen vorbereiten:

   ```bash
   cp .env.example .env
   ```

3. Entwicklungsserver starten:

   ```bash
   pnpm dev
   ```

`apps/web` startet standardmaessig auf `http://localhost:3000`.  
`apps/api` startet standardmaessig auf `http://localhost:3001`.

## Wichtige Befehle

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
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

