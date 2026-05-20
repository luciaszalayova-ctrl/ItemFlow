# IF-007-upload-api-route

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `draft`

---

## Zusammenfassung

`POST /api/projects/[id]/assets` implementieren — der erste echte API-Endpunkt.
Nimmt ein Foto entgegen, speichert es via `LocalFileSystemStorageProvider`,
ruft `MockVisionProvider` auf, persistiert `Asset` + `ItemCandidates` in der DB.

---

## Kontext

- Storage: `LocalFileSystemStorageProvider` (`packages/vision`)
- Vision: `MockVisionProvider` mit `FIXTURE_MAP` (`packages/vision`, `packages/testing`)
- DB: Prisma-Client (`packages/db`)
- Auth: Session via `auth()` aus `apps/api/auth.ts` (IF-006 Voraussetzung)
- Schema: `Asset`, `ItemCandidate` in `packages/db/prisma/schema.prisma`
- Asset-Validierung: `AssetSchema`, `MAX_ASSET_SIZE_BYTES` in `packages/shared`

---

## Ziel

Nach diesem Ticket kann ein authentifizierter Nutzer ein Foto hochladen und erhält
die erkannten `ItemCandidates` als Antwort. Die KI-Pipeline läuft mock-basiert
vollständig durch — kein echter Vision-API-Call nötig.

---

## Betroffene Dateien

```
apps/api/app/api/projects/[id]/assets/route.ts   NEU
apps/api/app/api/projects/[id]/assets/route.test.ts  NEU (optional, s.u.)
apps/api/package.json                            @itemflow/vision, @itemflow/testing ergänzen
```

---

## Implementierungsdetails

### Route: `POST /api/projects/[id]/assets`

```typescript
// Ablauf:
// 1. Session prüfen → 401 wenn keine Session
// 2. Projekt aus DB laden → 404 wenn nicht gefunden
// 3. Prüfen ob session.userId === project.userId → 403 wenn nicht
// 4. FormData parsen → Datei aus "file"-Feld
// 5. Datei validieren (Größe, MIME-Type)
// 6. StorageProvider.upload() → speichert Datei
// 7. VisionProvider.analyze() → gibt VisionAnalysisResult zurück
// 8. Asset in DB anlegen
// 9. ItemCandidates in DB anlegen (eine Zeile pro Candidate)
// 10. Response: { assetId, candidates[] }
```

### Request

`Content-Type: multipart/form-data`  
Felder:
- `file` — Bilddatei (JPEG, PNG, WebP, HEIC)

### Validierung

| Prüfung | Fehler |
|---------|--------|
| Kein `file`-Feld | `400 Bad Request` |
| MIME-Type nicht in `ACCEPTED_IMAGE_TYPES` | `400 Bad Request` |
| Größe > `MAX_ASSET_SIZE_BYTES` (20 MB) | `413 Payload Too Large` |
| Projekt nicht gefunden | `404 Not Found` |
| Projekt gehört anderem User | `403 Forbidden` |
| Keine Session | `401 Unauthorized` |

`ACCEPTED_IMAGE_TYPES` und `MAX_ASSET_SIZE_BYTES` aus `@itemflow/shared` importieren.

### Provider-Konfiguration

```typescript
const storage = new LocalFileSystemStorageProvider()
// imageUrl = Fixture-Key aus FIXTURE_MAP für dev-Umgebung
// Mapping: fileName → fixture key (z.B. "kindersitz.jpg" → "kindersitz")
const visionFixtureKey = path.basename(fileName, path.extname(fileName))
const vision = new MockVisionProvider(FIXTURE_MAP, [])
```

### DB-Persistierung

```typescript
// Asset anlegen
const asset = await db.asset.create({
  data: {
    projectId,
    storageKey: uploadResult.key,
    mimeType,
    fileName: originalFileName,
    sizeBytes: uploadResult.sizeBytes,
  }
})

// ItemCandidates anlegen
await db.itemCandidate.createMany({
  data: visionResult.candidates.map(c => ({
    projectId,
    assetId: asset.id,
    rawLabel: c.rawLabel,
    normalizedName: c.normalizedName,
    category: c.category,
    attributesJson: c.attributes ?? {},
    confidence: c.confidence,
    rawModelOutputJson: { bundlePotential: c.bundlePotential, uncertaintyNotes: c.uncertaintyNotes },
  }))
})
```

### Response (200 OK)

```json
{
  "assetId": "clxxx...",
  "candidateCount": 1,
  "candidates": [
    {
      "id": "clyyy...",
      "rawLabel": "Kinderautositz",
      "normalizedName": "Kinderautositz",
      "category": "baby-gear",
      "confidence": 0.82,
      "bundlePotential": false,
      "uncertaintyNotes": "Sicherheitsrelevantes Produkt — manuelle Prüfung erforderlich"
    }
  ]
}
```

### Fehler-Response-Format

Einheitlich für alle Fehler:
```json
{ "error": "Beschreibung auf Englisch" }
```

---

## Akzeptanzkriterien

- [ ] `POST /api/projects/[id]/assets` nimmt Multipart-Upload entgegen
- [ ] Datei wird auf Disk gespeichert (via `LocalFileSystemStorageProvider`)
- [ ] Vision-Analyse läuft durch (via `MockVisionProvider`)
- [ ] `Asset` und `ItemCandidates` sind in DB gespeichert
- [ ] `401` ohne Session, `403` bei falschem User, `404` bei unbekanntem Projekt
- [ ] `400` bei falscher MIME-Type, `413` bei Übergröße
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Auth-Session aus IF-006 — kein Dev-Bypass
- Kein echter Vision-API-Call — nur `MockVisionProvider`
- KI-Ausgabe wird NICHT ohne Validierung persistiert — `VisionOutputSchema.parse()` läuft bereits in `MockVisionProvider.analyze()`
- Keine Nutzerbilder geloggt (Privacy-Regel aus `docs/SECURITY_AND_PRIVACY.md`)
- `STORAGE_LOCAL_PATH` aus `.env` — Default `./uploads`

---

## Abhängigkeiten (müssen vorher abgeschlossen sein)

- **IF-005** — Datenbank läuft und Migrations sind eingespielt
- **IF-006** — Auth-Middleware schützt die Route

---

## Referenzen

Offene Fragen: keine  
Review: REVIEW-IF-007 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Echter Vision-Provider (Phase 2)
- Scoring-Aufruf nach dem Upload
- GET /api/projects/[id]/assets (eigenes Ticket)
- Bild-Optimierung oder Thumbnail-Generierung
