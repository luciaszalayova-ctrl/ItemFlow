# Feature-Workflow

```
Anforderung
    ↓
[Claude Code] Schritt 1: Analyse
    ↓ STOP wenn offene Fragen
[Nutzer] Fragen klären
    ↓
[Claude Code] Schritt 2: Ticket erstellen
    ↓
[Nutzer] Schritt 3: Ticket freigeben
    ↓
[Codex] Schritt 4: Implementierung auf Feature-Branch
    ↓ STOP wenn Scope unklar oder Annahmen nötig
[Claude Code] Schritt 5: Review
    ↓ STOP bei kritischen Problemen
[Nutzer] Schritt 6: Merge-Entscheidung
```

---

## Schritt 1 — Analyse (Claude Code)

**Eingabe:** Anforderung (aus Backlog oder direkt)

Aufgaben:
1. `docs/BACKLOG.md` prüfen — existiert das Ticket bereits?
2. Betroffene Packages identifizieren
3. Relevante Interfaces lesen (`packages/*/src/index.ts`)
4. Relevante Schemas lesen (`packages/shared/src/schemas/`)
5. Offene Fragen identifizieren

**STOP wenn:**
- Anforderung lässt mehr als eine sinnvolle Implementierung zu
- Benötigte Interfaces fehlen oder sind unklar
- Geschäftslogik-Annahmen nötig (Preise, Schwellenwerte, Regeln)
- Sicherheitsrelevante Entscheidung offen

**Bei STOP:**
1. `ai/questions/QUESTION-NNN-titel.md` anlegen (Template: `ai/templates/question.md`)
2. Dem Nutzer übergeben mit Kontext

---

## Schritt 2 — Ticket erstellen (Claude Code)

**Eingabe:** Geklärte Anforderung

Template: `ai/templates/ticket.md`
Zielort: `ai/tickets/IF-NNN-titel.md`

Pflichtfelder:
- Klares, einzelnes Ziel
- Betroffene Dateien (konkrete Pfade)
- Akzeptanzkriterien (prüfbar, nicht vage)
- Test-Anforderungen
- Offene Fragen: keine (oder als Referenz auf QUESTION mit Status `answered`)
- Entscheidungen: Referenzen auf DECISION falls relevant

**Regel:** Ein Ticket = eine klar isolierte Änderung.
Zu großes Ticket → aufteilen.

---

## Schritt 3 — Freigabe (Nutzer)

Der Nutzer prüft das Ticket und gibt es frei.

**Keine Implementierung ohne explizite Freigabe.**

---

## Schritt 4 — Implementierung (Codex)

**Eingabe:** Freigegebenes Ticket `ai/tickets/IF-NNN.md`

```
1. Branch anlegen: feature/IF-NNN-kurztitel
2. Ticket vollständig lesen
3. Alle referenzierten Interfaces lesen
4. Alle referenzierten Schemas lesen
5. Implementieren
6. Tests schreiben
7. pnpm typecheck → muss grün sein
8. pnpm test → muss grün sein
9. pnpm lint → muss grün sein
10. Bericht schreiben (was geändert, welche Tests, offene Risiken)
```

**STOP wenn:**
- Scope-Ausweitung nötig um das Ziel zu erreichen
- Unerwartetes Verhalten entdeckt das Architektur betrifft
- Test schlägt aus ungeklärtem Grund fehl
- Assumption nötig (z.B. Preislogik, Datenbankstruktur)

**Bei STOP:**
1. Aktuellen Stand committen mit Prefix `WIP:`
2. `ai/questions/QUESTION-NNN.md` anlegen
3. Ticket als `blocked` markieren
4. An Nutzer übergeben

---

## Schritt 5 — Review (Claude Code)

**Eingabe:** Implementierter Branch, Ticket-Datei

Template: `ai/templates/review.md`
Zielort: `ai/reviews/REVIEW-IF-NNN.md`

Prüfliste:
- [ ] Akzeptanzkriterien aus Ticket erfüllt?
- [ ] Zod-Validierung für alle KI-Outputs vorhanden?
- [ ] Keine Credentials im Code?
- [ ] Kein Auto-Publish implementiert?
- [ ] Tests für Business-Logik vorhanden?
- [ ] Interfaces unverändert (oder Änderung in separatem Ticket)?
- [ ] Kein stilles Refactoring außerhalb des Scopes?
- [ ] `pnpm typecheck` grün?
- [ ] `pnpm test` grün?

**STOP (changes-requested) wenn:**
- KI-Output ohne Zod-Validierung
- Credentials im Code
- Auto-Publish-Logik
- Scope-Ausweitung ohne Ticket
- Keine Tests für neue Businesslogik

---

## Schritt 6 — Merge (Nutzer)

Nur der Nutzer entscheidet über den Merge.
Claude Code und Codex schlagen vor, der Nutzer entscheidet.
