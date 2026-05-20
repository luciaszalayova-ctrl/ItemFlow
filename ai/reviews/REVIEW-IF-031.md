# REVIEW-IF-031

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-031-bundle-listing-generator`  
Commit: `9078bd9`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-031-bundle-listing-generator.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/bundles/[bid]/listing/route.ts` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Abweichungen vom Ticket-Spec

Keine — exakte Umsetzung nach Spec.

---

## Sicherheitsprüfung

- [x] Ownership-Check unverändert erhalten ✓
- [x] `findMany({ where: { ..., projectId } })` — keine Cross-Project-Leaks bei Item- und Recommendations-Abfragen ✓
- [x] `GeneratedListingSchema.parse(raw)` — KI-Ausgabe validiert ✓
- [x] Atomare Transaktion für listingDraft + bundle.update ✓

---

## Beobachtungen

**Doppel-`?? undefined` ist redundant aber harmlos:**

```typescript
suggestedPriceCents: suggestedPriceCents ?? undefined,
minimumPriceCents: minimumPriceCents ?? undefined,
```

`suggestedPriceCents` ist bereits `number | undefined` — `?? undefined` hat keine
Wirkung. Kein Blocker.

---

## Akzeptanzkriterien

- [x] `TemplateListingGenerator.generate()` statt `generateListingDraft()` ✓
- [x] Bundle-Items aus DB geladen und als `bundleItems` übergeben ✓
- [x] Neueste Recommendation pro Item dedupliziert ✓
- [x] Preis = Summe `expectedPriceCents`, Mindestpreis = Summe `minimumPriceCents` ✓
- [x] Fallback auf Generator-Default wenn keine Recommendations ✓
- [x] `GeneratedListingSchema.parse()` aktiv ✓
- [x] Atomare Transaktion unverändert ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Saubere, minimale Änderung. Bundle-Listings sind jetzt auf demselben
Stand wie Item-Listings.
