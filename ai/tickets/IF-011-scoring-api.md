# IF-011-scoring-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `draft`

---

## Zusammenfassung

Scoring-API implementieren — `POST /api/projects/[id]/items/[iid]/score` führt die
`RuleBasedScoringEngine` auf einem InventoryItem aus, speichert das Ergebnis als
`Recommendation` in der DB und setzt den Item-Status auf `scored`.

---

## Kontext

- `RuleBasedScoringEngine`: `packages/scoring/src/engines/rule-based.ts`
- `ScoringEngine`-Interface + `DEFAULT_THRESHOLDS`: `packages/scoring/src/index.ts`
- `Recommendation`-Modell: `packages/db/prisma/schema.prisma`
- `RecommendationSchema`: `packages/shared/src/schemas/recommendation.ts`
- Auth/Session-Pattern: `ai/context/project-snapshot.md`

---

## Ziel

Nach diesem Ticket bekommt ein Item eine regelbasierte Empfehlung
(`sell_individually`, `bundle`, `give_away`, ...) mit Begründung und Preisschätzung.
Das ist der Kern der Nutzererfahrung im MVP.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/items/[iid]/score/route.ts   NEU — POST
apps/api/package.json                                        @itemflow/scoring ergänzen
```

---

## Implementierungsdetails

### `POST /api/projects/[id]/items/[iid]/score`

```typescript
import { RuleBasedScoringEngine } from '@itemflow/scoring'

// 1. Item laden und Ownership prüfen
const item = await prisma.inventoryItem.findUnique({ where: { id: iid } })
if (!item) return Response.json({ error: 'Not found' }, { status: 404 })
// Ownership via Projekt prüfen

// 2. Nur scoreable Items
const SCOREABLE_STATUSES = ['draft', 'ready_for_scoring']
if (!SCOREABLE_STATUSES.includes(item.status)) {
  return Response.json({ error: 'Item already scored or handled' }, { status: 409 })
}

// 3. Scoring ausführen
const engine = new RuleBasedScoringEngine()
const result = engine.scoreItem({ item })

// 4. Recommendation in DB speichern
const recommendation = await prisma.recommendation.create({
  data: {
    projectId: item.projectId,
    targetType: 'item',
    targetId: item.id,
    action: result.action,
    expectedPriceCents: result.expectedPriceCents,
    minimumPriceCents: result.minimumPriceCents,
    effortScore: result.effortScore,
    demandScore: result.demandScore,
    confidence: result.confidence,
    rationale: result.rationale,
  }
})

// 5. Item-Status auf 'scored' setzen
await prisma.inventoryItem.update({
  where: { id: iid },
  data: { status: 'scored' }
})

return Response.json({
  recommendation: {
    id: recommendation.id,
    action: recommendation.action,
    confidence: recommendation.confidence,
    rationale: recommendation.rationale,
    expectedPriceCents: recommendation.expectedPriceCents,
    minimumPriceCents: recommendation.minimumPriceCents,
    isSensitiveCategory: result.isSensitiveCategory,
  }
}, { status: 201 })
```

### `@itemflow/scoring` in `apps/api/package.json` ergänzen

```json
"@itemflow/scoring": "workspace:*"
```

Dazu `@itemflow/scoring` als Reference in `apps/api/tsconfig.json`:
```json
{ "path": "../../packages/scoring" }
```

---

## Akzeptanzkriterien

- [ ] `POST /api/projects/[id]/items/[iid]/score` gibt Recommendation zurück
- [ ] `Recommendation` ist in DB gespeichert
- [ ] Item-Status ist nach dem Aufruf `scored`
- [ ] Zweiter Aufruf auf bereits `scored` Item gibt `409`
- [ ] `isSensitiveCategory` ist in Response enthalten (für UI-Warnhinweis)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- `RuleBasedScoringEngine` mit `DEFAULT_THRESHOLDS` — keine eigene Threshold-Konfiguration
- Scoring-Ergebnis **nicht** als rohen JSON-Blob speichern — nur validierte Felder in `Recommendation`
- `isSensitiveCategory` wird in Response mitgeschickt, aber nicht in DB gespeichert (ist ableitbar)
- Kein Re-Scoring über diese Route — `409` wenn bereits `scored`

---

## Abhängigkeiten

- IF-003 (RuleBasedScoringEngine) — merged ✓
- IF-010 (Items API) — Item muss existieren

---

## Referenzen

Review: REVIEW-IF-011 (nach Implementierung)

## Scope-Grenze

Nicht Teil dieses Tickets:
- Bundle-Scoring
- Manuelle Threshold-Überschreibung
- Re-Scoring (Status zurücksetzen)
- Scoring-Ergebnis in der Items-List-Response einbetten
