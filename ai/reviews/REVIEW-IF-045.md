# REVIEW IF-045 — Scoring-Empfehlung überschreiben

**Status: APPROVED (nach Korrektur)**
**Branch:** feature/IF-045-scoring-empfehlung-ueberschreiben
**Commit:** b6b0c6d
**Korrektur durch Claude Code:** ja (s. u.)

---

## Geprüfte Dateien

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260520161500_inventory_item_scoring_override/migration.sql`
- `packages/shared/src/schemas/inventory-item.ts`
- `apps/api/app/api/projects/[id]/items/[iid]/route.ts`
- `apps/api/app/projects/[id]/items/[iid]/edit/page.tsx`

---

## Befunde

### FINDING (korrigiert): Enum-Aliasse statt realer Werte

Codex hatte `scoringOverride` mit Alias-Werten (`sell_single`, `gift`, `recycle`) statt der realen `RecommendationAction`-Enum-Werte (`sell_individually`, `give_away`, `recycle_dispose`) implementiert. Außerdem existierte eine `mapRecommendationAction()`-Funktion, die den Mapping-Fehler in die API eingebaut hatte.

**Problem**: `scoringOverride` in der DB enthielt andere Strings als `RecommendationAction`. Jede Hintergrundlogik, die Override gegen Recommendation vergleicht, wäre kaputt.

**Korrektur in dieser Review:**

1. `packages/shared/src/schemas/inventory-item.ts` — `scoringOverride`-Enum auf reale Werte umgestellt (in `InventoryItemSchema` und `UpdateInventoryItemSchema`)
2. `apps/api/app/api/projects/[id]/items/[iid]/route.ts` — `mapRecommendationAction()` entfernt, `scoringRecommendation` gibt jetzt den rohen `action`-String aus der DB zurück
3. `apps/api/app/projects/[id]/items/[iid]/edit/page.tsx` — `<option value="...">` auf reale Werte umgestellt, `labelFor()` aktualisiert (inkl. `needs_review`-Fallback)

Typecheck nach der Korrektur: **grün**

### Positiv: isOverrideOnlyUpdate-Guard

Der PATCH-Route-Guard für `scoringOverride`-Only-Updates ist korrekt: erlaubt das Setzen des Overrides in allen Statuses außer `listing_created` und `handled`. Das ist das richtige Verhalten — ein Nutzer soll auch nach dem Scoring seine Entscheidung anpassen können.

### Positiv: Conditional Display

Das Override-Select wird nur angezeigt, wenn `item.scoringRecommendation` nicht null ist. Das ist korrekt — ohne Engine-Empfehlung gibt es nichts zu überschreiben.

### Positiv: Migration

```sql
ALTER TABLE "InventoryItem" ADD COLUMN "scoringOverride" TEXT;
```

Korrekt als `TEXT` (nicht als Prisma-Enum) — lässt Flexibilität für künftige Enum-Werte ohne Migration.

---

## Offene Risiken / Folgearbeiten

- Beim Merge IF-044 → IF-045: `UpdateInventoryItemSchema` auf IF-044 enthält noch kein `scoringOverride`. Nach dem Merge auf main muss die Shared-Schema-Datei beide Felder (`status: done` + `scoringOverride`) zusammenführen.
- Typecheck auf clean main nach allen Merges nötig.
