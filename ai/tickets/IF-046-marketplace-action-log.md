# IF-046-marketplace-action-log

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Beim JSON- oder CSV-Export (IF-042/043) wird ein `MarketplaceActionLog`-
Eintrag angelegt, der festhält wann und in welchem Format ein Listing
exportiert wurde (T-1003).

---

## Kontext

Das Prisma-Schema hat bereits eine `MarketplaceActionLog`-Tabelle
(angelegt in der initialen Migration). Sie wird bisher nicht befüllt.
Der Log gibt dem Nutzer Auskunft darüber, welche Listings er schon
exportiert hat — nützlich wenn man mehrere Listing-Entwürfe hat und
den Überblick behalten will.

Auf der Listings-Seite wird eine kompakte Übersicht der letzten
Export-Aktionen angezeigt.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/export/route.ts        ERWEITERN (IF-042 als Basis)
apps/api/app/projects/[id]/listings/page.tsx          ERWEITERN
```

---

## Implementierungsdetails

### Prisma-Schema prüfen

Sicherstellen, dass `MarketplaceActionLog` folgende Felder hat
(ggf. Migration ergänzen falls Felder fehlen):

```prisma
model MarketplaceActionLog {
  id          String   @id @default(cuid())
  projectId   String
  listingId   String?
  action      String   // 'export_json' | 'export_csv'
  payload     Json?
  createdAt   DateTime @default(now())

  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
}
```

Falls das Schema abweicht, nur minimale Anpassung vornehmen.

### Export-Route: Log-Eintrag nach Export

Nach dem Zusammenstellen der Listings, **vor** dem Return des Response:

```typescript
await prisma.marketplaceActionLog.create({
  data: {
    projectId: id,
    action: format === 'csv' ? 'export_csv' : 'export_json',
    payload: { listingCount: listings.length },
  },
})
```

Fehler beim Schreiben des Logs dürfen den Export **nicht** blockieren:

```typescript
try {
  await prisma.marketplaceActionLog.create({ ... })
} catch {
  // Log-Fehler stillschweigend ignorieren
}
```

### Neuer API-Endpunkt: GET /api/projects/:id/action-log

```typescript
// Gibt die letzten 20 Einträge zurück
const logs = await prisma.marketplaceActionLog.findMany({
  where: { projectId: id },
  orderBy: { createdAt: 'desc' },
  take: 20,
  select: { id: true, action: true, payload: true, createdAt: true },
})

return Response.json({ logs })
```

Neue Datei: `apps/api/app/api/projects/[id]/action-log/route.ts`

### UI: Listings-Seite

Unterhalb der Export-Buttons eine kompakte Log-Übersicht:

```tsx
{actionLog.length > 0 ? (
  <section style={{ marginTop: '2rem' }}>
    <h2 style={{ fontSize: '1rem', color: '#5c5346', marginBottom: '0.5rem' }}>
      Letzte Exporte
    </h2>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
      {actionLog.map((entry) => (
        <li key={entry.id} style={{ color: '#7b6f5b', fontSize: '0.9rem' }}>
          {formatAction(entry.action)} —{' '}
          {new Date(entry.createdAt).toLocaleString('de-DE')}
          {entry.payload?.listingCount != null
            ? ` (${entry.payload.listingCount} Listings)`
            : ''}
        </li>
      ))}
    </ul>
  </section>
) : null}
```

Hilfsfunktion:
```typescript
function formatAction(action: string): string {
  if (action === 'export_json') return 'JSON-Export'
  if (action === 'export_csv') return 'CSV-Export'
  return action
}
```

State laden per `useEffect` analog zu anderen Seiten:
```typescript
const [actionLog, setActionLog] = useState<ActionLogEntry[]>([])

// In useEffect nach dem Laden der Listings:
const logResponse = await fetch(`/api/projects/${projectId}/action-log`)
if (logResponse.ok) {
  const logData = (await logResponse.json()) as { logs: ActionLogEntry[] }
  setActionLog(logData.logs)
}
```

Type:
```typescript
type ActionLogEntry = {
  id: string
  action: string
  payload: { listingCount?: number } | null
  createdAt: string
}
```

---

## Akzeptanzkriterien

- [ ] JSON-Export (IF-042) legt `MarketplaceActionLog`-Eintrag mit `action: 'export_json'` an
- [ ] CSV-Export (IF-043) legt Eintrag mit `action: 'export_csv'` an
- [ ] Log-Fehler blockiert den Export nicht (try/catch)
- [ ] `GET /api/projects/:id/action-log` gibt die letzten 20 Einträge zurück
- [ ] Auth + Ownership-Check auf dem Log-Endpunkt
- [ ] Listings-Seite zeigt vergangene Exporte mit Zeitstempel und Format an
- [ ] Leerer Log → Abschnitt wird nicht angezeigt
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Abhängigkeiten

- IF-042 (JSON-Export) — muss vorhanden sein, da diese Route erweitert wird
- IF-043 (CSV-Export) — parallel umsetzbar

---

## Rahmenbedingungen

- Kein Löschen von Log-Einträgen durch den Nutzer (nur via Projekt-Löschen / Cascade)
- Maximal 20 Einträge in der UI — kein Pagination nötig

---

## Referenzen

Review: REVIEW-IF-046 (nach Implementierung)
