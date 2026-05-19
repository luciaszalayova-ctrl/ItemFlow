# ai/questions/

Offene Fragen die Tickets blockieren.

## Format

`QUESTION-[NNN]-[kebab-case-titel].md`

## Regeln

- Jede blockierende Frage bekommt eine eigene Datei
- Ticket bleibt auf `blocked` bis Frage auf `answered` gesetzt
- Kein Agent überbrückt eine offene Frage durch Annahmen

## Status-Werte

| Status | Bedeutung |
|--------|-----------|
| `open` | Wartet auf Nutzer-Entscheidung |
| `answered` | Entschieden, Ticket kann fortgesetzt werden |
| `wont-answer` | Bewusst offen gelassen, Ticket neu bewertet |

## Template

`ai/templates/question.md`

## Aktuell offene Fragen

Aus `ai/context/project-snapshot.md`:

| ID | Frage | Blocker |
|----|-------|---------|
| F5b | Image-Storage Prod: R2/S3/Supabase? | Vercel-Deploy |
| F11 | UI-Library: shadcn/ui + Tailwind? | Frontend-Setup |
| F12 | Mobile-Browser-Support? | Upload-UI |

Sobald eine QUESTION-Datei angelegt wird, hier verlinken.
