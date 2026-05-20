# IF-035-import-link-projekt

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Den ChatGPT-Import-Link auf der Projektdetail-Seite ergänzen, damit Nutzer die
Import-Seite (IF-034) direkt aus dem Workflow heraus erreichen.

---

## Kontext

`apps/api/app/projects/[id]/page.tsx` ist ein Server Component mit einem
`nextSteps`-Array. Die Import-Seite (`/projects/:id/import`) ist nach IF-034
erreichbar, wird aber nirgends verlinkt.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/page.tsx    ERWEITERN
```

---

## Implementierungsdetails

Im `nextSteps`-Array einen zweiten Eintrag nach "Fotos hochladen" einfügen:

```typescript
const nextSteps = [
  {
    href: `/projects/${id}/upload`,
    label: 'Fotos hochladen',
    meta: 'Bilder fuer die automatische Erkennung erfassen',
  },
  {
    href: `/projects/${id}/import`,
    label: 'ChatGPT importieren',
    meta: 'JSON-Analyse aus ChatGPT einfuegen und als Candidates importieren',
  },
  {
    href: `/projects/${id}/candidates`,
    label: `Candidates pruefen (${candidateCount} ausstehend)`,
    meta: 'Erkannte Vorschlaege bestaetigen oder ablehnen',
  },
  // ... Rest unveraendert
]
```

Keine weiteren Änderungen — die Seite ist ein Server Component, kein State nötig.

---

## Akzeptanzkriterien

- [ ] Link "ChatGPT importieren" erscheint in der Naechste-Schritte-Liste
- [ ] Link zeigt auf `/projects/:id/import`
- [ ] Reihenfolge: nach "Fotos hochladen", vor "Candidates pruefen"
- [ ] `pnpm typecheck` gruen
- [ ] `pnpm lint` gruen

---

## Abhaengigkeiten

- IF-034 (Import-UI) — muss gemergt sein, sonst landet der Link auf einer 404-Seite

---

## Referenzen

Review: REVIEW-IF-035 (nach Implementierung)
