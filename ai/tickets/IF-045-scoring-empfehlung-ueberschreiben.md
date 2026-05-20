# IF-045-scoring-empfehlung-ueberschreiben

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Der Nutzer kann die Scoring-Empfehlung manuell überschreiben (US-703).
Die Override-Entscheidung wird separat gespeichert, die originale
Empfehlung bleibt erhalten.

---

## Kontext

Die Scoring-Engine erzeugt eine `Recommendation` pro Item (separate Tabelle,
`RecommendationAction`-Enum). In der Praxis weicht der Nutzer davon ab.
Diese Entscheidung soll persistiert werden ohne die Engine-Empfehlung zu
überschreiben.

**Wichtig:** `InventoryItem` hat kein eigenes `scoringRecommendation`-Feld.
Die Engine-Empfehlung kommt aus der `Recommendation`-Tabelle (letzte
Empfehlung per Item). Das Override-Feld `scoringOverride` verwendet
dieselben Enum-Werte wie `RecommendationAction`.

---

## Betroffene Dateien

```
packages/db/prisma/schema.prisma                              ERWEITERN
packages/db/prisma/migrations/<timestamp>_item_override/      NEU
apps/api/app/api/projects/[id]/items/[iid]/route.ts           ERWEITERN
apps/api/app/projects/[id]/items/[iid]/edit/page.tsx          ERWEITERN
```

---

## Implementierungsdetails

### Schema-Migration

Neues Feld auf `InventoryItem`:

```prisma
scoringOverride String?   // null = kein Override, sonst RecommendationAction-Wert
```

Migration:
```sql
ALTER TABLE "InventoryItem" ADD COLUMN "scoringOverride" TEXT;
```

### API: PATCH /api/projects/:id/items/:iid — GET /api/projects/:id/items/:iid

`scoringOverride` im PATCH-Schema aufnehmen (reale Enum-Werte):

```typescript
scoringOverride: z.enum([
  'sell_individually', 'bundle', 'give_away', 'donate', 'recycle_dispose',
]).nullable().optional(),
```

`nullable()` erlaubt das Zurücksetzen (`null` = Override entfernen).

Der GET-Endpunkt muss auch die letzte `Recommendation` für das Item laden
und zurückgeben:

```typescript
// Im GET-Select:
recommendations: {
  orderBy: { createdAt: 'desc' },
  take: 1,
  select: { action: true },
},
```

Response ergänzen um `latestRecommendation: string | null`.

### UI: Item-Edit-Seite

`InventoryItem`-Typ um die Felder erweitern:

```typescript
type InventoryItem = {
  // ... bestehende Felder
  scoringOverride: string | null
  latestRecommendation: string | null
}
```

Neues Select-Feld, nur wenn `item.latestRecommendation` vorhanden:

```tsx
{item.latestRecommendation ? (
  <div style={fieldStyle}>
    <span>Empfehlung der Engine</span>
    <p style={{ margin: 0, color: '#5c5346' }}>
      {labelFor(item.latestRecommendation)}
    </p>

    <span style={{ marginTop: '0.5rem' }}>Meine Entscheidung (optional)</span>
    <select
      value={item.scoringOverride ?? ''}
      onChange={(e) =>
        updateField('scoringOverride', e.currentTarget.value || null)
      }
      disabled={saving}
      style={inputStyle}
    >
      <option value="">— Engine-Empfehlung übernehmen —</option>
      <option value="sell_individually">Einzeln verkaufen</option>
      <option value="bundle">Bündeln</option>
      <option value="give_away">Verschenken</option>
      <option value="donate">Spenden</option>
      <option value="recycle_dispose">Recyceln / Entsorgen</option>
    </select>
  </div>
) : null}
```

Hilfsfunktion:
```typescript
function labelFor(action: string): string {
  const labels: Record<string, string> = {
    sell_individually: 'Einzeln verkaufen',
    bundle: 'Bündeln',
    give_away: 'Verschenken',
    donate: 'Spenden',
    recycle_dispose: 'Recyceln / Entsorgen',
    needs_review: 'Manuelle Prüfung',
  }
  return labels[action] ?? action
}
```

---

## Akzeptanzkriterien

- [ ] Migration fügt `scoringOverride TEXT` zur `InventoryItem`-Tabelle hinzu
- [ ] GET `/api/projects/:id/items/:iid` gibt `latestRecommendation` zurück (oder `null`)
- [ ] `PATCH` akzeptiert `{ scoringOverride: 'sell_individually' | 'bundle' | ... | null }`
- [ ] `null` entfernt den Override
- [ ] Select-Feld erscheint nur wenn `latestRecommendation` vorhanden
- [ ] Enum-Werte im Select entsprechen `RecommendationAction` (`sell_individually`, nicht `sell_single`)
- [ ] Override wird nach Speichern korrekt angezeigt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-011 (Scoring API + Recommendation-Tabelle) — bereits gemergt
- IF-028 (Item-Edit-UI) — bereits gemergt

---

## Rahmenbedingungen

- `scoringOverride` überschreibt nie die `Recommendation`-Tabelle.
- `scoringOverride` ist für MVP nur zur Anzeige/Dokumentation —
  Listing-Generierung liest es noch nicht.

---

## Referenzen

Review: REVIEW-IF-045 (nach Implementierung)
