# REVIEW-IF-024

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-024-listing-edit-ui`  
Commit: `158afd0`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-024-listing-edit-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/listings/[lid]/edit/page.tsx` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. `setListing(data.listing)` nach erfolgreichem Speichern**

```typescript
const data = (await response.json()) as { listing: ListingDraft }
setListing(data.listing)
```

Ticket-Spec setzte nur `setSaved(true)`. Codex synchronisiert den State zusätzlich mit
der tatsächlichen API-Antwort — verhindert Drift zwischen lokalem State und DB. ✓

**2. `updateField<K extends keyof ListingDraft>()` — generische Update-Hilfsfunktion**

```typescript
function updateField<K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) {
  setListing((current) => (current ? { ...current, [key]: value } : current))
  setSaved(false)
}
```

Type-safe Updater ohne wiederholte `setState`-Boilerplate. Setzt `saved` auf `false`
wenn der Nutzer nach dem Speichern weiterbearbeitet — korrektes UX-Verhalten. ✓

**3. `handleEuroChange()` mit Validierung**

```typescript
function handleEuroChange(key: 'priceCents' | 'minimumPriceCents', event: ...) {
  const value = event.currentTarget.value
  if (key === 'minimumPriceCents' && value.trim() === '') {
    updateField(key, null)
    return
  }
  const numberValue = Number(value)
  if (Number.isNaN(numberValue) || numberValue < 0) return
  updateField(key, Math.round(numberValue * 100) as ListingDraft[typeof key])
}
```

Ticket-Spec hatte nur die Konvertierungslogik skizziert. Codex extrahiert sie in eine
eigene Funktion mit NaN-Guard und Negativwert-Schutz — korrekt und robust. ✓

**4. Responsives 2-Spalten-Layout für Preisfelder**

```typescript
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
  gap: '1rem',
}
```

Preis und Mindestpreis sowie Kategorie und Versandmodus jeweils nebeneinander auf
breiten Viewports, gestapelt auf schmalen. Spart Platz, bleibt responsive. ✓

**5. `guard` bei `handleSubmit` wenn `listing === null`**

```typescript
if (!listing) return
```

Verhindert einen TypeScript-Fehler und einen sinnlosen PATCH mit leerem Body wenn
das Listing noch nicht geladen ist. ✓

**6. Dreistelliger `listing`-Fallback-Zustand**

```tsx
{loading ? <Laden...> : listing ? <Form> : <Kein Listing gefunden.>}
```

Ticket-Spec hatte nur `loading` und `listing`. Codex behandelt zusätzlich den Fall,
dass das Laden abgeschlossen ist aber das Listing trotzdem `null` ist (z.B. 404). ✓

---

## Sicherheitsprüfung

- [x] `fetch` mit Session-Cookie (Browser schickt automatisch mit) ✓
- [x] Kein `userId` aus dem Client — Ownership via API-Middleware ✓
- [x] `readError()` verhindert Crash bei Non-JSON-Response ✓
- [x] `role="alert"` auf Fehler-Banner ✓
- [x] Negative Preise werden client-seitig abgefangen ✓

---

## Akzeptanzkriterien

- [x] `/projects/[id]/listings/[lid]/edit` lädt das Listing und zeigt alle Felder befüllt ✓
- [x] Formular speichert via PATCH, Fehlermeldung bei Fehler ✓
- [x] Erfolgshinweis "Gespeichert ✓" nach Speichern sichtbar ✓
- [x] `priceCents` als Euro dargestellt, ×100 beim Speichern ✓
- [x] `minimumPriceCents` optional — leer = `null` ✓
- [x] Buttons während Verarbeitung deaktiviert ✓
- [x] Link zurück zu Listings immer sichtbar ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Anmerkung: fehlender Edit-Link auf der Listings-Seite

Codex hat bewusst keinen Link von `listings/page.tsx` auf die Edit-Seite gesetzt —
Scope war nur die neue Datei. Das ist korrekt. Ein "Bearbeiten"-Link auf der Listings-
Seite sollte im Folge-Ticket (oder als kleiner Fix in IF-023) nachgezogen werden.

---

## Empfehlung

**approved** — Sauberste Formular-Implementierung der Reihe. `updateField<K>()` und
`handleEuroChange()` sind gut extrahierte Hilfsfunktionen, die State-Drift und NaN-Fehler
zuverlässig verhindern. Synchronisierung mit der API-Antwort nach Speichern ist ein
sinnvoller Mehrwert über den Ticket-Spec hinaus.
