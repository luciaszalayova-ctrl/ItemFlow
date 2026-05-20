# IF-014-listing-approve-api

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Listing-Approval-API implementieren — `POST /api/projects/[id]/listings/[lid]/approve` setzt einen
`draft`-Listing auf `reviewed`. Das ist der Human-in-the-Loop-Schritt: der Nutzer bestätigt, dass
der Entwurf korrekt und freigabebereit ist.

---

## Kontext

- `ListingDraft`-Modell + `ListingStatus`: `packages/db/prisma/schema.prisma`
- `ListingStatusSchema`: `packages/shared/src/schemas/listing-draft.ts`
- Auth/Session-Pattern: wie in IF-008 bis IF-013
- Kern-Designprinzip: Niemals automatisch veröffentlichen — Nutzerfreigabe ist Pflicht

---

## Ziel

Nach diesem Ticket kann ein Nutzer einen Listing-Entwurf explizit als "geprüft" markieren.
`reviewed`-Listings können danach in IF-015 exportiert werden. Ohne diesen Schritt darf kein
Listing exportiert oder veröffentlicht werden.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/listings/[lid]/approve/route.ts   NEU — POST
```

---

## Implementierungsdetails

### `POST /api/projects/[id]/listings/[lid]/approve`

```typescript
// POST /api/projects/[id]/listings/[lid]/approve
// 1. Auth + Ownership via Projekt (gleicher Ansatz wie IF-012/013)
// 2. ListingDraft laden (findFirst mit { id: lid, projectId })
//    → 404 wenn nicht gefunden

// 3. Status-Prüfung: nur 'draft' kann approved werden
if (listing.status !== 'draft') {
  // 'reviewed' → 409 'Listing already approved'
  // alles andere → 409 'Listing cannot be approved in current status'
  return Response.json({ error: 'Listing cannot be approved in current status' }, { status: 409 })
}

// 4. Status auf 'reviewed' setzen
const updated = await prisma.listingDraft.update({
  where: { id: listing.id },
  data: { status: 'reviewed' }
})

return Response.json({ listing: updated }, { status: 200 })
```

---

## Akzeptanzkriterien

- [ ] `POST .../approve` setzt `draft` → `reviewed`, gibt `200` mit aktualisierten Draft zurück
- [ ] `409` wenn Listing bereits `reviewed` oder in anderem nicht-approverbaren Status
- [ ] `404` wenn Listing nicht gefunden
- [ ] `403` bei fremdem Projekt
- [ ] Kein Request-Body erforderlich (leerer POST reicht)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Nur `draft` → `reviewed` über diese Route — kein Überspringen anderer Zustände
- Kein automatisches Veröffentlichen — diese Route macht ausschließlich `reviewed`, nie mehr
- Kein Request-Body-Schema nötig — der Endpunkt ist intentional bodyless
- Ownership immer via Projekt prüfen

---

## Abhängigkeiten

- IF-013 (Listings CRUD) — Listing muss existieren und editierbar sein
- IF-012 (Listing Generation) — erstellt den initialen Draft

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Export oder Veröffentlichung (IF-015)
- Approval rückgängig machen (kein "unapprove")
- Bundle-Listings approven
- MarketplaceActionLog bei Approval schreiben

---

## Referenzen

Review: REVIEW-IF-014 (nach Implementierung)
