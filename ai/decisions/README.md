# ai/decisions/

Architekturentscheidungen die den Projektverlauf prägen.

## Format

`DECISION-[NNN]-[kebab-case-titel].md`

Nummerierung fortlaufend, nie wiederverwenden.

## Wann eine DECISION anlegen

- Technologie-Wahl (Storage, Auth, Framework)
- Schnittstellendesign (Interface-Signaturen)
- Datenmodell-Entscheidungen
- Sicherheits- oder Datenschutz-Entscheidungen
- Entscheidungen die von mehreren Tickets abhängen

## Wann NICHT

- Routine-Implementierungsentscheidungen (welche Hilfsfunktion verwenden)
- Entscheidungen die ein einzelnes Ticket nicht verlassen
- Style-Entscheidungen (ESLint-Regeln etc.)

## Bestehende Entscheidungen

| ID | Titel | Status |
|----|-------|--------|
| DECISION-001 | Storage Provider Architecture | accepted |
| DECISION-002 | TypeScript Project References | accepted |

Produktbezogene Entscheidungen: `docs/DECISIONS.md` (ADR-001 ff.)

## Template

`ai/templates/decision.md`
