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

---

## Multi-Agent-Routing

Vollstaendige Workflows: `ai/workflows/`

### Claude Code uebernimmt

- Anforderungsanalyse und Ticket-Erstellung
- Interface- und Schema-Design
- Architekturentscheidungen (DECISION-NNN)
- Code-Reviews nach Codex-Implementierungen
- Sicherheits- und Privacy-Review
- Dokumentation aktuell halten

### Codex uebernimmt

- Implementierung eines freigegebenen Tickets (`ai/tickets/IF-NNN.md`)
- CRUD-API-Routen nach bestehenden Interfaces
- Frontend-Komponenten nach bestehenden Schemas
- Tests nach vorgegebenen Fixtures und Szenarien

### Routing-Entscheidung

```
Neue Anforderung  →  Claude Code (Analyse + Ticket)
                  ↓
         Nutzer gibt Ticket frei
                  ↓
                Codex (Implementierung auf Feature-Branch)
                  ↓
         Claude Code (Review → ai/reviews/REVIEW-IF-NNN.md)
                  ↓
              Nutzer (Merge-Entscheidung)
```

---

## Stop-Regeln

Ein Agent MUSS sofort stoppen und dokumentieren bei:

1. **Unklare Anforderung** — mehr als eine sinnvolle Implementierung moeglich
2. **Fehlendes Interface** — zu implementierendes Interface nicht definiert
3. **Offene Architekturentscheidung** — Implementierung haengt von nicht getroffener Entscheidung ab
4. **Geschaeftslogik-Annahme** — Preise, Schwellenwerte, Regeln muessen angenommen werden
5. **Sicherheitsrelevanz** — Auth, Credentials, sensible Daten betroffen
6. **Scope-Ausweitung** — mehr Aenderungen noetig als im Ticket beschrieben

Stop-Prozedur:
1. Arbeit unterbrechen
2. `ai/questions/QUESTION-NNN-titel.md` anlegen (Template: `ai/templates/question.md`)
3. Ticket als `blocked` markieren
4. Kontext an Nutzer uebergeben

---

## Sicherheitsregeln fuer Agenten

Agenten entscheiden NICHT eigenstaendig ueber:

- **Preislogik und Schwellenwerte** — alle Scoring-Schwellen, Mindestpreise, Bundle-Regeln
- **API-Vertraege** — Aenderungen an bestehenden Interface-Signaturen
- **Authentifizierung** — Auth-Flow, Session-Handling, Zugriffsregeln
- **Kostenrelevanz** — Entscheidungen die API-Kosten beeinflussen (Vision-Provider, Modell-Wahl)
- **Persistenzentscheidungen** — Datenbankschema-Aenderungen, neue Felder
- **Marketplace-Automation** — alles was Marketplace-Aktionen betrifft
- **Datenschutz** — wo und wie Nutzerfotos gespeichert oder verarbeitet werden

In allen diesen Faellen: `ai/questions/` → STOP.

---

## Blocker-System

Blockierte Tickets liegen in `ai/questions/`.

Format: `QUESTION-NNN-kurztitel.md`

Regeln:
- Kein Agent implementiert ein `blocked`-Ticket
- Auflosung nur durch Nutzer-Antwort
- Nach Antwort: QUESTION auf `answered`, Ticket auf `ready`

Vollstaendige Beschreibung: `ai/questions/README.md`

---

## Git-Workflow

```
main            — stabiler Stand, nur via Merge
feature/IF-NNN  — ein Ticket, ein Branch
bugfix/IF-NNN   — ein Bug, ein Branch
```

Regeln:
- Kein direktes Commit auf `main`
- Ein Commit = eine klar beschreibbare Aenderung
- Commit-Format: `[IF-NNN] Kurze Beschreibung`
- Branch nach Merge loeschen
- Kein Force-Push auf geteilte Branches
- Kein `--no-verify` ohne explizite Begruendung

---

## Projektinfrastruktur fuer Agenten

```
ai/
  context/project-snapshot.md  — Projektstand fuer neue Sessions lesen
  workflows/feature-workflow.md — Feature-Entwicklung
  workflows/bugfix-workflow.md  — Bug-Behebung
  workflows/review-workflow.md  — Code-Review
  decisions/DECISION-NNN.md     — Architekturentscheidungen
  tickets/IF-NNN.md             — Implementierungsaufgaben
  reviews/REVIEW-IF-NNN.md      — Review-Protokolle
  questions/QUESTION-NNN.md     — Offene Fragen / Blocker
  templates/                    — Vorlagen fuer alle Dokumenttypen
```
