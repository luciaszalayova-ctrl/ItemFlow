# IF-017-local-dev-setup

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Lokales Dev-Setup aufsetzen — `docker-compose.yml` mit PostgreSQL anlegen,
`.env.example` vervollständigen, `pnpm dev`-Skript im Root ergänzen.
Danach ist die App mit einem einzigen Befehl startbar und der erste Browser-Test möglich.

---

## Kontext

- `DATABASE_URL` in `.env.example`: `postgresql://postgres:postgres@localhost:5432/itemflow_dev`
- `AUTH_URL` in `.env.example`: `http://localhost:3001`
- Seed-Script: `pnpm db:seed` in `packages/db/package.json` (IF-005)
- API-App läuft auf Port 3001 (`apps/api`)
- `AUTH_SECRET` muss gesetzt sein — generieren mit `openssl rand -base64 32`

---

## Ziel

Nach diesem Ticket kann ein Entwickler mit drei Befehlen starten:

```bash
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Dann ist `http://localhost:3001` im Browser erreichbar und der Login-Flow testbar.

---

## Betroffene Dateien

```
docker-compose.yml          NEU — PostgreSQL-Container
.env.example                ÄNDERN — AUTH_SECRET Hinweis ergänzen
apps/api/package.json       ÄNDERN — dev-Script auf Port 3001 setzen
package.json                ÄNDERN — root dev-Script ergänzen
```

---

## Implementierungsdetails

### `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: itemflow_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### `apps/api/package.json` — dev-Script auf Port 3001

```json
"dev": "next dev --port 3001"
```

### Root `package.json` — dev-Script ergänzen

```json
"dev": "pnpm --filter @itemflow/api dev"
```

### `.env.example` — AUTH_SECRET Kommentar

```
# Generieren mit: openssl rand -base64 32
AUTH_SECRET=
```

Das ist bereits so — sicherstellen dass der Kommentar vorhanden ist.

### `.env` — nicht committen

Eine `.env`-Datei anlegen (nicht committen — ist in `.gitignore`):

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/itemflow_dev
AUTH_SECRET=<generierter Wert>
AUTH_URL=http://localhost:3001
STORAGE_PROVIDER=local
STORAGE_LOCAL_PATH=./uploads
```

**Wichtig:** `.env` darf nicht committed werden. Nur prüfen ob sie in `.gitignore` steht
— wenn nicht, ergänzen.

---

## Akzeptanzkriterien

- [ ] `docker compose up -d` startet PostgreSQL auf Port 5432
- [ ] `pnpm db:migrate` läuft fehlerfrei durch
- [ ] `pnpm db:seed` legt Dev-User + Beispieldaten an
- [ ] `pnpm dev` startet API auf `http://localhost:3001`
- [ ] Login mit `dev@itemflow.local` / `dev-password` funktioniert im Browser
- [ ] `/` zeigt eingeloggte E-Mail-Adresse
- [ ] `.env` ist in `.gitignore` eingetragen ✓ (bereits vorhanden — nur prüfen)
- [ ] `.env` wird nicht committed

---

## Rahmenbedingungen

- Kein Produktions-Setup — nur lokale Dev-Umgebung
- Kein Kubernetes, kein Helm, kein CI — minimal halten
- `AUTH_SECRET` muss ein echter Zufallswert sein — kein Platzhalter in `.env`
- Port 3001 für API (nicht 3000) — laut `AUTH_URL` in `.env.example`

---

## Abhängigkeiten

- IF-005 (Prisma Migrate + Seed) — merged ✓
- IF-006 (NextAuth) — merged ✓
- IF-016 (Login-Seite) — merged ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Production-Deployment (Vercel + managed Postgres)
- CI/CD-Pipeline
- Docker-Setup für `apps/web`
- Adminer oder pgAdmin

---

## Referenzen

Review: REVIEW-IF-017 (nach Implementierung)
