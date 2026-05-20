# REVIEW-IF-042

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-042-json-export`  
Commit: `6a39d44`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-042-json-export.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/export/route.ts` (neu)
- `apps/api/app/projects/[id]/listings/page.tsx` (erweitert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Wichtige Abweichung vom Ticket (korrekt)

**`prisma.listingDraft` statt `prisma.listing`:**

Das Ticket verwendete irrtümlich `prisma.listing` — das reale Modell im
Schema heißt `listingDraft`. Codex hat korrekt auf das echte Modell
angepasst. ✓

---

## Positive Abweichungen vom Ticket-Spec

**Unbekanntes Format → 400:**

```typescript
if (format !== 'json' && format !== 'csv') {
  return Response.json({ error: 'Unsupported format' }, { status: 400 })
}
```

Im Ticket nicht verlangt, aber defensiv richtig — verhindert stilles
Fallback-Verhalten bei unerwarteten Query-Parametern. ✓

**`exportSelect` als benannte Konstante:**

Hält den Query sauber und macht IF-043 (CSV-Erweiterung auf derselben
Route) einfacher nachzuvollziehen. ✓

---

## Auffälligkeit (kein Blocker)

**Zwei Export-Mechanismen auf der Listings-Seite:**

Die Seite hatte bereits einen "X freigegebene Listings exportieren"-Button
(POST → `/api/projects/:id/listings/export`, markiert Listings als
`exported`). Die neuen Buttons (`<a download>`) liegen jetzt daneben und
laden alle nicht-archivierten Listings herunter — unabhängig vom Status.

Das ist kein Bug, aber für einen Nutzer könnte der Unterschied unklar sein.
Follow-up: In einer späteren Iteration die beiden Mechanismen vereinheitlichen
oder klar beschriften.

---

## Sicherheitsprüfung

- [x] Auth + Ownership-Check vorhanden ✓
- [x] `project.status === 'deleted'` geprüft ✓
- [x] `Content-Disposition: attachment` — kein Inline-Rendering im Browser ✓
- [x] Kein direktes Durchleiten von User-Input in den Response-Body ✓

---

## Akzeptanzkriterien

- [x] `GET /api/projects/:id/export?format=json` gibt JSON zurück ✓
- [x] `Content-Disposition: attachment; filename="itemflow-export-<id>.json"` ✓
- [x] Enthält alle nicht-archivierten Listings mit Titel, Beschreibung, Preis, Status ✓
- [x] Auth + Ownership-Check vorhanden ✓
- [x] Download-Button auf der Listings-Seite vorhanden ✓
- [x] Klick löst Browser-Download aus ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Spec vollständig erfüllt, Modellanpassung korrekt.
Zwei-Mechanismen-Auffälligkeit als Follow-up notieren.
