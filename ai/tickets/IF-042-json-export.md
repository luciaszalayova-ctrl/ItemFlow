# IF-042-json-export

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

JSON-Export aller Listings eines Projekts als Download — schließt den
MVP-Kern-Flow ab (Foto → Candidate → Item → Listing → Export).

---

## Kontext

Es gibt bereits `GET /api/projects/:id/listings` (IF-013) und eine
Listings-UI (IF-023). Was fehlt: ein dedizierter Export-Endpunkt, der
alle `approved`- und `draft`-Listings als JSON-Datei zurückgibt, sowie
ein Download-Button in der UI.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/export/route.ts    NEU
apps/api/app/projects/[id]/listings/page.tsx      ERWEITERN
```

---

## Implementierungsdetails

### API-Endpunkt

```typescript
// GET /api/projects/:id/export?format=json
// Auth + Ownership-Check wie in anderen Routen
// Lädt alle Listings des Projekts (status != 'archived')

const listings = await prisma.listing.findMany({
  where: { projectId: id, status: { not: 'archived' } },
  select: {
    id: true,
    title: true,
    description: true,
    priceCents: true,
    minimumPriceCents: true,
    category: true,
    shippingMode: true,
    pickupOnly: true,
    status: true,
    targetType: true,
    createdAt: true,
    updatedAt: true,
  },
  orderBy: { createdAt: 'asc' },
})

return new Response(JSON.stringify({ listings, exportedAt: new Date().toISOString() }, null, 2), {
  status: 200,
  headers: {
    'Content-Type': 'application/json',
    'Content-Disposition': `attachment; filename="itemflow-export-${id}.json"`,
  },
})
```

### Download-Button in der Listings-UI

Unterhalb der Listing-Liste (oder im Header-Bereich) einen Link einfügen:

```tsx
<a
  href={`/api/projects/${projectId}/export?format=json`}
  download
  style={exportLinkStyle}
>
  Als JSON exportieren
</a>
```

Kein eigener State nötig — `<a download>` löst den Browser-Download direkt aus.

### Style

```typescript
const exportLinkStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1rem',
  borderRadius: '999px',
  background: '#efe6d6',
  color: '#2d2a24',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
} satisfies React.CSSProperties
```

---

## Akzeptanzkriterien

- [ ] `GET /api/projects/:id/export?format=json` gibt JSON zurück
- [ ] Response-Header: `Content-Disposition: attachment; filename="itemflow-export-<id>.json"`
- [ ] Enthält alle nicht-archivierten Listings mit Titel, Beschreibung, Preis, Status
- [ ] Auth + Ownership-Check vorhanden (403 bei fremdem Projekt)
- [ ] Download-Button erscheint auf der Listings-Seite
- [ ] Klick löst Browser-Download aus (kein Neuladen der Seite)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-013 (Listings CRUD API) — bereits gemergt
- IF-023 (Listings UI) — bereits gemergt

---

## Referenzen

Review: REVIEW-IF-042 (nach Implementierung)
