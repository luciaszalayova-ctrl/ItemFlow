# DECISION-002: TypeScript Project References für Cross-Package-Imports

Datum: 2026-05-19  
Status: `accepted`  
Erstellt von: Claude Code

---

## Kontext

Packages wie `packages/vision`, `packages/scoring`, `packages/listings` importieren
Typen aus `packages/shared`. Mit `rootDir: src` in den tsconfigs und Pfad-Aliases
die auf Quelldateien zeigen, schlägt `tsc --noEmit` mit TS6059 fehl:
"File is not under rootDir".

---

## Entscheidung

`composite: true` in `packages/shared/tsconfig.json`.

`composite: true` + `references: [{ path: "../../packages/shared" }]` in
`packages/vision`, `packages/scoring`, `packages/listings`.

Vor dem ersten Typecheck von abhängigen Packages: `tsc --build packages/shared/tsconfig.json`.

TypeScript nutzt dann die generierten `.d.ts`-Deklarationen aus `packages/shared/dist/`
statt die Quelldateien direkt zu importieren. Das rootDir-Problem entfällt.

---

## Konsequenzen

**Positiv:**
- `pnpm typecheck` läuft fehlerfrei für alle 8 Packages
- Klar definierte Build-Reihenfolge

**Negativ / Einschränkungen:**
- `packages/shared` muss gebaut sein bevor abhängige Packages typchecken
- Bei Änderungen an `packages/shared` muss neu gebaut werden: `tsc --build packages/shared/tsconfig.json`

---

## Alternativen erwogen

| Option | Warum nicht gewählt |
|--------|---------------------|
| `rootDir` entfernen | Kaputte dist/-Struktur, Output landet in verschachtelten Pfaden |
| Pfad-Aliases auf dist/ zeigen | Erfordert immer Build vor Typecheck, auch in Dev |
| Turborepo + build pipeline | F1 offen, unnötige Komplexität für aktuellen Stand |

---

## Betroffene Tickets

- T-101 (Monorepo-Setup) — implementiert von Codex, dieser Fix von Claude Code
