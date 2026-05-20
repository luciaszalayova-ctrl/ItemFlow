# IF-048-zero-friction-start

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `backlog`

---

## Zusammenfassung

Nutzer sollen direkt mit dem Upload oder Import starten koennen, ohne
vorher ein Projekt anlegen und benennen zu muessen. Das Projekt wird
automatisch im Hintergrund mit einem generierten Namen angelegt.

---

## Kontext

Aktuell muss jeder Nutzer explizit auf „Neues Projekt" klicken, einen Titel
eingeben und das Formular abschicken, bevor er irgendetwas tun kann. Das ist
eine unnoetige Huerde, besonders beim ersten Besuch. Der Name ist zu diesem
Zeitpunkt noch nicht bekannt — er entsteht erst beim Sortieren.

Ziel: Den Weg von Null auf erstes Listing in so wenige Klicks wie moeglich
reduzieren.

---

## Anforderungen

### Automatische Projektanlage

- Auf der Startseite (`/projects`) gibt es neben „Neues Projekt" einen
  prominenten Einstiegspunkt „Direkt starten" oder alternativ wird der
  „Neues Projekt"-Button ersetzt.
- Klick auf diesen Button legt serverseitig sofort ein Projekt an mit dem
  Titel `Projekt [TT. Monat JJJJ]` (Beispiel: „Projekt 20. Mai 2026").
- Weiterleitung direkt zur Upload-Seite des neuen Projekts — kein
  Zwischenformular.

### Nachtraegliche Umbenennung

- Auf der Projekt-Uebersicht (`/projects/[id]`) kann der Titel inline
  bearbeitet werden (Klick auf den Titel → Textfeld → Speichern).
- Kein separates Bearbeiten-Formular noetig.

### Bestehende Projektliste bleibt erhalten

- Nutzer koennen weiterhin Projekte explizit benennen (Formular bleibt
  optional erreichbar).
- Automatisch angelegte Projekte erscheinen normal in der Projektliste.

---

## Betroffene Dateien

| Datei | Aenderung |
|-------|-----------|
| `apps/api/app/projects/page.tsx` | „Direkt starten"-Button mit Server Action oder API-Call |
| `apps/api/app/api/projects/route.ts` | `POST` — Titel-Feld optional machen, Fallback auf generierten Namen |
| `apps/api/app/projects/[id]/page.tsx` | Inline-Titel-Bearbeitung |
| `apps/api/app/api/projects/[id]/route.ts` | `PATCH` fuer Titel-Update (falls noch nicht vorhanden) |

---

## Akzeptanzkriterien

- [ ] Klick auf „Direkt starten" legt Projekt an und leitet zur Upload-Seite
      weiter — ohne Formular.
- [ ] Generierter Projektname folgt dem Format „Projekt TT. Monat JJJJ"
      (deutsches Datumsformat, ausgeschriebener Monatsname).
- [ ] Titel kann auf der Projekt-Uebersicht inline umbenannt werden.
- [ ] Bestehende Projekte und explizite Projektanlage sind nicht beeintraechtigt.
- [ ] `pnpm typecheck` und `pnpm lint` laufen fehlerfrei durch.

---

## Abhaengigkeiten

Keine blockers. Kann unabhaengig implementiert werden.

---

## Risiken

- Nutzer koennten viele unbenannte Projekte anlegen. Kein akutes Problem im
  MVP — kann spaeter mit einem Cleanup-Flow adressiert werden.

---

## Review: REVIEW-IF-048 (nach Implementierung)