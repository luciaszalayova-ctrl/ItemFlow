# AGENTS.md

## Zweck

Diese Datei legt fest, wie KI-Coding-Agents in diesem Repository arbeiten sollen.

Sie gilt fuer Codex, Claude Code und jeden anderen Coding-Agent.

## Verfuegbare Rollen und Skills

Fuer komplexere Aufgaben koennen spezifische Rollen aktiviert werden.
Die Skill-Dateien befinden sich unter `skills/`.

| Datei | Rolle | Wann aktivieren |
|-------|-------|-----------------|
| `skills/business-analyst.md` | Business Analyst | Anforderungsanalyse, User Stories, Ticket-Zerlegung, offene Fragen klaeren |
| `skills/architect.md` | Solution Architect | Systemdesign, API-Design, Modulstruktur, ADRs, Skalierbarkeit |
| `skills/implementation-agent.md` | Implementation Agent | Ticket sauber umsetzen, kleiner und klar definierter Scope |
| `skills/reviewer.md` | Code Reviewer | Code-Review nach Implementierung, Sicherheit, Architekturkonformitaet |
| `skills/ux-agent.md` | UX Agent | Nutzerfluss, UI-Entscheidungen, Reduktion von Reibung, Mobile UX |
| `skills/learning-coach.md` | Learning Coach | Technische Entscheidungen erklaeren, Patterns vermitteln |

Ein Agent aktiviert eine Rolle, indem er die entsprechende Skill-Datei liest und deren Workflow und Ausgabeformat befolgt.

Reihenfolge fuer neue Features:

```text
1. business-analyst.md  -> Anforderung klaeren, Tickets erstellen
2. architect.md         -> Technische Loesung entwerfen (bei groesseren Aenderungen)
3. implementation-agent.md -> Umsetzen
4. reviewer.md          -> Review
5. ux-agent.md          -> UX-Pruefung (fuer UI-Aenderungen)
```

## Allgemeine Regeln

- Arbeite in kleinen, gut pruefbaren Aenderungen.
- Veraendere keine nicht zusammenhaengenden Dateien.
- Erfinde keine Produktanforderungen.
- Halte Marketplace-Automatisierung menschlich beaufsichtigt.
- Validiere alle KI-Ausgaben.
- Fuege Tests fuer geschaeftskritische Logik hinzu.
- Aktualisiere die Dokumentation, wenn sich Verhalten aendert.

## Branching

Verwende fuer verschiedene Agents getrennte Branches oder Worktrees.

Empfohlene Benennung:

```text
feature/photo-upload
feature/item-review
feature/scoring-engine
feature/listing-generator
experiment/kleinanzeigen-playwright
experiment/ebay-api
```

Lass nicht mehrere Agents auf demselben Branch arbeiten, ausser die Aufgabe ist eng koordiniert.

## Format fuer Aufgabenuebergaben

Wenn Aufgaben zwischen Agents uebergeben werden, verwende:

```text
## Kontext
Was aktuell existiert.

## Ziel
Was erreicht werden soll.

## Rahmenbedingungen
Technische, produktbezogene oder sicherheitsrelevante Einschraenkungen.

## Wahrscheinlich betroffene Dateien
Relevante Pfade.

## Akzeptanzkriterien
Woran erkennbar ist, dass die Aufgabe erledigt ist.

## Tests
Was ausgefuehrt oder hinzugefuegt werden soll.
```

## Verbindliche Akzeptanzkriterien

Jede Feature-Aufgabe sollte Folgendes enthalten:

- Fuer Nutzer sichtbares Verhalten.
- Anforderungen an die Datenvalidierung.
- Fehlerbehandlung.
- Tests.
- Dokumentationsupdate, falls noetig.

## Marketplace-Sicherheit

KI-Agents duerfen keine finale automatische Veroeffentlichung implementieren, ausser die Aufgabe sagt ausdruecklich, dass eine offizielle API-Integration genutzt wird und eine Nutzerfreigabe erforderlich ist.

Browser-Automatisierung muss vor irreversiblen Aktionen stoppen.

## Umgebungsvariablen

Fuege benoetigte Umgebungsvariablen zu `.env.example` hinzu.

Committe niemals `.env`.

## Platzhalter fuer Testbefehle

Aktualisiere diesen Abschnitt, sobald der Stack initialisiert ist:

```bash
# install
pnpm install

# typecheck
pnpm typecheck

# test
pnpm test

# lint
pnpm lint

# dev
pnpm dev
```

## Kollaborations-Workflow

Alle Coding-Agents muessen diesem Ablauf folgen:

```text
1. Anforderung analysieren
2. Rueckfragen stellen
3. Auf Klaerung warten
4. Implementierungsplan erstellen
5. Freigabe anfragen
6. In kleinen Schritten implementieren
7. Aenderungen und Tests berichten
```

### Wichtige Regeln

- Starte nicht sofort mit grossen Implementierungen.
- Triff keine Annahmen bei unklaren Anforderungen.
- Bevorzuge kleine, gut pruefbare Pull Requests.
- Halte Implementierungsschritte unabhaengig testbar.
- Fasse nach jedem Implementierungsschritt zusammen:
  - was sich geaendert hat
  - welche Tests gelaufen sind
  - welche Risiken bestehen
  - welcher naechste Schritt empfohlen wird
