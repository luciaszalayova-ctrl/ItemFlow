# DECISION-001: Storage Provider Architecture

Datum: 2026-05-19  
Status: `accepted` (Dev-Teil) / `open` (Prod-Teil, siehe F5b)  
Erstellt von: Claude Code

---

## Kontext

Nutzer-Fotos müssen gespeichert werden. Vercel (geplantes Deployment-Ziel)
unterstützt kein persistentes Filesystem. Für Dev ist ein einfaches lokales
Filesystem ausreichend. Für Prod wird Cloud-Storage benötigt.

---

## Entscheidung

**StorageProvider-Interface** als Abstraktion vor jeder Storage-Implementierung.

Interface: `packages/vision/src/index.ts` → Vorbild für `packages/shared` (StorageProvider TBD)

Dev-Implementierung: `LocalFileSystemProvider` — speichert in `./uploads/` (nicht committed, in `.gitignore`)

Prod-Implementierung: Auswahl über ENV-Variable `STORAGE_PROVIDER`.
**Die konkrete Prod-Implementierung ist noch nicht entschieden (F5b offen).**

---

## Konsequenzen

**Positiv:**
- Dev-Start sofort möglich ohne Cloud-Account
- Prod-Provider kann gewechselt werden ohne Business-Logik zu ändern
- Tests können mit lokalem FS oder Mocks laufen

**Negativ / Einschränkungen:**
- Vor erstem Vercel-Deploy muss F5b entschieden und implementiert werden
- Lokale Uploads dürfen nicht ins Repo (Datenschutz, `.gitignore` gesetzt)

---

## Alternativen erwogen

| Option | Warum nicht gewählt |
|--------|---------------------|
| Direkt S3/R2 von Anfang an | Zu früh, erhöht Dev-Aufwand unnötig vor MVP-Validierung |
| Base64 in Datenbank | Schlechte Performance, Datenbankgröße unkontrollierbar |
| Supabase Storage von Anfang an | Zieht Supabase als DB voraus, F5b noch offen |

---

## Offene Teilfragen

- **F5b**: Welcher Cloud-Storage-Provider für Prod? (R2 / S3 / Supabase Storage)
  → Muss entschieden werden vor erstem Vercel-Deploy

---

## Betroffene Tickets

- T-401: StorageProvider-Interface (definiert)
- T-402: LocalFileSystemProvider (noch zu implementieren)
- T-408: CloudStorageProvider (noch zu implementieren, wartet auf F5b)
