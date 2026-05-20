# REVIEW-IF-021

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-021-candidates-ui`  
Commit: `9fb0b1b`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-021-candidates-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/candidates/page.tsx` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `ignore`-Flag im `useEffect` — React Strict Mode / Unmount-Safety**

```typescript
let ignore = false
// ...
return () => { ignore = true }
```

Verhindert State-Updates nach Component-Unmount (Race Condition bei schnellem
Navigieren). Das Ticket spezifizierte diesen Schutz nicht.
→ Korrekte React-Best-Practice. ✓

**2. Fehlerbehandlung beim Laden + beim Action-Call**

Fehler-State auch beim initialen Laden der Candidates — nicht nur beim Accept/Reject.
Robuste JSON-Extraktion mit `try/catch` (gleiche Technik wie IF-020). ✓

**3. `rawLabel` pro Candidate sichtbar**

Zeigt neben `normalizedName` auch den ursprünglichen `rawLabel` — hilfreich wenn
die KI-Normalisierung abweicht und der Nutzer prüfen will was tatsächlich erkannt wurde.
→ Sinnvolle Transparenz. ✓

**4. `type="button"` auf beiden Buttons**

Verhindert unbeabsichtigtes Form-Submit falls die Buttons jemals in einem `<form>`
landen. ✓

---

## Sicherheitsprüfung

- [x] `fetch` mit Session-Cookie (Browser schickt automatisch mit) ✓
- [x] Kein `userId` aus dem Client — Ownership via API-Middleware ✓
- [x] Fehlerfall zeigt generische Meldung, kein API-Internals-Leak ✓

---

## Akzeptanzkriterien

- [x] Listet alle `pending` Candidates ✓
- [x] Akzeptieren-Button → PATCH `accept`, Candidate aus Liste entfernt ✓
- [x] Ablehnen-Button → PATCH `reject`, Candidate aus Liste entfernt ✓
- [x] Buttons während Verarbeitung deaktiviert ✓
- [x] Leere Liste: Hinweistext + Link zu Items ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Beste UI-Implementierung bisher. `ignore`-Flag, differenzierte
Fehlerbehandlung und `rawLabel`-Anzeige sind allesamt sinnvolle Verbesserungen
über den Ticket-Spec hinaus.
