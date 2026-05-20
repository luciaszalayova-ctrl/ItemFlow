# QUESTION-044-item-status-done

Datum: 2026-05-20  
Status: `resolved`  
Erstellt von: Codex

---

## Frage

Soll der neue Item-Status `done` offiziell in das persistierte Datenmodell aufgenommen werden?

---

## Kontext

Ticket `IF-044-item-erledigt-markieren` verlangt, dass `PATCH /api/projects/:id/items/:iid`
den Status `done` akzeptiert und dass die Items-UI zwischen `done` und
`ready_for_scoring` toggeln kann.

Im aktuellen Stand ist `InventoryItem.status` jedoch ein Prisma-Enum ohne
`done`:

- `draft`
- `ready_for_scoring`
- `scored`
- `listing_created`
- `handled`

Damit ist `done` nicht nur ein UI-Thema, sondern eine Persistenzänderung mit
Auswirkungen auf:

- `packages/db/prisma/schema.prisma`
- die entsprechende Migration
- `packages/shared/src/schemas/inventory-item.ts`
- API- und UI-Logik

Das liegt außerhalb des aktuell freigegebenen Scopes von IF-044.

---

## Auswirkung

`IF-044` kann nicht korrekt implementiert werden, solange nicht entschieden ist,
ob `done` ein offizieller persistierter Status wird.

**Blockierte Tickets:**
- IF-044

---

## Erwogene Optionen

| Option | Vor- und Nachteile |
|--------|-------------------|
| `done` als offizieller Status | Korrekte Persistenz, konsistente API/UI, aber Prisma-Schema + Migration + Shared-Schemas nötig |
| Nur UI-seitiges Ausblenden ohne Persistenz | Kleinerer Scope, aber Ticket-Ziel wird fachlich verfehlt und Status geht bei Reload verloren |

---

## Empfehlung

`done` als offiziellen `InventoryItemStatus` ergänzen und IF-044 danach mit
erweitertem Scope umsetzen.

---

## Antwort

Datum: 2026-05-20  
Entschieden von: Nutzer  
Antwort: **Ja — `done` soll offiziell persistiert in die DB aufgenommen werden.**

Damit wird `done` ein offizieller persistierter Status für `InventoryItem`.
Die Umsetzung von IF-044 darf und soll daher den Scope auf Datenmodell,
Migration und Shared-Schemas erweitern.

---

## Folgeaktion

- [ ] `done` zu `InventoryItemStatus` in Prisma ergänzen
- [ ] Migration für den neuen Enum-Wert anlegen
- [ ] Shared-Schema für `InventoryItem.status` erweitern
- [ ] IF-044 mit erweitertem Scope umsetzen
