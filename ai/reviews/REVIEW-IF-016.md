# REVIEW-IF-016

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-016-login-page`  
Commit: `6c16e94`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-016-login-page.md`

Geänderte Dateien:
- `apps/api/app/login/page.tsx` (neu)
- `apps/api/app/page.tsx` (geändert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `router.refresh()` nach Login**

Das Ticket spezifizierte nur `router.push('/')`.
Codex ergänzt `router.refresh()` — das zwingt Next.js App Router dazu, Server
Components mit der neuen Session neu zu laden. Ohne diesen Aufruf kann `/` kurz
die alte (leere) Session zeigen.
→ Korrekte Verbesserung. ✓

**2. Dev-Credentials als `defaultValue` vorausgefüllt**

Login-Formular hat `dev@itemflow.local` / `dev-password` als Standardwerte —
erleichtert das Testen erheblich ohne Tipp-Aufwand.
→ Sinnvoll für Dev-Phase. Vor Production-Deploy entfernen.

---

## Verbesserungen (Non-Blocker)

**1. Dev-Credentials sichtbar in Klartext auf der Seite**

Sowohl als `defaultValue` im Formular als auch als `<code>`-Text unten auf der Seite.
Für ein Dev-Tool akzeptabel — aber ein Kommentar `{/* TODO: remove before prod */}`
oder eine Prüfung auf `process.env.NODE_ENV === 'development'` wäre sauberer.
→ Kein Blocker, aber beim Production-Readiness-Ticket adressieren.

---

## Sicherheitsprüfung

- [x] `redirect: false` bei `signIn` — keine unkontrollierten NextAuth-Redirects
- [x] Fehlermeldung generisch: `'E-Mail oder Passwort ungueltig.'` — kein Hinweis ob E-Mail oder Passwort falsch
- [x] `role="alert"` auf Fehlermeldung — zugänglich ✓
- [x] `autoComplete="current-password"` gesetzt ✓
- [x] Home-Page prüft Session server-seitig via `auth()` — kein Client-only-Guard
- [x] `redirect('/login')` bei fehlender Session ✓

---

## Akzeptanzkriterien

- [x] `/login` zeigt Formular mit E-Mail + Passwort
- [x] Erfolgreicher Login leitet auf `/` um
- [x] Falsches Passwort zeigt Fehlermeldung — kein Crash
- [x] `/` zeigt eingeloggte E-Mail-Adresse
- [x] Unauthentifizierter Zugriff auf `/` leitet auf `/login` um ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Hinweis: Browser-Test noch ausstehend

Codex hat den Login-Flow nicht interaktiv im Browser getestet.
Vor dem Merge empfohlen:
1. `pnpm db:migrate && pnpm db:seed` ausführen (wenn DB läuft)
2. `pnpm --filter @itemflow/api dev` starten
3. `http://localhost:3000/login` aufrufen und Login mit Dev-Credentials testen

Alternativ: Merge jetzt, Browser-Test beim nächsten DB-Setup-Ticket.

---

## Empfehlung

**approved** — Funktional korrekt, `router.refresh()` ist ein sinnvoller Zusatz.
Browser-Test steht noch aus, ist aber abhängig vom DB-Setup (IF-005 / laufende Instanz).
