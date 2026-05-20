# ItemFlow-Backlog

Letztes Update: 2026-05-20  
Status: Initiale Version - wartet auf Phase-0-Validierung

---

## Produktziel

Haushalte dabei unterstuetzen, Geruempel mit minimalem Zeitaufwand in Geld umzuwandeln.  
Fotos hochladen -> Gegenstaende erkennen -> Entscheidung verkaufen/buendeln/verschenken -> fertige Listings exportieren.

Optimierung auf **erwarteten Nettowert** (Erlos minus Zeitkosten), nicht auf maximalen Bruttopreis.

---

## MVP-Umfang

**Name:** Foto-zu-Wiederverkaufsplan  
**Markt:** Deutschsprachig, primaer Kleinanzeigen  
**Deployment:** Vercel + gemanagtes Postgres  
**Auth:** NextAuth (E-Mail/Passwort oder OAuth)

Kern-Flow:
1. Projekt anlegen
2. Fotos hochladen
3. Gegenstandskandidaten aus der Vision-Analyse pruefen und korrigieren
4. Scoring: einzeln verkaufen / buendeln / verschenken / spenden / recyceln
5. Listing-Entwurf generieren (Deutsch, Kleinanzeigen-Stil)
6. Listing kopieren / als JSON exportieren

Explizit **nicht** im MVP:
- Automatisches Veroeffentlichen (kein Auto-Post)
- Marketplace-Auth / Browser-Automatisierung (Playwright erst in Phase 5)
- Echte Preis-Datenquellen
- Kaeufer-Kommunikation
- Zahlungen / Versand

---

## Offene Fragen

| # | Frage | Auswirkung | Status |
|---|-------|------------|--------|
| F1 | Monorepo-Tooling: nur pnpm workspaces oder zusaetzlich Turborepo? | Build-Performance | Offen |
| F2 | Vision-AI-Provider nach dem Mock: Claude, GPT-4o, Gemini? | Phase 2 | Offen |
| F3 | Listing-Generator-Provider: derselbe wie fuer Vision oder getrennt? | Phase 2 | Offen |
| F5b | Image-Storage fuer Vercel-Prod: Cloudflare R2, S3 oder Supabase Storage? | Architektur-Blocker - lokales Dateisystem funktioniert nicht auf Vercel | Offen |
| F8 | Welche Marketplaces im MVP neben Kleinanzeigen: eBay, Vinted oder nur Kleinanzeigen? | Listing-Templates | Offen |
| F9 | Scoring-Schwellen (20 EUR usw.) - bestaetigte Werte oder Hypothesen aus Phase 0? | Scoring-Engine | Offen bis Phase 0 |
| F11 | UI-Komponentenbibliothek: shadcn/ui + Tailwind, Radix oder pures Tailwind? | Frontend-Setup | Offen |
| F12 | Mobile-Browser-Support fuer Foto-Upload vom Handy? | Frontend-Anforderungen | Offen |

**Entschieden:**

| # | Frage | Entscheidung |
|---|-------|--------------|
| F4 | Auth im MVP | NextAuth (E-Mail/Passwort oder OAuth) |
| F5 | Image-Storage in Dev | Lokales Dateisystem in Dev, StorageProvider-Interface fuer spaeteren Produktiv-Swap |
| F6 | Deployment | Vercel + gemanagtes Postgres (z. B. Supabase/Neon) |
| F7 | Zielmarkt / Sprache | Deutsch, Kleinanzeigen zuerst |

---

## Epics

| ID | Name | Phase |
|----|------|-------|
| E0 | Phase 0 - Manueller Prototyp | Phase 0 |
| E1 | Infrastruktur- und Monorepo-Setup | P0 |
| E2 | Datenbankschema und Shared Types | P0 |
| E3 | Auth und User-Management | P1 |
| E4 | Foto-Upload und Asset-Storage | P1 |
| E5 | Vision-Analyse und Gegenstandserkennung | P1 |
| E6 | Item-Review und Inventar | P1 |
| E7 | Scoring-Engine | P1 |
| E8 | Bundle-Engine | P2 |
| E9 | Listing-Generierung | P1 |
| E10 | Export und Copy | P1 |
| E11 | Testing-Infrastruktur | P1 |
| E12 | Datenloeschung und Datenschutz | P1 |

---

## User Stories

### E0 - Manueller Prototyp (Phase 0)

- **US-001** Als Produkteigentuemer moechte ich eine echte Gegenstandskiste mit 20-40 Artikeln manuell durch den Workflow laufen lassen, damit ich weiss, ob die Empfehlungslogik sinnvoll ist.
  - Akzeptanz: Gegenstandsliste, Entscheidung verkaufen/buendeln/verschenken, Listing-Entwuerfe und geschaetzter Nettowert liegen vor. Der Abgleich mit dem eigenen Urteil ist dokumentiert.

### E3 - Auth

- **US-301** Als Nutzer kann ich mich registrieren und einloggen, damit meine Projekte sicher meinem Account gehoeren.
  - Akzeptanz: Registrierung mit E-Mail/Passwort funktioniert. Die Session bleibt erhalten. Abmeldung ist moeglich.
- **US-302** Als Nutzer kann ich nur meine eigenen Projekte sehen und bearbeiten.
  - Akzeptanz: Zugriff auf fremde Projekt-IDs liefert `403`.

### E4 - Upload

- **US-401** Als Nutzer kann ich ein neues Projekt anlegen und benennen.
  - Akzeptanz: Das Projekt wird gespeichert und erscheint in der Projektliste.
- **US-402** Als Nutzer kann ich mehrere Fotos gleichzeitig in ein Projekt hochladen.
  - Akzeptanz: Mindestens 10 Bilder gleichzeitig. Fortschrittsanzeige. Fehlerhafte Dateien werden abgelehnt (Typ, Groesse).
- **US-403** Als Nutzer kann ich hochgeladene Fotos loeschen, damit ich die Kontrolle ueber meine Daten behalte.
  - Akzeptanz: Das Foto wird aus Storage und Datenbank entfernt. Verknuepfte Kandidaten werden deaktiviert.

### E5 - Erkennung

- **US-501** Als Nutzer starte ich die Analyse und sehe anschliessend erkannte Gegenstandskandidaten pro Foto.
  - Akzeptanz: Strukturierte Kandidaten mit Name, Kategorie, Konfidenz und Quellfoto.
- **US-502** Als Nutzer erkenne ich visuell, welche Erkennungen unsicher sind, damit ich diese besonders pruefe.
  - Akzeptanz: Kandidaten mit `confidence < 0.6` sind visuell markiert.
- **US-503** Als Nutzer kann ich Fotos in ChatGPT hochladen und das Ergebnis-JSON in ItemFlow importieren, wenn kein automatischer Vision-Provider verfuegbar ist.
  - Akzeptanz: Import-UI mit Textarea und Vorschau. Valides JSON erzeugt `ItemCandidate`-Eintraege. Ungueltiges JSON zeigt verstaendliche Fehlermeldung. Importierte Kandidaten erscheinen im normalen Review-Flow.

### E6 - Review und Inventar

- **US-601** Als Nutzer kann ich Titel, Kategorie, Zustand, Marke, Menge und Notizen eines Kandidaten bearbeiten.
  - Akzeptanz: Aenderungen werden gespeichert und sind nach Reload sichtbar.
- **US-602** Als Nutzer kann ich mehrere Kandidaten zu einem `InventoryItem` zusammenfuehren.
  - Akzeptanz: Zusammengefuehrte Eintraege speichern `sourceCandidateIds`. Urspruengliche Kandidaten werden auf `merged` gesetzt.
- **US-603** Als Nutzer kann ich Kandidaten ablehnen (`reject`), die nicht weiterverarbeitet werden sollen.
- **US-604** Als Nutzer kann ich Gegenstaende manuell hinzufuegen, falls etwas nicht erkannt wurde.
- **US-605** Als Nutzer kann ich Gegenstaende als "bereits erledigt" markieren.

### E7 - Scoring

- **US-701** Als Nutzer sehe ich fuer jedes `InventoryItem` eine Empfehlung: einzeln verkaufen / buendeln / verschenken / spenden / recyceln.
  - Akzeptanz: Empfehlung mit Begruendung und Confidence-Level sichtbar.
- **US-702** Als Nutzer sehe ich, warum ein Gegenstand eine bestimmte Empfehlung bekommen hat.
  - Akzeptanz: Kurzer Text mit den ausschlaggebenden Faktoren.
- **US-703** Als Nutzer kann ich eine Empfehlung manuell ueberschreiben.
- **US-704** Als Nutzer werden Gegenstaende in sensiblen Kategorien (Kindersitz, Helm, Elektro usw.) zur manuellen Pruefung markiert.
  - Akzeptanz: Markierte Gegenstaende erscheinen mit Warnhinweis. Keine automatische Verkaufsempfehlung ohne Nutzerbestaetigung.

### E8 - Bundling

- **US-801** Als Nutzer sehe ich Bundle-Vorschlaege fuer verwandte Gegenstaende mit niedrigem Wert.
  - Akzeptanz: Bundle-Vorschlaege mit Begruendung. Grundlage: `bundle_fit_score` und Kategorie-Naehe.
- **US-802** Als Nutzer kann ich Bundle-Vorschlaege annehmen, ablehnen oder manuell anpassen.

### E9 - Listings

- **US-901** Als Nutzer sehe ich fuer jedes verkaufbare Item bzw. Bundle einen fertigen Listing-Entwurf (Deutsch, Kleinanzeigen-Stil).
  - Akzeptanz: Enthalten sind Titel, Beschreibung, Startpreis, Mindestpreis, Plattformempfehlung und Uebergabehinweise. Keine erfundenen Fakten.
- **US-902** Als Nutzer kann ich den Listing-Text direkt bearbeiten.
- **US-903** Als Nutzer kann ich einen Listing-Entwurf neu generieren lassen.
- **US-904** Listings enthalten Unsicherheitssprache, wenn Marke oder Zustand nicht verifiziert sind ("scheint zu sein", "laut Beschriftung").

### E10 - Export

- **US-1001** Als Nutzer kann ich einen Listing-Text mit einem Klick in die Zwischenablage kopieren.
- **US-1002** Als Nutzer kann ich alle Listings eines Projekts als JSON exportieren.

### E12 - Datenloeschung

- **US-1201** Als Nutzer kann ich ein gesamtes Projekt loeschen (Fotos, Kandidaten, Gegenstaende, Listings, Logs).
  - Akzeptanz: Alle verknuepften Daten werden entfernt. Storage-Objekte werden geloescht.

---

## Technische Aufgaben

### E1 - Infrastruktur

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-101 | Monorepo initialisieren: pnpm workspaces, tsconfig base, ESLint, Prettier | P0 | Codex |
| T-102 | `.env.example` mit allen Variablen (DB, Auth, Storage, KI) | P0 | Codex |
| T-103 | CI-Pipeline: `typecheck`, `lint`, Unit-Tests, `build` (GitHub Actions) | P1 | Codex |

### E2 - Schema und Shared Types

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-201 | `packages/shared`: Zod-Schemas fuer alle Domain-Objekte aus `DATA_MODEL.md` | P0 | Claude Code |
| T-202 | `packages/db`: Prisma-Schema mit allen Entitaeten aus `DATA_MODEL.md` | P0 | Codex (Review: Claude Code) |
| T-203 | Grundsetup fuer Prisma-Migrationen | P0 | Codex |
| T-204 | TypeScript-Typen aus dem Prisma-Schema ableiten | P0 | Codex |

### E3 - Auth

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-301 | NextAuth in `apps/api` integrieren | P1 | Codex |
| T-302 | User-Modell in Prisma ergaenzen (Session, Account) | P1 | Codex |
| T-303 | Auth-Middleware: API-Routen absichern | P1 | Codex (Review: Claude Code) |
| T-304 | Login-/Registrierungs-UI | P1 | Codex |

### E4 - Upload und Storage

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-401 | `StorageProvider`-Interface definieren (`upload`, `delete`, `getUrl`) | P0 | Claude Code |
| T-402 | `LocalFileSystemProvider` fuer Development implementieren | P1 | Codex |
| T-403 | Auswahl des `StorageProvider` per Umgebungsvariable konfigurierbar machen | P1 | Codex |
| T-404 | `POST /api/projects` - Projekt erstellen | P1 | Codex |
| T-405 | `POST /api/projects/:id/assets` - Multi-File-Upload-Endpunkt | P1 | Codex |
| T-406 | Upload-UI-Komponente (Drag-and-drop, Fortschrittsanzeige) | P1 | Codex |
| T-407 | `DELETE /api/assets/:id` - Asset plus Storage-Objekt loeschen | P1 | Codex |
| T-408 | `CloudStorageProvider`-Stub (fuer Prod/Vercel - R2 oder S3, spaeter zu klaeren) | P2 | Codex |

### E5 - Vision-Analyse

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-501 | `VisionProvider`-Interface definieren | P0 | Claude Code |
| T-502 | Zod-Schema fuer `VisionProvider`-Output (`ItemCandidateResult`) | P0 | Claude Code |
| T-503 | `MockVisionProvider` mit realistischen Fixtures (5-8 Gegenstandstypen) | P1 | Claude Code |
| T-504 | `POST /api/projects/:id/analyze` - Analyse-Job mit Mock-Provider | P1 | Codex |
| T-505 | `GET /api/projects/:id/candidates` - Kandidaten abrufen | P1 | Codex |
| T-506 | `POST /api/projects/:id/candidates/import` - ChatGPT-JSON importieren (validiert per `VisionCandidateRawSchema`) | P1 | Codex |
| T-507 | Import-UI: Textarea + JSON-Vorschau + Bestaetigung in `app/projects/[id]/import/page.tsx` | P1 | Codex |

### E6 - Review und Inventar

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-601 | `PATCH /api/candidates/:id` - Kandidat bearbeiten | P1 | Codex |
| T-602 | `POST /api/candidates/:id/accept` - Kandidat in `InventoryItem` konvertieren | P1 | Codex |
| T-603 | `POST /api/candidates/merge` - Mehrere Kandidaten zusammenfuehren | P1 | Codex |
| T-604 | `PATCH /api/candidates/:id/reject` - Kandidat ablehnen | P1 | Codex |
| T-605 | `POST /api/items` - Gegenstand manuell anlegen | P1 | Codex |
| T-606 | Review-UI: Kandidatenliste mit Inline-Bearbeitung und Aktionen | P1 | Codex |

### E7 - Scoring-Engine

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-701 | Scoring-Engine in `packages/scoring` (pure functions) | P1 | Claude Code |
| T-702 | Zod-Schema fuer `ScoringInput` und `ScoringResult` | P0 | Claude Code |
| T-703 | Konfigurierbare Schwellenwerte (nicht hart codiert) | P1 | Claude Code |
| T-704 | Logik zum Markieren sensibler Kategorien | P1 | Claude Code |
| T-705 | `POST /api/items/:id/score` - Gegenstand bewerten | P1 | Codex |
| T-706 | Unit-Tests: Scoring-Logik mit Grenzfaellen (>= 8 Szenarien) | P1 | Claude Code |
| T-707 | Unit-Tests: Markierung sensibler Kategorien | P1 | Claude Code |

### E8 - Bundle-Engine

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-801 | Bundle-Heuristik in `packages/scoring` (Kategorie-Naehe, `bundle_fit_score`) | P2 | Claude Code |
| T-802 | `POST /api/projects/:id/bundles` - Bundle-Vorschlaege generieren | P2 | Codex |
| T-803 | Bundle-UI: Vorschlaege anzeigen, akzeptieren/ablehnen | P2 | Codex |
| T-804 | Unit-Tests: Bundling-Heuristik | P2 | Claude Code |

### E9 - Listing-Generierung

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-901 | `ListingGenerator`-Interface definieren | P0 | Claude Code |
| T-902 | Zod-Schema fuer `ListingDraft` | P0 | Claude Code |
| T-903 | Kleinanzeigen-Template (Deutsch, Privatverkauf-Stil) | P1 | Claude Code |
| T-904 | `MockListingGenerator` mit Template-Befuellung | P1 | Claude Code |
| T-905 | `POST /api/items/:id/listing` - Listing fuer einen Gegenstand generieren | P1 | Codex |
| T-906 | `POST /api/bundles/:id/listing` - Listing fuer ein Bundle generieren | P2 | Codex |
| T-907 | `PATCH /api/listings/:id` - Listing-Text bearbeiten | P1 | Codex |
| T-908 | Listing-Preview-UI mit Bearbeitungsmodus | P1 | Codex |
| T-909 | Unit-Tests: Listing-Generator (Pflichtfelder, Unsicherheitssprache) | P1 | Claude Code |
| T-910 | eBay-Template (strukturierter, versandfreundlich) | P2 | Claude Code |
| T-911 | Vinted-Template (Kleidung, Groesse/Material) | P3 | Claude Code |

### E10 - Export

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-1001 | Copy-to-Clipboard-Komponente im Frontend | P1 | Codex |
| T-1002 | `GET /api/projects/:id/export?format=json` | P1 | Codex |
| T-1003 | `MarketplaceActionLog`-Eintrag beim Export erzeugen | P1 | Codex |
| T-1004 | `GET /api/projects/:id/export?format=csv` | P2 | Codex |

### E11 - Testing-Infrastruktur

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-1101 | `packages/testing` anlegen mit Fixture-Helfer | P1 | Claude Code |
| T-1102 | Fixture: Kinderbuecher-Bundle (niedriger Einzelwert, guter Bundle-Fit) | P1 | Claude Code |
| T-1103 | Fixture: LEGO-/Duplo-Paket (mittlerer Wert, guter Bundle-Fit) | P1 | Claude Code |
| T-1104 | Fixture: IKEA-Kallax-Regal (verkaufbar, nur Abholung) | P1 | Claude Code |
| T-1105 | Fixture: Bosch-Akkuschrauber (guter Einzelwert, fuer eBay geeignet) | P1 | Claude Code |
| T-1106 | Fixture: Kabel-Durcheinander (niedrig, Bundle oder entsorgen) | P1 | Claude Code |
| T-1107 | Fixture: Alte Elektronik (moeglicherweise defekt, sensible Kategorie) | P1 | Claude Code |
| T-1108 | Fixture: Kindersitz (sensible Kategorie, muss markiert werden) | P1 | Claude Code |
| T-1109 | Integrationstest: Upload -> Kandidaten -> Inventar | P1 | Claude Code |
| T-1110 | Integrationstest: Inventar -> Scoring -> Empfehlung | P1 | Claude Code |
| T-1111 | Integrationstest: Empfehlung -> ListingDraft -> Export | P1 | Claude Code |
| T-1112 | E2E-Test (Playwright): Vollstaendiger MVP-Flow | P2 | Codex |

### E12 - Datenloeschung und Datenschutz

| ID | Aufgabe | Prioritaet | Geeignet fuer |
|----|---------|------------|----------------|
| T-1201 | `DELETE /api/projects/:id` - Projekt mit allen Abhaengigkeiten loeschen | P1 | Codex |
| T-1202 | Kaskadenloeschung in Prisma konfigurieren | P1 | Codex (Review: Claude Code) |
| T-1203 | Storage-Bereinigung beim Loeschen von Assets sicherstellen | P1 | Codex |

---

## Uebergreifende Akzeptanzkriterien

Jede Feature-Aufgabe gilt als fertig, wenn:

- [ ] TypeScript fehlerfrei kompiliert (`pnpm typecheck`)
- [ ] Linting erfolgreich ist (`pnpm lint`)
- [ ] Unit-Tests vorhanden und gruen sind (`pnpm test`)
- [ ] API-Responses mit Zod validiert sind
- [ ] KI-Ausgaben nicht direkt als vertrauenswuerdiger State persistiert werden (`rawModelOutputJson` getrennt)
- [ ] Sensible Kategorien markiert werden, kein automatischer Verkauf
- [ ] Keine API-Keys oder Zugangsdaten im Code bzw. Repository liegen
- [ ] Das Handoff-Format aus `AGENTS.md` verwendet wird, wenn Aufgaben uebergeben werden
- [ ] Marketplace-Automatisierung vor irreversiblen Aktionen stoppt

---

## Priorisierung

| Prioritaet | Beschreibung | Task-IDs |
|------------|--------------|----------|
| **P0** | Blocker - ohne diese startet nichts | T-101, T-102, T-201, T-202, T-203, T-204, T-401, T-501, T-502, T-701 (Interface), T-901, T-902 |
| **P1** | MVP-Kern - minimaler Ende-zu-Ende-Flow ist beweisbar | T-103, T-301..304, T-402..407, T-503..507, T-601..606, T-702..706, T-903..909, T-1001..1003, T-1101..1111, T-1201..1203 |
| **P2** | MVP-Erweiterung - nuetzlich, aber nicht blockierend | T-408, T-801..804, T-906, T-910, T-1004, T-1112 |
| **P3** | Nach dem MVP | T-911, echter Vision-Provider (Phase 2), Playwright-Vorausfuellen (Phase 5), eBay-API (Phase 6) |

---

## Geeignet fuer Claude Code

Claude Code uebernimmt:

- Interface-Design: `VisionProvider`, `StorageProvider`, `ListingGenerator`, `ScoringEngine`
- Zod-Schema-Definitionen (`packages/shared`)
- Implementierung der Scoring-Engine (pure functions, gut testbar)
- Listing-Generator-Templates und Prompts
- Test-Fixtures und Unit-/Integrationstests
- Security- und Privacy-Reviews
- Formulierung von ADRs
- Vorbereitung von Handoff-Dokumenten fuer Codex

**Konkrete P0/P1-Aufgaben:** T-201, T-202 (Review), T-401, T-501, T-502, T-503, T-701..707, T-901..904, T-909, T-1101..1111

---

## Geeignet fuer Codex

Codex uebernimmt:

- Monorepo-Scaffold und Boilerplate (T-101, T-102)
- Prisma-Schema-Implementierung aus `DATA_MODEL.md` (T-202, T-203)
- NextAuth-Integration (T-301..304)
- Implementierung von API-Routen (CRUD-Endpunkte)
- Frontend-Komponenten (Upload-UI, Review-UI, Listing-Preview)
- `StorageProvider`-Implementierungen
- Export-Endpunkte
- E2E-Tests (Playwright, T-1112)

**Konkrete P0/P1-Aufgaben:** T-101, T-102, T-202, T-203, T-204, T-301..304, T-402..407, T-504..507, T-601..606, T-705, T-905..908, T-1001..1003, T-1201..1203

---

## Naechste empfohlene Schritte

### Schritt 1 - Phase 0 (parallel moeglich)
Einen echten Haushaltskarton mit 20-40 Gegenstaenden manuell durch den Workflow laufen lassen.  
Das Ergebnis als Grundlage fuer Scoring-Kalibrierung und Fixture-Daten dokumentieren.

### Schritt 2 - Offene technische Frage klaeren (F5b)
Image-Storage fuer Vercel-Prod entscheiden (R2 / S3 / Supabase Storage), bevor T-401 implementiert wird.  
Das Interface ist provider-agnostisch, aber die konkrete Produktiv-Implementierung sollte vor dem ersten Deployment feststehen.

### Schritt 3 - Monorepo-Setup (Claude Code -> Codex)
Claude Code: Zod-Schemas und Prisma-Schema aus `DATA_MODEL.md` vorbereiten (T-201, T-202 Draft).  
Codex: Monorepo-Scaffold auf Branch `feature/monorepo-setup` (T-101, T-102).

### Schritt 4 - Mock-Pipeline Ende zu Ende (Codex)
`MockVisionProvider` + Scoring + `MockListingGenerator` + Export auf Branch `feature/mock-pipeline`.  
Ziel: Der gesamte MVP-Flow ist ohne echte KI-Calls durchspielbar.

### Schritt 5 - Review-UI (Codex)
Item-Review-Oberflaeche bauen, damit Phase-0-Ergebnisse eingepflegt werden koennen.

### Schritt 6 - Echter Vision-Provider (Phase 2, nach MVP-Validierung)
Erst einbauen, wenn Phase 0 und die Mock-Pipeline valide Ergebnisse zeigen.
