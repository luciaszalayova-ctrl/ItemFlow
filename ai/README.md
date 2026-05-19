# ai/

Dieses Verzeichnis organisiert die kontrollierte Zusammenarbeit zwischen Claude Code und Codex.

## Struktur

| Verzeichnis | Zweck |
|-------------|-------|
| `agents/` | Referenzen auf Rollen und Skills |
| `context/` | Projekt-Snapshots für neue Agenten-Sessions |
| `workflows/` | Schritt-für-Schritt-Prozesse |
| `decisions/` | Architekturentscheidungen (DECISION-NNN) |
| `tickets/` | Implementierungsaufgaben (IF-NNN) |
| `reviews/` | Code-Review-Protokolle |
| `questions/` | Offene Fragen und Blocker (QUESTION-NNN) |
| `templates/` | Vorlagen für alle Dokumenttypen |

## Grundprinzip

```
Analyse → Frage klären → Ticket → Freigabe → Implementierung → Review → Merge
```

Kein Schritt darf übersprungen werden.
Kein Agent implementiert ohne freigegebenes Ticket.
Kein Merge ohne Review.

## Schnellreferenz

- Neues Feature starten → `workflows/feature-workflow.md`
- Bug beheben → `workflows/bugfix-workflow.md`
- Review durchführen → `workflows/review-workflow.md`
- Frage blockiert Ticket → `templates/question.md` → `questions/QUESTION-NNN.md`
- Architekturentscheidung nötig → `templates/decision.md` → `decisions/DECISION-NNN.md`
