# REVIEW-IF-038

Datum: 2026-05-20  
Reviewer: Claude Code  
Branch: `feature/IF-038-projekt-loeschen`  
Commit: `86a6609`  
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-038-projekt-loeschen.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/route.ts` (DELETE ersetzt)
- `apps/api/app/projects/[id]/page.tsx` (Button ergänzt)
- `apps/api/app/projects/[id]/delete-project-button.tsx` (neu)

---

## Kritische Probleme (Blocker)

Keine.

---

## Sicherheitsprüfung

- [x] Ownership-Check unverändert (`project.userId !== session.user.userId` → 403) ✓
- [x] `Promise.allSettled` — Storage-Fehler blockieren DB-Löschung nicht ✓
- [x] `prisma.project.delete()` mit Cascade — alle verknüpften Records entfernt ✓
- [x] GET-Route unverändert ✓

---

## Positive Abweichung vom Ticket-Spec

**`DeleteProjectButton` als eigene Datei:**

```
apps/api/app/projects/[id]/delete-project-button.tsx
```

Klarer als ein inline `'use client'`-Component in der Server Component Datei.
Die Import-Zeile in `page.tsx` macht die Grenze sichtbar. ✓

---

## Beobachtung: toter Code im GET-Handler

```typescript
if (!project || project.status === 'deleted') {
  return Response.json({ error: 'Not found' }, { status: 404 })
}
```

Nach dem Wechsel auf Hard-Delete kann `status === 'deleted'` nicht mehr
auftreten — der Check ist dead code. Harmlos und defensiv sinnvoll für den
Fall, dass Soft-Delete-Daten aus früheren Versionen noch in der DB liegen.
Kein Blocker.

---

## Akzeptanzkriterien

- [x] DELETE löscht Assets aus Storage ✓
- [x] DELETE löscht Projekt und alle verknüpften Records per Cascade ✓
- [x] Storage-Fehler blockieren DB-Löschung nicht ✓
- [x] Falsches Projekt → `404`, fremdes Projekt → `403` ✓
- [x] "Projekt löschen"-Button auf der Projektdetail-Seite ✓
- [x] Bestätigungsdialog vor dem Löschen ✓
- [x] Nach Löschen: Weiterleitung auf `/projects` ✓
- [x] `pnpm typecheck` grün ✓
- [x] `pnpm lint` grün ✓

---

## Empfehlung

**approved** — Spec korrekt umgesetzt. `Promise.allSettled` und
`prisma.project.delete()` mit Cascade sind die richtigen Werkzeuge.
