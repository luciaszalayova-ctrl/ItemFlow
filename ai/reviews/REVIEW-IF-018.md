# REVIEW-IF-018

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-018-projects-ui`  
Commit: `d0cf46b`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-018-projects-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/page.tsx` (neu)
- `apps/api/app/projects/new/page.tsx` (neu)
- `apps/api/app/page.tsx` (geändert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. Differenzierte Fehlerbehandlung in `new/page.tsx`**

Das Ticket spezifizierte nur generische Fehlerbehandlung.
Codex unterscheidet zwischen `400` (Validierungsfehler), `401` (Session abgelaufen →
Redirect auf Login) und allgemeinen Fehlern.
→ Bessere UX, kein Scope-Creep. ✓

**2. `title.trim()` + `description.trim()`**

Whitespace-only Eingaben werden abgefangen — kein leerer Titel landet in der DB.
→ Sinnvolle Defensive-Ergänzung. ✓

**3. `formatDate()` mit `Intl.DateTimeFormat('de-DE')`**

Datum wird als `TT.MM.JJJJ` formatiert — korrekt für deutschen Markt.
→ Konsistent mit Projektsprache. ✓

**4. `satisfies React.CSSProperties` auf allen Style-Konstanten**

Typsicherheit auf allen Inline-Style-Objekten — kein `any`.
Konsistentes Muster mit Login-Seite. ✓

---

## Sicherheitsprüfung

- [x] `session?.user?.userId` defensiv geprüft vor Prisma-Zugriff
- [x] `userId` aus Session, nicht aus URL
- [x] `status: { not: 'deleted' }` — gelöschte Projekte werden nicht angezeigt
- [x] Client Component: `fetch('/api/projects')` — Session-Cookie automatisch mitgeschickt ✓
- [x] `401` im Client → Redirect auf `/login` statt stiller Fehler ✓

---

## Akzeptanzkriterien

- [x] `/projects` zeigt Liste aller Projekte des eingeloggten Nutzers
- [x] Leere Liste zeigt Hinweistext ✓
- [x] `/projects/new` zeigt Formular
- [x] Nach Anlegen Weiterleitung auf `/projects/[id]` ✓
- [x] Home-Seite hat Link zu `/projects` ✓
- [x] Unauthentifizierter Zugriff → Redirect auf `/login` ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere, gut strukturierte Umsetzung mit sinnvollen Ergänzungen.
Visuell konsistent mit der Login-Seite.
