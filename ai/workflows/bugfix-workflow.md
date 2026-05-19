# Bugfix-Workflow

```
Bug gemeldet
    ↓
[Claude Code] Schritt 1: Bug dokumentieren + analysieren
    ↓ STOP wenn Root Cause unklar
[Claude Code] Schritt 2: Minimalen Fix bestimmen
    ↓ STOP wenn Fix Architekturänderung erfordert
[Claude Code / Codex] Schritt 3: Fix implementieren
    ↓
[Claude Code] Schritt 4: Review
    ↓
[Nutzer] Schritt 5: Merge
```

---

## Schritt 1 — Bug dokumentieren (Claude Code)

Ticket anlegen: `ai/tickets/IF-NNN-bugfix-beschreibung.md`

Pflichtfelder:
- Symptom: was passiert tatsächlich
- Erwartetes Verhalten
- Reproduzierbare Schritte
- Vermutlich betroffene Dateien

**STOP wenn:**
- Bug nicht reproduzierbar
- Symptom lässt mehrere Root Causes zu

---

## Schritt 2 — Minimalen Fix bestimmen (Claude Code)

1. Betroffenen Code lesen
2. Root Cause identifizieren
3. Kleinste mögliche Änderung bestimmen
4. Seiteneffekte prüfen

**STOP wenn:**
- Root Cause unbekannt → Frage dokumentieren
- Fix erfordert Architekturänderung → separates Feature-Ticket

**Regel:** Ein Bugfix verändert nur was kaputt ist.
Kein Refactoring, kein Cleanup nebenbei.

---

## Schritt 3 — Fix implementieren

Kleiner Fix (< 20 Zeilen, klar isoliert): Claude Code direkt  
Größerer Fix: Codex mit Ticket

Pflicht: **Regression-Test schreiben**
- Test muss vor dem Fix fehlschlagen
- Test muss nach dem Fix durchlaufen

Branch: `bugfix/IF-NNN-kurzbeschreibung`

---

## Schritt 4 — Review (Claude Code)

Wie Feature-Workflow Schritt 5.
Zusätzlich: Regression-Test vorhanden?

---

## Schritt 5 — Merge (Nutzer)

Wie Feature-Workflow.
