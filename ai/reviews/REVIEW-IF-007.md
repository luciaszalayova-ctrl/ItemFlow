# REVIEW-IF-007

Datum: 2026-05-20
Reviewer: Claude Code (Selbst-Review — Implementierung durch CC)
Branch: `feature/IF-007-upload-api-route`
Status: `approved`

---

## Was wurde geprüft

Ticket: `ai/tickets/IF-007-upload-api-route.md`

Geänderte Dateien:
- `apps/api/app/api/projects/[id]/assets/route.ts` (neu)
- `apps/api/package.json` (`@itemflow/vision`, `@itemflow/testing` ergänzt)
- `pnpm-lock.yaml` (aktualisiert)

---

## Kritische Probleme (Blocker)

Keine.

---

## Verbesserungen (Non-Blocker)

**1. `prisma.$transaction` statt `createManyAndReturn`**

ItemCandidates werden einzeln per `$transaction([...creates])` angelegt statt
via `createMany`. Grund: `createManyAndReturn` ist in Prisma 6 zwar verfügbar,
aber der Rückgabetyp ist bei `createMany` auf PostgreSQL begrenzt. Die
Transaction-Variante ist sicherer und gibt vollständige Objekte zurück, ist aber
bei sehr vielen Candidates geringfügig langsamer. Für den MVP-Fall (< 10 Candidates
pro Bild) kein praktisches Problem.

**2. `assetId: "pending"` beim Vision-Aufruf**

`MockVisionProvider.analyze()` benötigt eine `assetId` im Input, die Asset-ID ist
aber erst nach dem DB-Insert bekannt. Der Wert `"pending"` ist ein Platzhalter —
der Provider verwendet ihn nur zum Durchreichen, nicht zur Analyse. Beim Wechsel
auf einen echten Vision-Provider muss dieser Ablauf ggf. umgestellt werden
(zuerst Asset anlegen, dann Vision aufrufen).

**3. Kein Test-File**

Das Ticket markiert Tests als optional. Die Route ist ohne laufende DB nicht
sinnvoll testbar. Integration-Tests folgen wenn IF-005 (Prisma/DB) und eine
Test-DB-Konfiguration vorhanden sind.

---

## Sicherheitsprüfung

- [x] Keine Credentials im Code
- [x] Auth-Check als erster Schritt — kein Bypass möglich
- [x] Ownership-Prüfung (`project.userId === session.user.userId`) ✓
- [x] Keine Bild-URLs geloggt (Privacy-Regel eingehalten) ✓
- [x] `VisionOutputSchema.parse()` läuft in `MockVisionProvider.analyze()` ✓
- [x] KI-Ausgabe wird nicht ohne Validierung persistiert ✓
- [x] `ACCEPTED_IMAGE_TYPES` und `MAX_ASSET_SIZE_BYTES` aus `@itemflow/shared` ✓
- [x] Keine fest eingebetteten Credentials oder Storage-Pfade

---

## Ablauf-Prüfung

- [x] 401 ohne Session
- [x] 404 bei unbekanntem Projekt
- [x] 403 bei falschem User
- [x] 400 ohne `file`-Feld
- [x] 400 bei ungültigem MIME-Type
- [x] 413 bei Datei > `MAX_ASSET_SIZE_BYTES`
- [x] Fixture-Key aus Dateinamen (ohne Extension) abgeleitet ✓
- [x] `StorageUploadInput` vollständig befüllt (key, buffer, mimeType, fileName, sizeBytes) ✓
- [x] Response-Format entspricht Ticket-Spec ✓
- [x] `pnpm typecheck` grün
- [x] `pnpm lint` grün

---

## Prozess-Anmerkung

Der Commit landete zunächst versehentlich auf `feature/IF-008-projects-crud-api`
(geteiltes Working Directory mit Codex). Wurde per `cherry-pick` auf den korrekten
`feature/IF-007-upload-api-route`-Branch verschoben und von IF-008 entfernt.
Workaround für zukünftige parallele Arbeit: **git worktrees** (ein Verzeichnis
pro Agent/Branch).

---

## Empfehlung

**approved** — Alle Akzeptanzkriterien erfüllt, Sicherheits- und Ablaufprüfung
bestanden, Checks grün. Integration-Tests stehen aus bis DB-Umgebung verfügbar.