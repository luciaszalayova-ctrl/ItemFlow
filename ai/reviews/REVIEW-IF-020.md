# REVIEW-IF-020

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-020-upload-ui`  
Commit: `d26ca02`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-020-upload-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/upload/page.tsx` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `form.reset()` nach erfolgreichem Upload**

Das Ticket spezifizierte kein Form-Reset. Codex leert das File-Input nach erfolgreichem
Upload — Nutzer kann direkt ein weiteres Bild hochladen ohne die Seite neu zu laden. ✓

**2. Robuste Fehler-Extraktion aus der API-Response**

```typescript
try {
  const data = await response.json()
  if (typeof data.error === 'string') message = data.error
} catch {
  // Keep fallback message if server response is not JSON.
}
```

`try/catch` um `response.json()` im Fehlerfall — verhindert Crash wenn der Server
kein JSON zurückgibt. ✓

**3. Doppelte Kandidaten-Zählung (`candidateCount ?? candidates?.length`)**

API von IF-007 gibt `candidates` als Array zurück, nicht `candidateCount`.
Codex behandelt beide Fälle:
```typescript
data.candidateCount ?? data.candidates?.length ?? 0
```
→ Defensiv gegen unterschiedliche Response-Shapes. ✓

---

## Sicherheitsprüfung

- [x] Kein `Content-Type`-Header gesetzt — Browser setzt `multipart/form-data` automatisch ✓
- [x] `accept="image/*"` auf File-Input ✓
- [x] Fehlermeldung generisch wenn API-Error kein String ist
- [x] `role="alert"` auf Fehlermeldung ✓

---

## Akzeptanzkriterien

- [x] Datei-Input + Upload-Button vorhanden
- [x] Button deaktiviert während Upload ✓
- [x] Anzahl erkannter Candidates nach Upload angezeigt ✓
- [x] Link zu `/projects/[id]/candidates` nach Upload sichtbar ✓
- [x] Fehlermeldung bei fehlgeschlagenem Upload ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere Umsetzung mit drei sinnvollen Robustheit-Verbesserungen
über den Ticket-Spec hinaus.
