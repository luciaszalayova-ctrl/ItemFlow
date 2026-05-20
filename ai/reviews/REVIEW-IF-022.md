# REVIEW-IF-022

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-022-items-ui`  
Commit: `0478c21`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-022-items-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/items/page.tsx` (neu)

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

Gleiche Technik wie IF-021. Verhindert State-Updates nach Component-Unmount. ✓

**2. `readError()` als eigenständige async Hilfsfunktion**

```typescript
async function readError(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as { error?: string }
    return typeof data.error === 'string' ? data.error : fallback
  } catch {
    return fallback
  }
}
```

Extrahiert das robuste Fehler-Parsing-Muster aus IF-020/021 in eine wiederverwendbare
Funktion — vermeidet Code-Duplikation zwischen `handleScore` und `handleGenerateListing`. ✓

**3. `minimumPriceCents` im Recommendation-Typ**

Ticket spezifizierte `expectedPriceCents`. Codex hat `minimumPriceCents?: number | null`
optional hinzugefügt — passt zur Scoring-API aus IF-012 und ermöglicht spätere Anzeige. ✓

**4. `isSensitiveCategory`-Warnung mit `role="alert"`**

```tsx
{score.isSensitiveCategory ? (
  <p role="alert" style={{ background: '#fff0cc', color: '#7a4d00' }}>
    Sensible Kategorie — bitte Listing sorgfältig prüfen.
  </p>
) : null}
```

Ticket erwähnte das nicht explizit — sinnvoll für Human-in-the-Loop-Sicherheit. ✓

**5. `formatStatus()` und `formatEuro()` als separate Hilfsfunktionen**

Klare Trennung von Formatierungslogik und Rendering. `formatEuro()` dividiert durch 100
und formatiert auf 2 Dezimalstellen — korrekt für Cent-Werte. ✓

**6. `hasListings`-Computed für Bottom-Link**

```typescript
const hasListings = items.some((item) => item.status === 'listing_created')
```

Zeigt den "Zu den Listings"-Link am Seitenende nur wenn tatsächlich Listings existieren. ✓

---

## Sicherheitsprüfung

- [x] `fetch` mit Session-Cookie (Browser schickt automatisch mit) ✓
- [x] Kein `userId` aus dem Client — Ownership via API-Middleware ✓
- [x] `readError()` zeigt generische Meldung wenn API kein JSON liefert ✓
- [x] `role="alert"` auf Error-Banner und Sensitive-Category-Warnung ✓

---

## Akzeptanzkriterien

- [x] Listet alle Items des Projekts ✓
- [x] Status-Badge pro Item ✓
- [x] Score-Button für `ready_for_scoring`-Items → POST `.../score` ✓
- [x] Scoring-Ergebnis (Empfehlung, Preis, Rationale) wird angezeigt ✓
- [x] Listing-Button für `scored`-Items → POST `.../listing` ✓
- [x] Buttons während Verarbeitung deaktiviert + visuelles Feedback ✓
- [x] Leere Liste: Hinweistext + Link zu Candidates ✓
- [x] "Zu den Listings"-Link wenn mind. ein Listing erstellt ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Konsequente Weiterentwicklung der Muster aus IF-020/021.
`readError()` als extrahierte Hilfsfunktion ist eine sinnvolle Verbesserung,
`isSensitiveCategory`-Warnung passt gut zum Human-in-the-Loop-Ansatz des Projekts.
