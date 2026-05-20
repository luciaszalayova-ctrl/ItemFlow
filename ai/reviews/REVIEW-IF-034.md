# REVIEW-IF-034

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-034-chatgpt-import-ui`  
Commit: `dfd8aed`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-034-chatgpt-import-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/import/page.tsx` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. Prompt direkt als Konstante im Component**

```typescript
const MANUAL_PROMPT = `Analysiere das/die Bild(er) ...`
```

Kein separater Fetch, kein prop-drilling — der Prompt ist sofort verfügbar und
identisch mit `docs/PROMPTS.md`. ✓

**2. `onChange` setzt Fehler zurück**

```tsx
onChange={(event) => {
  setJson(event.target.value)
  setParseError(null)
  setError(null)
}}
```

Die Fehlermeldung verschwindet sobald der Nutzer tippt — ohne dass er
nochmal "Vorschau" drücken muss. Bessere UX als im Spec. ✓

**3. `uncertaintyNotes` in der Vorschau**

```tsx
{candidate.uncertaintyNotes ? (
  <p style={{ margin: 0, color: '#7a6040' }}>
    Hinweis: {candidate.uncertaintyNotes}
  </p>
) : null}
```

Im Ticket nicht explizit verlangt, aber sinnvoll — ChatGPT gibt
Unsicherheitshinweise zurück und der Nutzer sieht sie vor dem Import. ✓

---

## Sicherheitsprüfung

- [x] Kein Server-Call vor der Vorschau — JSON wird nur client-seitig geparst ✓
- [x] `z.array(VisionCandidateRawSchema).safeParse()` — Validation vor dem POST ✓
- [x] `readError()` Pattern — kein unhandled Parse-Error bei API-Fehler ✓
- [x] `void handleImport()` / `void handleCopyPrompt()` — keine unhandled-Promise-Warnings ✓

---

## Beobachtung: `setSubmitting(false)` nach Weiterleitung

Im Erfolgsfall:

```typescript
router.push(`/projects/${projectId}/candidates`)
// kein setSubmitting(false) danach
```

Das ist korrekt — nach `router.push()` wird der Component unmounted,
der State existiert nicht mehr. Das `setSubmitting(false)` im Fehlerfall
ist vorhanden. ✓

---

## Akzeptanzkriterien

- [x] Seite erreichbar unter `/projects/:id/import` ✓
- [x] Textarea nimmt JSON-Input entgegen ✓
- [x] Ungültiges JSON → verständliche Fehlermeldung ✓
- [x] Gültiges JSON → Vorschau mit Name, Kategorie, Confidence ✓
- [x] "Importieren" deaktiviert solange keine gültige Vorschau ✓
- [x] Erfolgreicher Import → Weiterleitung nach `/projects/:id/candidates` ✓
- [x] API-Fehler → Fehlermeldung auf der Seite ✓
- [x] ChatGPT-Prompt sichtbar (toggle + Kopieren-Button) ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Hinweis: nicht im Browser getestet

Wie bei IF-032. `navigator.clipboard`, `router.push()` und die
Textarea-Interaktion sind Standard-Patterns — kein strukturelles Risiko.
Empfehlung: nach dem Merge einmal manuell durchklicken.

---

## Empfehlung

**approved** — Spec vollständig erfüllt, mit sinnvollen UX-Extras
(onChange-Reset, uncertaintyNotes-Anzeige). Konsistenter Stil mit dem
restlichen Projekt.
