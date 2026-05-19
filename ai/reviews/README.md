# ai/reviews/

Code-Review-Protokolle nach Implementierungen.

## Format

`REVIEW-IF-[NNN].md`

## Regeln

- Jede Implementierung bekommt ein Review bevor sie gemergt wird
- Reviews werden von Claude Code geschrieben
- Ergebnis ist entweder `approved` oder `changes-requested`
- Bei `changes-requested`: konkrete Punkte mit Datei und Zeile

## Template

`ai/templates/review.md`

## Ablauf

Review-Workflow: `ai/workflows/review-workflow.md`
