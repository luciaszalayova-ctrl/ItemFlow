# ai/context/

Projekt-Snapshots für neue Agenten-Sessions.

## Zweck

Wenn eine neue Claude-Code- oder Codex-Session startet, kann sie `project-snapshot.md`
lesen um den aktuellen Projektstand zu verstehen, ohne alle Docs durchsuchen zu müssen.

## Regeln

- `project-snapshot.md` nach jeder größeren Änderung aktualisieren
- Kein Code hier — nur Zustand, Entscheidungen, offene Fragen
- Datum angeben, Snapshots veralten schnell

## Dateien

| Datei | Inhalt |
|-------|--------|
| `project-snapshot.md` | Aktueller Projektstand, Stack, Entscheidungen, offene Fragen |
