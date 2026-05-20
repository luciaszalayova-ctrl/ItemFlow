# IF-027-project-detail-bundles

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Projektdetail-Seite um Bundle-Kennzahl und Bundle-Navigation erweitern — die bestehende
Server Component `apps/api/app/projects/[id]/page.tsx` bekommt einen `bundleCount`-StatCard
und einen Eintrag in der "Nächste Schritte"-Liste.

---

## Kontext

Die Seite ist ein Server Component (`await auth()`, `prisma` direkt) und zeigt bereits
drei StatCards (Candidates, Items, Listings) sowie eine Liste mit Next-Steps-Links.
Bundles wurden mit IF-025 eingeführt und haben seit IF-026 eine eigene UI-Seite.

---

## Ziel

Der Nutzer sieht auf einen Blick, wie viele Bundles im Projekt existieren, und kann
direkt dorthin navigieren.

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/page.tsx    ERWEITERN
```

---

## Implementierungsdetails

### `apps/api/app/projects/[id]/page.tsx`

**Schritt 1 — `bundleCount` zum `Promise.all` hinzufügen:**

```typescript
const [candidateCount, itemCount, listingCount, bundleCount] = await Promise.all([
  prisma.itemCandidate.count({
    where: { projectId: id, status: 'pending' },
  }),
  prisma.inventoryItem.count({
    where: { projectId: id },
  }),
  prisma.listingDraft.count({
    where: { projectId: id, status: { in: ['draft', 'reviewed'] } },
  }),
  prisma.bundle.count({
    where: { projectId: id, status: { notIn: ['rejected'] } },
  }),
])
```

Zählt alle nicht-abgelehnten Bundles (`suggested`, `accepted`, `listing_created`).

**Schritt 2 — StatCard ergänzen:**

```tsx
<StatCard label="Candidates offen" value={candidateCount} />
<StatCard label="Items gesamt" value={itemCount} />
<StatCard label="Bundles" value={bundleCount} />
<StatCard label="Listings offen" value={listingCount} />
<StatCard label="Erstellt am" value={formatDate(project.createdAt)} />
```

`summaryGridStyle` verwendet `repeat(auto-fit, minmax(12rem, 1fr))` — passt sich
automatisch an eine fünfte Karte an, keine CSS-Anpassung nötig.

**Schritt 3 — Next-Steps-Eintrag hinzufügen:**

```typescript
const nextSteps = [
  {
    href: `/projects/${id}/upload`,
    label: 'Fotos hochladen',
    meta: 'Bilder fuer die automatische Erkennung erfassen',
  },
  {
    href: `/projects/${id}/candidates`,
    label: `Candidates pruefen (${candidateCount} ausstehend)`,
    meta: 'Erkannte Vorschlaege bestaetigen oder ablehnen',
  },
  {
    href: `/projects/${id}/items`,
    label: `Items bearbeiten (${itemCount} gesamt)`,
    meta: 'Titel, Zustand und Details fuer das Scoring verfeinern',
  },
  {
    href: `/projects/${id}/bundles`,
    label: `Bundles (${bundleCount} gesamt)`,
    meta: 'Guenstige Artikel zu Paketen buendeln und gemeinsam anbieten',
  },
  {
    href: `/projects/${id}/listings`,
    label: `Listings (${listingCount} offen)`,
    meta: 'Entwuerfe pruefen, freigeben und exportieren',
  },
]
```

---

## Akzeptanzkriterien

- [ ] `bundleCount` wird via `prisma.bundle.count` geladen (abgelehnte Bundles exkludiert)
- [ ] Neuer StatCard "Bundles" sichtbar in der Übersichtszeile
- [ ] Neuer Next-Steps-Eintrag "Bundles" mit korrekter Zahl und Link
- [ ] Reihenfolge: Upload → Candidates → Items → **Bundles** → Listings
- [ ] Kein Layout-Bruch durch fünfte StatCard
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Server Component — kein `'use client'`, kein `useState`
- `prisma` direkt verwenden (kein `fetch`)
- Minimale Änderung: nur `Promise.all` erweitern + StatCard + nextSteps-Eintrag

---

## Abhängigkeiten

- IF-025 (Bundle API — Prisma-Modell vorhanden) — merged ✓
- IF-026 (Bundle UI — `/projects/[id]/bundles` existiert) — muss vor Merge von IF-027 vorhanden sein

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Projekt archivieren/löschen UI
- Projekt-Metadaten bearbeiten (Titel, Beschreibung)

---

## Referenzen

Review: REVIEW-IF-027 (nach Implementierung)
