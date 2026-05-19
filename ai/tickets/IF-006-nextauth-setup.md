# IF-006-nextauth-setup

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Claude Code** (sicherheitsrelevant — Auth, Session-Handling, Zugriffsregeln)  
Status: `done`

---

## Zusammenfassung

NextAuth (Auth.js v5) in `apps/api` einrichten — Email/Passwort-Login für den MVP.
Nur der eigene Nutzer sieht seine Projekte. Voraussetzung für alle geschützten API-Routen.

---

## Kontext

- App: `apps/api` (Next.js 14 App Router)
- DB-Modell: `User` in `packages/db/prisma/schema.prisma`
- Sicherheitsregel (AGENTS.md): Auth-Entscheidungen NICHT durch Codex, immer Claude Code
- Ziel: Einfachster sicherer Auth-Mechanismus für MVP — kein OAuth nötig

---

## Ziel

Nach diesem Ticket kann sich ein Nutzer mit Email und Passwort einloggen. Alle
API-Routen können die aktive Session prüfen und die `userId` daraus lesen.
Kein ungeschützter Zugriff auf fremde Projektdaten möglich.

---

## Betroffene Dateien

```
apps/api/auth.ts                     NEU — Auth.js Konfiguration
apps/api/app/api/auth/[...nextauth]/route.ts  NEU — Route Handler
apps/api/middleware.ts               NEU — Schutz aller /api/* Routen
apps/api/package.json                next-auth, bcryptjs, @auth/prisma-adapter
packages/db/package.json             @auth/prisma-adapter
.env.example                         AUTH_SECRET, AUTH_URL ergänzen
```

---

## Implementierungsdetails

### Auth-Strategie

**Credentials Provider** (Email + gehashtes Passwort):
- Passwort-Hash: `bcryptjs` (keine native `crypto` bcrypt-Variante nötig im MVP)
- Kein OAuth für MVP — reduziert externe Abhängigkeiten
- Session-Strategie: `jwt` (kein Datenbank-Session-Store nötig im MVP)

### Prisma User-Modell anpassen

Das bestehende `User`-Modell in `schema.prisma` braucht ein `passwordHash`-Feld:
```prisma
model User {
  ...
  passwordHash String?   // null für OAuth-User (zukünftig)
}
```
→ Neue Migration `prisma migrate dev --name add-password-hash`

### Session-Inhalt

JWT enthält: `userId`, `email` — kein Name nötig im MVP.

API-Routen lesen Session via:
```typescript
import { auth } from '@/auth'
const session = await auth()
if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
const { userId } = session.user
```

### Middleware

`apps/api/middleware.ts` schützt alle `/api/` Routen außer `/api/auth/*`:
```typescript
export { auth as middleware } from '@/auth'
export const config = { matcher: ['/api/((?!auth).*)'] }
```

### Umgebungsvariablen

```
AUTH_SECRET=<zufälliger 32-Byte-Wert>   # openssl rand -base64 32
AUTH_URL=http://localhost:3001
```

### Dev-Nutzer

Kein automatischer Dev-Nutzer im Auth-Setup selbst.
Der Seed aus IF-005 erhält nach diesem Ticket ein `passwordHash`-Feld:
`bcryptjs.hashSync('dev-password', 10)` → wird in IF-005 ergänzt oder separat gepatcht.

---

## Akzeptanzkriterien

- [ ] POST `/api/auth/signin` mit korrekten Credentials gibt Session zurück
- [ ] GET `/api/projects` ohne Session gibt `401` zurück
- [ ] `passwordHash` niemals in API-Responses serialisiert
- [ ] `AUTH_SECRET` in `.env.example` dokumentiert, niemals committed
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Sicherheits-Anforderungen (nicht verhandelbar)

- Passwörter ausschließlich mit `bcryptjs` (min. 10 Rounds) hashen — kein Klartext, kein MD5/SHA
- `AUTH_SECRET` mindestens 32 Bytes, nur via Umgebungsvariable
- `passwordHash`-Feld niemals in `select` für API-Responses einschließen
- Session-Cookies: `httpOnly`, `secure` in Produktion (Auth.js Default)
- Kein Dev-Bypass der Auth-Middleware (`if (process.env.NODE_ENV === 'development') skip`)

---

## Rahmenbedingungen

- Auth.js (next-auth v5) — nicht v4
- Prisma Adapter für User-Persistenz
- Keine OAuth-Provider im MVP
- Kein direktes Datenbankschema-Änderungs-Recht für Codex (daher Claude Code Task)

---

## Abhängigkeiten

- IF-005 (Prisma migrate) muss vorher laufen — braucht laufende DB

---

## Referenzen

Sicherheitsregel: `AGENTS.md` → Sicherheitsregeln für Agenten → "Authentifizierung"  
Review: REVIEW-IF-006 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Registrierungs-UI
- OAuth (Google, GitHub) — Phase 2
- Passwort-Reset-Flow
- Rollen / Berechtigungen
- Rate-Limiting
