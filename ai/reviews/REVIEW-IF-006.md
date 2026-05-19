# REVIEW-IF-006

Datum: 2026-05-19  
Reviewer: Claude Code  
Branch: `feature/IF-006-nextauth-setup`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-006-nextauth-setup.md`

Geänderte Dateien:
- `apps/api/auth.ts` (neu)
- `apps/api/app/api/auth/[...nextauth]/route.ts` (neu)
- `apps/api/middleware.ts` (neu)
- `apps/api/package.json` (next-auth, bcryptjs ergänzt)
- `apps/api/tsconfig.json` (@/* Alias + db-reference)
- `packages/db/prisma/schema.prisma` (passwordHash ergänzt)
- `packages/db/tsconfig.json` (composite: true)
- `.env.example` (AUTH_SECRET, AUTH_URL)
- `pnpm-lock.yaml`

---

## Kritische Probleme (Blocker)

Keine.

---

## Verbesserungen (Non-Blocker)

**1. `@auth/prisma-adapter` nicht eingebunden**

Ticket sah den Prisma Adapter vor, implementiert wurde bewusst ohne ihn —
JWT-Sessions + Credentials brauchen keinen DB-Session-Store.
Spart Komplexität im MVP. Prisma Adapter wird relevant wenn OAuth (Phase 2) kommt.

**2. `pages.signIn: '/login'` ohne existierende Seite**

NextAuth redirectet bei unauthentifiziertem Zugriff auf `/login`, die Seite
existiert noch nicht. Betrifft nur Browser-Redirects, API-Routen geben korrekt
`401` zurück. Login-UI ist separates Ticket.

**3. `tsconfig.tsbuildinfo` landet im Diff**

Build-Artefakt wird im Working Tree geändert. Sollte in `.gitignore` stehen —
wird in den Commit-Befehlen explizit ausgelassen.

---

## Sicherheitsprüfung

- [x] Passwort-Hashing: `bcryptjs.compare()` — kein Klartext, kein MD5/SHA
- [x] `passwordHash` nur in `select: { passwordHash: true }` gelesen, nie in Response
- [x] `AUTH_SECRET` nur via Umgebungsvariable, in `.env.example` dokumentiert
- [x] Kein Dev-Bypass der Middleware
- [x] Session-Strategie `jwt` — kein DB-Session-Store, kein Session-Fixation-Risiko
- [x] Middleware schützt alle `/api/*` außer `/api/auth/*` korrekt
- [x] Kein OAuth-Redirect ohne Nutzer-Aktion möglich

---

## Architektur

- [x] Auth.js v5 (beta.31) — nicht v4
- [x] `VisionProvider`-Interface unverändert (nicht betroffen)
- [x] `packages/db/tsconfig.json`: `composite: true` ergänzt — konsistent mit anderen Packages
- [x] `@/*`-Path-Alias in `apps/api/tsconfig.json` korrekt auf `apps/api/*` relativ zu Projekt-Root
- [x] `packages/db` als TypeScript-Project-Reference in `apps/api/tsconfig.json`
- [x] `pnpm typecheck` grün (apps/api)
- [x] `pnpm lint` grün (apps/api)

---

## Abhängigkeiten für Betrieb

Bevor Auth getestet werden kann:
1. `pnpm db:migrate` — bringt `passwordHash`-Feld in die DB (IF-005)
2. IF-005 Seed muss `passwordHash: bcryptjs.hashSync('dev-password', 10)` für dev@itemflow.local setzen
3. `.env` anlegen mit `AUTH_SECRET` und `DATABASE_URL`

---

## Empfehlung

**approved** — Implementierung ist korrekt und sicher.
Alle Sicherheits-Anforderungen aus dem Ticket erfüllt.
