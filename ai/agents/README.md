# ai/agents/

## Agentenrollen

Die Skill-Definitionen liegen unter `skills/` im Projekt-Root.

| Agent | Skill-Datei | Hauptaufgaben |
|-------|-------------|---------------|
| Claude Code | — | Analyse, Architektur, Reviews, Tickets, Dokumentation |
| Codex | `skills/implementation-agent.md` | Implementierung freigegebener Tickets |

## Routing

```
Neue Anforderung
    ↓
Claude Code
    ↓ Analyse, offene Fragen klären, Ticket schreiben
    ↓
Nutzer gibt Ticket frei
    ↓
Codex
    ↓ Implementierung auf Feature-Branch
    ↓
Claude Code
    ↓ Review
    ↓
Nutzer
    ↓ Merge-Entscheidung
```

## Übergabeformat

Jede Übergabe an Codex enthält:
- Link zur Ticket-Datei (`ai/tickets/IF-NNN.md`)
- Relevante Interface-Dateien
- Relevante Schema-Dateien
- Explizite Akzeptanzkriterien
- Test-Anforderungen

Vorlage: `ai/templates/ticket.md`

## Was Codex NICHT entscheidet

Codex fragt nach und stoppt bei:
- Unklarem Scope
- Fehlenden Interfaces
- Geschäftslogik-Annahmen
- Architekturänderungen
- Sicherheitsrelevanten Entscheidungen

Vollständige Liste: `AGENTS.md` → Abschnitt "Sicherheitsregeln"
