# IF-001-local-storage-provider

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Status: `ready`

---

## Zusammenfassung

`LocalFileSystemStorageProvider` implementieren — die Dev-Implementierung des `StorageProvider`-Interface für lokales Dateisystem-Speichern von Nutzerfotos.

---

## Kontext

- Interface definiert in `packages/shared/src/providers/storage.ts`
- Entscheidung: `ai/decisions/DECISION-001-storage-provider.md`
- Backlog-Task: T-402

Ohne diese Implementierung kann kein Foto-Upload getestet werden.

---

## Ziel

Nach diesem Ticket kann der API-Layer Fotos lokal speichern, abrufen und löschen,
indem er `LocalFileSystemStorageProvider` über die `StorageProvider`-Schnittstelle nutzt.

---

## Betroffene Dateien

```
packages/shared/src/providers/storage.ts   # lesen (Interface bereits definiert)
packages/vision/src/providers/local-fs.ts  # NEU anlegen
packages/vision/src/index.ts               # export hinzufügen
```

---

## Implementierungsdetails

**Klasse:** `LocalFileSystemStorageProvider`  
**Paket:** `packages/vision` (hier liegen Storage-Implementierungen bis ein packages/storage entsteht)

Verhalten:
- `upload(input)`: Schreibt `input.buffer` in `{basePath}/{key}`
  - Erstellt fehlende Verzeichnisse (recursive mkdir)
  - Gibt `{ key, url: basePath + '/' + key, sizeBytes }` zurück
- `delete(key)`: Löscht Datei unter `{basePath}/{key}`, ignoriert ENOENT
- `getUrl(key)`: Gibt `basePath + '/' + key` zurück (lokaler Pfad)
- `basePath`: Über Konstruktor-Parameter konfigurierbar, Default: `process.env.STORAGE_LOCAL_PATH ?? './uploads'`

---

## Akzeptanzkriterien

- [ ] `LocalFileSystemStorageProvider` implementiert `StorageProvider`-Interface vollständig
- [ ] `upload()` schreibt Datei auf Disk, fehlende Directories werden erstellt
- [ ] `upload()` schlägt fehl mit sprechendem Error wenn Buffer leer ist
- [ ] `delete()` entfernt Datei, wirft keinen Fehler wenn Datei nicht existiert (ENOENT ignorieren)
- [ ] `getUrl()` gibt korrekten lokalen Pfad zurück
- [ ] Unit Tests vorhanden (mind. 4 Szenarien — siehe unten)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm test` grün
- [ ] `pnpm lint` grün

---

## Test-Anforderungen

Unit-Tests in `packages/vision/src/providers/local-fs.test.ts`:

1. `upload()` — schreibt Datei und gibt korrektes Ergebnis zurück
2. `upload()` — erstellt verschachtelte Verzeichnisse wenn nötig
3. `delete()` — löscht existierende Datei
4. `delete()` — wirft keinen Fehler bei nicht-existierender Datei
5. `getUrl()` — gibt erwarteten Pfad zurück

Testverzeichnis: temporäres Verzeichnis verwenden (z.B. `os.tmpdir()`), nach Test aufräumen.

---

## Rahmenbedingungen

- Nur Node.js built-ins: `fs/promises`, `path`, `os` — keine externen Dependencies
- Der Uploads-Ordner (`./uploads/`) ist bereits in `.gitignore`
- `StorageProvider`-Interface NICHT verändern
- Keine Cloud-Storage-Logik (das ist T-408, wartet auf F5b)
- Kein Logging von Dateiinhalten (Privacy-Regel aus `docs/SECURITY_AND_PRIVACY.md`)

---

## Referenzen

Entscheidungen: DECISION-001  
Offene Fragen: keine  
Review: REVIEW-IF-001 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Cloud-Storage-Provider (wartet auf F5b)
- Integration in Upload-API-Route (eigenes Ticket)
- Signed URLs oder öffentliche URLs
