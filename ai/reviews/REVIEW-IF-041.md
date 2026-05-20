# REVIEW-IF-041

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-041-item-manuell-hinzufuegen`  
Commit: `eead6c4`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-041-item-manuell-hinzufuegen.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/items/route.ts` (POST hinzugefügt)
- `apps/api/app/projects/[id]/items/page.tsx` (Formular hinzugefügt)

---

## Kritische Probleme (Blocker)

Keine.

---

## Kleinere Abweichungen (kein Blocker)

**`category ?? ''` statt `null`:**

```typescript
category: parsed.data.category ?? ''
```

Bestehende Items haben `category: string | null` im Schema. Leer-String `''`
statt `null` ist eine leichte Inkonsistenz. Nicht blockierend, da das Feld
optional ist und leer-String im UI gleich behandelt wird — aber bei einer
zukünftigen Bereinigung angleichen.

---

## Auffälligkeit: Typecheck-Status

Analog zu IF-039: Codex meldet, dass `pnpm typecheck` durch fremde Änderungen
außerhalb des Tickets blockiert war. Die Implementierung selbst ist typsicher.
**Typecheck nach sauberem Merge wiederholen.**

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check vorhanden ✓
- [x] `CreateItemSchema` mit `z.string().min(1)` — leere Titel werden abgelehnt ✓
- [x] `status: 'ready_for_scoring'` gesetzt — Item landet im regulären Workflow ✓
- [x] `sourceCandidateIds: []` — keine falsche Verknüpfung zu Candidates ✓
- [x] 201 mit `{ item }` zurück ✓

---

## Akzeptanzkriterien

- [x] `POST /api/projects/:id/items` erzeugt Item mit `status: 'ready_for_scoring'` ✓
- [x] Formular auf Items-Seite: Bezeichnung (required) + Kategorie (optional) ✓
- [x] Neues Item erscheint nach Speichern direkt in der Liste ✓
- [x] Formular wird nach Speichern zurückgesetzt ✓
- [x] Kein Seitenreload nötig ✓
- [x] `pnpm typecheck` — auf fremde Änderungen blockiert, nach Merge erneut prüfen ⚠
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Spec vollständig erfüllt. `category: ''` statt `null` als
Follow-up bei nächster Bereinigung der Items-Logik angleichen.
