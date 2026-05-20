# IF-034-chatgpt-import-ui

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Eine Import-Seite bauen, ueber die Nutzer das ChatGPT-JSON per Textarea einfuegen,
eine Vorschau der erkannten Gegenstaende sehen, bestaetigen und danach direkt in
den normalen Kandidaten-Review-Flow weitergeleitet werden.

---

## Kontext

IF-033 liefert den Import-Endpunkt (`POST /api/projects/:id/candidates/import`).
Dieses Ticket baut die dazugehoerige UI-Seite.

Der Nutzer-Prompt fuer ChatGPT liegt in `docs/PROMPTS.md` unter
"Manueller ChatGPT-Workflow".

---

## Betroffene Dateien

```
apps/api/app/projects/[id]/import/page.tsx  NEU
```

Optionale Verlinkung (nicht zwingend Teil dieses Tickets):

```
apps/api/app/projects/[id]/candidates/page.tsx  optional: Link zur Import-Seite erwaehnen
```

---

## Implementierungsdetails

### Seite: `app/projects/[id]/import/page.tsx`

Client Component (`'use client'`).

**State:**

```typescript
const [json, setJson] = useState('')
const [parsed, setParsed] = useState<VisionCandidateRaw[] | null>(null)
const [parseError, setParseError] = useState<string | null>(null)
const [submitting, setSubmitting] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**Ablauf:**

1. Nutzer fuegt JSON in die Textarea ein.
2. "Vorschau" Button (oder onChange-Debounce) parst und validiert client-seitig:
   - `JSON.parse()` — bei SyntaxError: `parseError = 'Kein gueltiges JSON.'`
   - Dann `z.array(VisionCandidateRawSchema).safeParse(data)` — bei Fehler
     Fehlermeldung setzen
   - Bei Erfolg: `parsed` setzen und Vorschau anzeigen
3. Vorschau: Liste der erkannten Gegenstaende (Name, Kategorie, Confidence-Balken).
4. "Importieren" Button sendet `POST /api/projects/:id/candidates/import`
   mit `{ candidates: parsed }`.
5. Bei `201`: weiterleiten nach `/projects/:id/candidates`.
6. Bei Fehler: `error` setzen, Fehlermeldung anzeigen.

**Prompt-Hinweis:**

Oberhalb der Textarea einen klappbaren Hinweis ("ChatGPT-Prompt anzeigen")
mit dem Copy-Paste-Prompt aus `docs/PROMPTS.md`. Oder einfacher: Statischer
Hinweistext mit Link zu einer Erklaerung.

Minimal-Variante: kurzer Text "Prompt generieren mit ChatGPT — Anleitung im
Tooltip oder als ausklappbarer Block".

---

### Ungefaehre UI-Struktur

```
← Zurueck zum Projekt

[Header]
ChatGPT-Import

[Beschreibungstext]
Lade deine Fotos in ChatGPT hoch, nutze den unten stehenden Prompt
und fuege die JSON-Antwort hier ein.

[Prompt anzeigen ▼]  (Toggle-Block mit Kopier-Button)
  ```
  Analysiere das/die Bild(er) und erkenne alle verkaeuflichen...
  ```

[Textarea]
  Placeholder: [ { "rawLabel": "...", ... } ]

[Fehleranzeige — parseError oder error]

[Vorschau-Liste] (nur wenn parsed !== null)
  - IKEA Kallax Regal  ·  Moebel  ·  ████████░░ 0.85
  - Bosch Akkuschrauber  ·  Werkzeug  ·  █████████░ 0.92
  ...

[Button: Importieren] (disabled wenn !parsed || submitting)
  submitting → "Wird importiert..."
```

---

### Confidence-Anzeige in der Vorschau

Kein extra Paket noetig — einfache CSS-Balken:

```tsx
<div style={{ width: '8rem', height: '0.5rem', background: '#e2d9ca', borderRadius: '999px' }}>
  <div
    style={{
      width: `${Math.round(candidate.confidence * 100)}%`,
      height: '100%',
      background: candidate.confidence >= 0.8 ? '#1f6f5f' : '#c07a2a',
      borderRadius: '999px',
    }}
  />
</div>
```

---

### Client-seitige Validation

```typescript
import { VisionCandidateRawSchema } from '@itemflow/shared'
import { z } from 'zod'

function parseInput(raw: string): { ok: true; data: VisionCandidateRaw[] } | { ok: false; error: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, error: 'Kein gueltiges JSON.' }
  }

  const result = z.array(VisionCandidateRawSchema).safeParse(parsed)
  if (!result.success) {
    const firstIssue = result.error.issues[0]
    return {
      ok: false,
      error: `Ungueltiges Format: ${firstIssue?.message ?? 'Unbekannter Fehler'} (Eintrag ${(firstIssue?.path[0] ?? '?').toString()})`,
    }
  }

  if (result.data.length === 0) {
    return { ok: false, error: 'Das Array ist leer.' }
  }

  return { ok: true, data: result.data }
}
```

---

## Akzeptanzkriterien

- [ ] Seite erreichbar unter `/projects/:id/import`
- [ ] Textarea nimmt JSON-Input entgegen
- [ ] Ungueltiges JSON zeigt verstaendliche Fehlermeldung (kein Stack Trace)
- [ ] Gueltiges JSON zeigt Vorschau mit Name, Kategorie und Confidence pro Eintrag
- [ ] "Importieren" ist deaktiviert solange keine gueltige Vorschau vorliegt
- [ ] Erfolgreicher Import leitet nach `/projects/:id/candidates` weiter
- [ ] API-Fehler wird als Fehlermeldung angezeigt
- [ ] Prompt-Text fuer ChatGPT ist auf der Seite sichtbar (statisch oder toggle)
- [ ] `pnpm typecheck` gruen
- [ ] `pnpm lint` gruen

---

## Rahmenbedingungen

- Nur Client Component — kein Server Action noetig.
- Kein Routing-State zwischen Textarea und Vorschau — alles auf einer Seite.
- `useRouter().push()` fuer die Weiterleitung nach Import.
- Seiten-Design konsistent mit dem restlichen Projekt (Inline-Styles, gleiche
  Farbpalette wie `listings/page.tsx`).
- Max-Laenge fuer Textarea: 50 Eintraege werden bereits im API-Layer begrenzt;
  kein zusaetzlicher Client-Guard noetig.

---

## Abhaengigkeiten

- IF-033 (Import-API) — muss zuerst gemergt sein

---

## Referenzen

Review: REVIEW-IF-034 (nach Implementierung)
