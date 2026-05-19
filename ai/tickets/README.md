# ai/tickets/

Implementierungsaufgaben für Codex und Claude Code.

## Format

`IF-[NNN]-[kebab-case-titel].md`

IF = ItemFlow. Nummerierung fortlaufend.

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `draft` | Wird noch ausgearbeitet |
| `ready` | Vom Nutzer freigegeben, kann implementiert werden |
| `in-progress` | Wird gerade implementiert |
| `blocked` | Wartet auf Antwort in `ai/questions/QUESTION-NNN.md` |
| `review` | Implementierung fertig, Review läuft |
| `done` | Review approved, gemergt |

## Regeln

- Kein Ticket ohne Akzeptanzkriterien
- Kein Ticket das mehr als eine isolierte Änderung beschreibt
- Kein `in-progress` ohne vorher `ready`
- Kein `done` ohne REVIEW-Datei in `ai/reviews/`

## Template

`ai/templates/ticket.md`

## Nächste offene Tickets

Aktuelle Priorität siehe `docs/BACKLOG.md`.
