# REVIEW-IF-037

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-037-kandidaten-bearbeiten`  
Commit: `25bf8ef`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-037-kandidaten-bearbeiten.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/candidates/[cid]/route.ts` (erweitert)
- `apps/api/app/projects/[id]/candidates/page.tsx` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Sicherheitsprüfung

- [x] Ownership-Check unverändert erhalten ✓
- [x] `candidate.status !== 'pending'` Guard gilt auch für Feld-Updates ✓
- [x] `!('action' in parsed.data)` — TypeScript-Narrowing statt string-Vergleich ✓

---

## Positive Abweichungen vom Ticket-Spec

**`DeleteProjectButton` als eigene Datei statt inline:**

Codex hat den Client Component in eine separate
`delete-project-button.tsx` ausgelagert statt ihn inline in `page.tsx` zu
definieren. Sauberer als die Ticket-Empfehlung. ✓

**Disabled-Guard für den Bearbeiten-Button:**

```typescript
disabled={
  saving ||
  processing !== null ||
  (editingId !== null && editingId !== candidate.id)
}
```

Verhindert, dass während eines laufenden PATCH (accept/reject oder save) ein
zweiter Edit-Modus geöffnet werden kann. Im Ticket nicht explizit spezifiziert,
aber korrekt. ✓

**`readError()` als Modulfunktion:**

Konsistent mit dem Pattern aus `items/page.tsx` und `listings/page.tsx`. ✓

---

## Beobachtungen

**Client-seitige Validation erfordert beide Felder:**

```typescript
if (!normalizedName || !category) {
  setError('Name und Kategorie dürfen nicht leer sein.')
  return
}
```

Das API-Schema erlaubt Updates mit nur einem Feld — die UI fordert beide.
Das ist strenger als die Spec, aber sinnvoll: leere Felder ergeben keinen
nutzbaren Kandidaten. Kein Blocker.

**`saving` korrekt in `cancelEdit()` zurückgesetzt:**

```typescript
function cancelEdit() {
  setEditingId(null)
  setEditName('')
  setEditCategory('')
  setSaving(false)   // ✓
}
```

Verhindert, dass `saving: true` im State bleibt wenn der Nutzer abbricht. ✓

---

## Akzeptanzkriterien

- [x] PATCH mit `{ normalizedName, category }` aktualisiert den Kandidaten ✓
- [x] PATCH mit `{ action }` funktioniert unverändert ✓
- [x] Feld-Update nur auf `pending`-Kandidaten → sonst `409` ✓
- [x] Mindestens ein Feld bei Update-Payload → sonst `400` ✓
- [x] "Bearbeiten"-Button öffnet Inline-Felder mit aktuellen Werten ✓
- [x] "Speichern" schickt PATCH und aktualisiert die Anzeige ✓
- [x] "Abbrechen" schließt Edit-Mode ohne Request ✓
- [x] Nur ein Kandidat gleichzeitig im Edit-Mode ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere Umsetzung. Disabled-Guard und `cancelEdit`-Reset
sind die richtigen Details für einen robusten Inline-Edit.
