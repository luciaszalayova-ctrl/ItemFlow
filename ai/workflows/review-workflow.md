# Review-Workflow

## Wann ein Review pflicht ist

- Nach jeder Codex-Implementierung (immer)
- Vor jedem Merge in `main` (immer)
- Nach Änderungen an Interfaces oder Schemas (immer)
- Nach Sicherheits-relevanten Änderungen (immer)

---

## Ablauf

### 1. Vorbereitung

```
git diff main...feature/IF-NNN   # alle Änderungen sehen
```

Ticket lesen: `ai/tickets/IF-NNN.md`

### 2. Prüfung

Prüfkategorien in Reihenfolge (höchste Priorität zuerst):

**A — Sicherheit (Blocker)**
- [ ] Keine API-Keys, Tokens, Passwörter im Code
- [ ] Kein Auto-Publish ohne User-Bestätigung
- [ ] Nutzerfotos nicht an unnötige Services gesendet
- [ ] Kein Umgehen von Anti-Bot-Systemen

**B — KI-Ausgaben (Blocker)**
- [ ] Vision-Output durch `VisionOutputSchema.parse()` validiert
- [ ] Listing-Output durch `GeneratedListingSchema.parse()` validiert
- [ ] Kein unvalidiertes Modell-JSON als Applikationszustand gespeichert

**C — Korrektheit**
- [ ] Akzeptanzkriterien aus Ticket erfüllt
- [ ] Fehlerbehandlung an API-Grenzen vorhanden
- [ ] TypeScript-Typen korrekt (kein `any` ohne Begründung)

**D — Tests**
- [ ] Tests für neue Business-Logik vorhanden
- [ ] Scoring-Logik getestet (wenn berührt)
- [ ] Schema-Validierung getestet (wenn berührt)
- [ ] `pnpm test` grün

**E — Architektur**
- [ ] Interfaces unverändert (oder separates Ticket existiert)
- [ ] Kein stilles Refactoring außerhalb Scope
- [ ] Kein globaler Zustand eingeführt
- [ ] Kein direkter Vendor-Import in Business-Logik (Provider-Pattern beachtet)

**F — Allgemeines**
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün
- [ ] Keine `.env`-Werte im Code

### 3. Review-Datei schreiben

Template: `ai/templates/review.md`
Zielort: `ai/reviews/REVIEW-IF-NNN.md`

### 4. Ergebnis

**approved:**
- Alle Blocker-Kriterien erfüllt
- Keine kritischen Probleme
- Nutzer kann mergen

**changes-requested:**
- Konkrete Punkte mit Datei + Zeile
- Schweregrad: blocker / improvement
- Codex behebt → erneutes Review

---

## Reviewer-Haltung

- Konkret, nicht vage ("Zeile 42 fehlt Zod-Validierung", nicht "Validierung verbessern")
- Blocker von Nice-to-have trennen
- Positives kurz benennen
- Keine persönlichen Stilpräferenzen als Blocker
