# REVIEW IF-044 — Item erledigt markieren

**Status: APPROVED**
**Branch:** feature/IF-044-item-erledigt-markieren
**Commit:** d6f76f6

---

## Geprüfte Dateien

- `packages/db/prisma/schema.prisma`
- `packages/db/prisma/migrations/20260520160000_inventory_item_done_status/migration.sql`
- `packages/shared/src/schemas/inventory-item.ts`
- `apps/api/app/api/projects/[id]/items/[iid]/route.ts`
- `apps/api/app/projects/[id]/items/page.tsx`

---

## Befunde

### Migration: `IF NOT EXISTS` — positiv

```sql
ALTER TYPE "InventoryItemStatus" ADD VALUE IF NOT EXISTS 'done';
```

Sicherer als das Ticket gefordert hat — idempotent bei erneutem Ausführen.

### PATCH-Guard: isStatusOnlyUpdate

Der Route-Guard erlaubt `done`-Übergänge von `ready_for_scoring`, `scored` und `done` (bereits erledigt → kein Fehler). Das ist korrekt. Der Toggle kehrt immer zu `ready_for_scoring` zurück, auch wenn der Ausgangsstatus `scored` war. Das ist eine bewusste MVP-Vereinfachung: Das Scoring muss wiederholt werden, wenn ein erledigter Artikel zurückgesetzt wird. Akzeptabel.

### Zod-Schema: status-Enum

`UpdateInventoryItemSchema.status` erlaubt `['ready_for_scoring', 'scored', 'done']` — korrekt. Der ursprüngliche Status `draft` ist ausgeschlossen (kann nur über edit-Formular geändert werden), `listing_created` und `handled` ebenfalls — sinnvoll.

### UI: hideDone-Filter und Toggle-Button

`hideDone` State mit Default `true` entspricht dem Ticket. Visuelles Feedback (`doneButtonActiveStyle`) vorhanden. `formatStatus('done') → 'Erledigt'` korrekt.

---

## Offene Risiken / Folgearbeiten

- Beim Merge mit IF-045 (`scoringOverride`-Feld) muss `UpdateInventoryItemSchema` beider Branches zusammengeführt werden — kein Konflikt zu erwarten, aber prüfen.
- Typecheck nach Merge auf main nötig (fremde Änderungen blockierten auf beiden Branches).
