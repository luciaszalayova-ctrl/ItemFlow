# REVIEW-IF-008

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-008-projects-crud-api`  
Commit: `999daec`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-008-projects-crud-api.md`

Geänderte Dateien (IF-008-spezifisch):
- `apps/api/app/api/projects/route.ts` (neu)
- `apps/api/app/api/projects/[id]/route.ts` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Verbesserungen (Non-Blocker)

**1. `projectSelect` in beiden Dateien dupliziert**

Beide Route-Dateien definieren `projectSelect` lokal. Bei mehreren Projekt-Routen
(z. B. PATCH in einem späteren Ticket) würde das dreifach existieren.

Sauberere Lösung: `apps/api/app/api/projects/_select.ts` mit shared constant.
→ Kein Blocker für MVP, adressieren wenn PATCH-Route hinzukommt.

**2. `projectSelectWithUserId` in `[id]/route.ts`**

Codex fügt `userId` zum Select hinzu um die Ownership zu prüfen, strippt es dann
manuell aus der Response. Das ist korrekt und sicher — `userId` erscheint nicht in
der API-Antwort. Sauberer wäre ein separates Lookup-Select plus Response-Select,
aber für zwei Felder übertrieben.
→ Kein Blocker.

---

## Branch-Problem (Achtung bei Merge)

Die Branch-Spitze zeigt auf `a883bcf [IF-007] POST /api/projects/[id]/assets`,
der IF-008-Commit `999daec` liegt darunter. IF-007-Änderungen dürfen nicht mit
IF-008 zusammen auf main landen.

**Merge-Strategie: Cherry-Pick**

```bash
git checkout main
git cherry-pick 999daec
git push origin main
```

Danach Branch aufräumen:
```bash
git branch -d feature/IF-008-projects-crud-api
```

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session — niemals aus Request-Body oder URL
- [x] `passwordHash` nicht in Responses (explizite selects, kein `*`)
- [x] Ownership-Prüfung in GET + DELETE: `project.userId !== session.user.userId` → 403
- [x] Soft-Delete: `status: 'deleted'` — kein echtes DB-Delete
- [x] Defensive Auth-Prüfung (`session?.user?.userId`) trotz Middleware
- [x] `request.json()` in try/catch — kein unbehandelter Parse-Fehler
- [x] Keine Settings oder interne Felder in Responses

---

## Akzeptanzkriterien

- [x] `POST /api/projects` legt Projekt an, gibt `201` zurück
- [x] `GET /api/projects` gibt nur Projekte des eingeloggten Nutzers zurück (`userId`-Filter + `status: { not: 'deleted' }`)
- [x] `GET /api/projects/[id]` gibt `403` bei fremdem Projekt
- [x] `DELETE /api/projects/[id]` setzt `status: 'deleted'`, gibt `204` zurück
- [x] `POST` mit fehlendem `title` gibt `400` mit `details` (Zod flatten) zurück
- [x] `passwordHash` und `settings` erscheinen nicht in Responses
- [x] `pnpm typecheck` grün ✓ (Codex-Report)
- [x] `pnpm lint` grün ✓ (Codex-Report)
- [x] Next.js 15 `params` korrekt als `Promise` behandelt (`await context.params`)

---

## Qualität

- [x] `projectSelect` als Konstante — kein blindes Prisma-Objekt zurückgegeben
- [x] Einheitliches Fehlerformat `{ "error": "..." }` in allen Branches
- [x] `CreateProjectSchema.safeParse()` für Input-Validierung genutzt
- [x] `description: parsed.data.description ?? null` — korrekt, kein `undefined` in DB
- [x] Soft-Delete vor Ownership-Prüfung: erst 404, dann 403 — Information Leakage vermieden ✓

---

## Empfehlung

**approved** — Implementierung ist korrekt, sicher und vollständig.

Merge via Cherry-Pick (nicht regulärer Merge) um IF-007 sauber zu halten.
