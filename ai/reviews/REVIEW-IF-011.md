# REVIEW-IF-011

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-011-scoring-api`  
Commit: `6793fed`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-011-scoring-api.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/items/[iid]/score/route.ts` (neu)
- `apps/api/package.json` (`@itemflow/scoring` ergänzt)
- `apps/api/tsconfig.json` (scoring reference + paths)
- `pnpm-lock.yaml` (Workspace-Sync)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `prisma.$transaction()` für Recommendation + Status-Update**

Das Ticket spezifizierte zwei separate DB-Writes ohne Transaction.
Codex hat beide Writes atomar verpackt: wenn das `inventoryItem.update` fehlschlägt,
wird die `Recommendation` zurückgerollt — kein inkonsistenter Zustand möglich.
Konsistentes Muster mit IF-009-accept. ✓

**2. `new RuleBasedScoringEngine(DEFAULT_THRESHOLDS)` statt `new RuleBasedScoringEngine()`**

Das Ticket-Spec war vereinfacht und übergab keine Thresholds.
Codex importiert `DEFAULT_THRESHOLDS` explizit und übergibt sie dem Konstruktor —
das ist die korrekte Verwendung der API aus IF-003. ✓

**3. Status-Schutz als Allowlist**

Konsistent mit IF-010: `status !== 'draft' && status !== 'ready_for_scoring'` → `409`.
Robuster als die Blocklist aus dem Ticket-Spec. ✓

---

## Verbesserungen (Non-Blocker)

**1. `apps/api/tsconfig.json` references — nur scoring, shared + db fehlen**

Vor IF-011 enthielt `references` beide Packages `shared` und `db`.
Codex hat nur `scoring` eingetragen statt die bestehenden References zu ergänzen:

```json
// Aktuell (unvollständig):
"references": [{ "path": "../../packages/scoring" }]

// Korrekt:
"references": [
  { "path": "../../packages/shared" },
  { "path": "../../packages/db" },
  { "path": "../../packages/scoring" }
]
```

`pnpm typecheck` ist aktuell grün — da `noEmit: true` gesetzt ist, werden die
Declaration-Outputs der referenzierten Packages nicht erzwungen. Bei einem
späteren `tsc --build` ohne `noEmit` würden `shared` und `db` als ungebaut
fehlschlagen (TS6305).
→ Vor dem Merge korrigieren (1-Zeilen-Fix).

---

## Fix vor Merge

```bash
# apps/api/tsconfig.json — references ersetzen:
"references": [
  { "path": "../../packages/shared" },
  { "path": "../../packages/db" },
  { "path": "../../packages/scoring" }
]
```

Danach `pnpm typecheck` nochmals grün bestätigen, dann WIP-Commit amenden oder
neuen Commit auf dem Branch.

---

## Sicherheitsprüfung

- [x] `userId` ausschließlich aus Session
- [x] Ownership via Projekt → `403`
- [x] Item-Lookup mit `projectId`-Filter — IDOR verhindert
- [x] `409` bei bereits `scored` oder `handled` Item
- [x] Nur validierte Felder in `Recommendation` — kein roher JSON-Blob
- [x] `isSensitiveCategory` in Response, nicht in DB gespeichert ✓
- [x] `recommendationSelect` explizit — kein blindes Prisma-Objekt

---

## Akzeptanzkriterien

- [x] `POST .../score` gibt Recommendation zurück (`201`)
- [x] `Recommendation` ist in DB gespeichert (validierte Felder)
- [x] Item-Status ist nach Aufruf `scored`
- [x] Zweiter Aufruf auf `scored` Item gibt `409`
- [x] `isSensitiveCategory` ist in Response enthalten
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved mit Fix** — Route-Logik ist korrekt und sicher. Vor dem Merge
`references` in `apps/api/tsconfig.json` um `shared` und `db` ergänzen.
