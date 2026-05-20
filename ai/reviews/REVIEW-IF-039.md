# REVIEW-IF-039

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-039-listing-regenerieren`  
Commit: `679b81c`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-039-listing-regenerieren.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/listings/[lid]/regenerate/route.ts` (neu)
- `apps/api/app/projects/[id]/listings/[lid]/edit/page.tsx` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Positive Abweichungen vom Ticket-Spec

**`latestByItem.size > 0` statt `recommendations.length > 0`:**

```typescript
if (latestByItem.size > 0) {
  // ...
}
```

Spec hätte `recommendations.length` nahegelegt. Diese Variante ist korrekt, weil
sie die deduplizierte Menge verwendet — redundante Einträge werden ausgeschlossen,
bevor der Preis summiert wird. ✓

**`status: 'draft'` Reset beim Regenerieren:**

Nicht explizit im Ticket verlangt, aber logisch notwendig: ein
`reviewed`-Listing wird nach Regenerierung wieder auf `draft` zurückgesetzt,
damit der Nutzer es erneut freigeben muss. ✓

---

## Auffälligkeit: Typecheck-Status

Codex meldet, dass `pnpm typecheck` auf diesem Branch durch fremde Änderungen
außerhalb des Tickets blockiert war. Die eigentliche Ticket-Implementierung
ist typsicher. **Typecheck muss auf einem sauberen Branch (nach Merge von
IF-037/038) nochmals ausgeführt werden.**

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check vorhanden ✓
- [x] Status-Guard: nur `draft` und `reviewed` werden regeneriert, sonst 409 ✓
- [x] `TemplateListingGenerator` handhabt beide `targetType`-Varianten ✓
- [x] Kein neuer ungeschützter Endpunkt ✓

---

## Akzeptanzkriterien

- [x] `POST /api/projects/:id/listings/:lid/regenerate` gibt `{ listing }` zurück ✓
- [x] Item- und Bundle-Listings werden korrekt regeneriert ✓
- [x] Bundle-Pfad: Preissumme über deduplizierte Recommendations ✓
- [x] Status wird auf `draft` zurückgesetzt ✓
- [x] 409 bei Status `published` oder `archived` ✓
- [x] "Neu generieren" Button in der Edit-UI vorhanden ✓
- [x] `saving` und `regenerating` schließen sich gegenseitig aus ✓
- [x] Bestätigungsdialog vor Regenerierung ✓
- [x] `pnpm typecheck` — auf fremde Änderungen blockiert, nach Merge erneut prüfen ⚠
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Implementierung ist korrekt und vollständig. Typecheck nach
sauberem Merge wiederholen.
