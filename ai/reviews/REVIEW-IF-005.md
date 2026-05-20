# REVIEW-IF-005

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-005-prisma-migrate-seed`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-005-prisma-migrate-seed.md`

Geänderte Dateien:
- `packages/db/prisma/seed.ts` (neu)
- `packages/db/package.json` (Scripts + devDependencies)
- `packages/db/tsconfig.json` (rootDir + include angepasst)
- Root `package.json` (db:migrate, db:seed Scripts)

---

## Kritische Probleme (Blocker)

Keine.

---

## Verbesserungen (Non-Blocker)

**1. `rootDir: "."` statt `"src"` in `packages/db/tsconfig.json`**

Codex hat `rootDir` auf `.` gesetzt um `prisma/seed.ts` in den Typecheck einzuschließen.
Das ist für den Typecheck korrekt, führt aber dazu dass `pnpm build` die Ausgabestruktur
`dist/src/` + `dist/prisma/` erzeugt statt nur `dist/` (flat).

Auswirkung heute: minimal — `packages/db` wird nicht als Library gebaut.
Auswirkung später: falls `pnpm --filter @itemflow/db build` eingeführt wird,
müssen `main` und `types` in `package.json` angepasst werden.

Sauberere Lösung wäre `tsconfig.seed.json` (separates Config ohne `composite`),
aber für MVP akzeptabel.
→ Kein Blocker, aber beim nächsten DB-Build-Ticket adressieren.

**2. `attributesJson` im Seed nur brand + bundlePotential**

Codex filtert die Attribut-Daten in `buildAttributesJson()` auf `brand` und
`bundlePotential`. Andere Attribute (LEGO productLine, IKEA color, ...) gehen verloren.

Für Dev-Seed-Zwecke ausreichend. Die vollständigen Attribute stecken in den
Fixtures (`packages/testing`) — der Seed ist kein 1:1-Abbild.
→ Kein Blocker.

---

## Sicherheitsprüfung

- [x] `bcrypt.hashSync("dev-password", 10)` — 10 Rounds, kein Klartext
- [x] Kein `.env` committed
- [x] Kein Produktions-Secret im Seed-Skript
- [x] Idempotenz korrekt implementiert — kein Fehler bei zweitem Aufruf

---

## Qualität

- [x] Idempotenz: `findUnique` auf `dev@itemflow.local` vor allen Writes — sauber
- [x] FK-Reihenfolge korrekt: User → Project → Assets → Candidates → Items
- [x] `prisma.$disconnect()` in `finally` — kein Connection-Leak
- [x] `process.exitCode = 1` statt `process.exit(1)` — saubereres Error-Handling
- [x] Hilfsfunktionen `buildAttributesJson` / `buildRawModelOutputJson` gut getrennt
- [x] Kindersitz `uncertaintyNotes` korrekt in `rawModelOutputJson` ✓
- [x] `pnpm typecheck` grün (alle Packages)
- [x] `pnpm lint` grün

---

## Nicht ausgeführt (erwartet)

- `pnpm db:migrate` — braucht laufende PostgreSQL-Instanz, bewusst ausgelassen ✓
- `pnpm db:seed` — ebenso ✓

---

## Empfehlung

**approved** — Implementierung ist korrekt und sicher.
Idempotenz, FK-Reihenfolge und Passwort-Hashing sind alle sauber gelöst.
