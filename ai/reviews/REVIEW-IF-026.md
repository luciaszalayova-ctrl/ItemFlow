# REVIEW-IF-026

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-026-bundles-ui`  
Commit: `1553713`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-026-bundles-ui.md`

Geänderte Dateien:
- `apps/api/app/projects/[id]/bundles/page.tsx` (neu)
- `apps/api/app/projects/[id]/listings/page.tsx` (erweitert — Edit-Link)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**1. Dreistelliger Leer-Zustand — `hasNoData` vor `bundles.length === 0`**

```typescript
const hasNoData = !loading && bundles.length === 0 && items.length === 0
```

```tsx
{hasNoData ? (
  <section>Noch keine Daten vorhanden — zuerst Items erzeugen</section>
) : bundles.length === 0 ? (
  <section>Noch keine Bundles — Formular oben nutzen</section>
) : (
  <ul>...</ul>
)}
```

Unterscheidet sauber zwischen „Projekt leer" und „Projekt hat Items, aber noch keine
Bundles". Ticket-Spec hatte nur einen Leer-Zustand. ✓

**2. `cursor: 'not-allowed'` wenn `selectedIds.size < 2`**

```typescript
cursor: creating || selectedIds.size < 2 ? 'not-allowed' : 'pointer',
```

Ticket-Spec hatte `cursor: 'progress'` generisch. `not-allowed` ist semantisch korrekter
für einen disabled-Submit-Button (nicht blockiert durch laufenden Request, sondern durch
fehlende Auswahl). ✓

**3. Disabled-Label-Styling für gesperrte Items**

```typescript
color: disabled ? '#9b8f7b' : '#5c5346',
```

Deaktivierte Items (status `listing_created`/`handled`) sind visuell gedämpft —
nicht nur die Checkbox, sondern das gesamte Label. ✓

**4. `setError(null)` beim Toggle des Erstell-Formulars**

```typescript
onClick={() => { setShowCreateForm((current) => !current); setError(null) }}
```

Alten Fehler wegräumen wenn das Formular geöffnet oder geschlossen wird. ✓

**5. Edit-Link korrekt in `<div>` integriert bei `draft`**

```tsx
<div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
  <button>Freigeben</button>
  <Link>Bearbeiten →</Link>
</div>
```

Freigeben + Bearbeiten in einer Flex-Zeile — kompakter als zwei separate Blöcke. ✓

---

## Sicherheitsprüfung

- [x] `fetch` mit Session-Cookie automatisch ✓
- [x] Kein `userId` aus dem Client ✓
- [x] `readError()` auf allen drei Actions ✓
- [x] `role="alert"` auf Fehler-Banner ✓
- [x] `type="button"` auf allen Buttons außer Submit ✓
- [x] Items mit status `listing_created`/`handled` im Formular disabled ✓

---

## Akzeptanzkriterien

- [x] Lädt Items + Bundles parallel via `Promise.all` mit `ignore`-Flag ✓
- [x] Toggle für Bundle-Erstell-Formular ✓
- [x] Mindestens 2 Items — sonst Fehlermeldung ✓
- [x] Items mit `listing_created`/`handled` deaktiviert ✓
- [x] Erstellen → Bundle erscheint in Liste ohne Reload ✓
- [x] Akzeptieren/Ablehnen für `suggested`-Bundles ✓
- [x] "Listing erstellen" für `accepted`-Bundles ✓
- [x] `listing_created`: Link zu Listings-Seite ✓
- [x] `rejected`: gedämpfter Hinweistext ✓
- [x] Edit-Link in `listings/page.tsx` für `draft` und `reviewed` ✓
- [x] Kein Edit-Link bei `exported` ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Vollständige, gut durchdachte Implementierung. Der dreistufige
Leer-Zustand und das semantisch korrekte `cursor: 'not-allowed'` sind kleine aber
nützliche Verbesserungen. Edit-Link auf der Listings-Seite korrekt integriert.
