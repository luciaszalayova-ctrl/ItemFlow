# IF-029-claude-vision-provider

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Einen echten Vision-Provider auf Basis der Claude API implementieren, der Bilder
analysiert und Kandidaten erkennt. Der `MockVisionProvider` bleibt als Fallback
erhalten. Die Upload-API-Route wählt den Provider anhand der Umgebungsvariablen.

---

## Kontext

- `packages/vision/src/providers/mock-vision.ts` — bestehender Mock
- `VisionProvider`-Interface in `packages/vision/src/index.ts`:
  ```typescript
  interface VisionProvider {
    readonly name: string
    analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult>
  }
  ```
- `VisionAnalysisInput`: `{ assetId, projectId, imageUrl }`
- `VisionAnalysisResult`: `{ assetId, candidates: VisionCandidateRaw[], rawOutput }`
- `VisionOutputSchema` und `VisionCandidateRawSchema` aus `@itemflow/shared` für
  Ausgabe-Validierung
- `OPENAI_API_KEY` ist in `.env.example` — wird durch `ANTHROPIC_API_KEY` ergänzt

---

## Ziel

Hochgeladene Bilder werden durch Claude Vision analysiert, statt immer dieselben
Mock-Kandidaten zurückzugeben.

---

## Betroffene Dateien

```
packages/vision/package.json                               ERWEITERN — @anthropic-ai/sdk
packages/vision/src/providers/claude-vision.ts             NEU
packages/vision/src/index.ts                               ERWEITERN — Export
.env.example                                               ERWEITERN — ANTHROPIC_API_KEY
apps/api/app/api/projects/[id]/assets/route.ts             ERWEITERN — Provider-Wahl
```

---

## Implementierungsdetails

### 1. `packages/vision/package.json` — Dependency hinzufügen

```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.52.0",
  "@itemflow/shared": "workspace:*"
}
```

Danach: `corepack pnpm install` im Root.

### 2. `packages/vision/src/providers/claude-vision.ts` — NEU

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { VisionOutputSchema } from '@itemflow/shared'
import type { VisionAnalysisInput, VisionAnalysisResult, VisionProvider } from '../index.js'

export class ClaudeVisionProvider implements VisionProvider {
  readonly name = 'claude-vision'
  private readonly client: Anthropic

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey })
  }

  async analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const systemPrompt = `Du bist ein Erkennungssystem für Haushaltsgegenstände.
Analysiere das Bild und gib eine JSON-Antwort zurück.
Antworte NUR mit validem JSON — kein Markdown, keine Erklärungen.

Format:
{
  "candidates": [
    {
      "rawLabel": "string — exakt was du siehst",
      "normalizedName": "string — standardisierter Produktname",
      "category": "string — Produktkategorie auf Deutsch",
      "confidence": 0.0 bis 1.0,
      "attributes": {}
    }
  ]
}

Regeln:
- Erkenne alle sichtbaren Gegenstände (nicht Möbel/Wände/Hintergrund)
- Maximal 10 Kandidaten
- confidence 0.9+ nur wenn du sehr sicher bist
- Wenn nichts Verkäufliches sichtbar ist: leere candidates-Liste`

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: input.imageUrl },
            },
            {
              type: 'text',
              text: 'Analysiere dieses Bild und erkenne alle verkäuflichen Gegenstände.',
            },
          ],
        },
      ],
      system: systemPrompt,
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('Claude Vision: keine Text-Antwort erhalten')
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(textContent.text)
    } catch {
      throw new Error(`Claude Vision: ungültiges JSON — ${textContent.text.slice(0, 200)}`)
    }

    const validated = VisionOutputSchema.parse(parsed)

    return {
      assetId: input.assetId,
      candidates: validated.candidates,
      rawOutput: { provider: 'claude-vision', model: 'claude-haiku-4-5-20251001', raw: parsed },
    }
  }
}
```

**Wichtig:** Rohe Modell-Ausgabe in `rawOutput` speichern (CLAUDE.md-Anforderung).
`VisionOutputSchema.parse()` wirft bei ungültiger Ausgabe — das ist gewollt.

### 3. `packages/vision/src/index.ts` — Export ergänzen

```typescript
export { ClaudeVisionProvider } from './providers/claude-vision.js'
```

### 4. `.env.example` — ergänzen

```
ANTHROPIC_API_KEY=
```

### 5. `apps/api/app/api/projects/[id]/assets/route.ts` — Provider-Wahl

Den Import und die Provider-Instantiierung anpassen:

```typescript
import { ClaudeVisionProvider, MockVisionProvider } from '@itemflow/vision'

function getVisionProvider() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    return new ClaudeVisionProvider(apiKey)
  }
  // Fallback: Mock mit leerer Kandidaten-Liste
  return new MockVisionProvider(new Map(), [])
}
```

`getVisionProvider()` innerhalb des Route-Handlers aufrufen (nicht auf Modul-Ebene,
damit der API-Key zur Request-Zeit gelesen wird).

---

## Akzeptanzkriterien

- [ ] `ClaudeVisionProvider` implementiert `VisionProvider`-Interface
- [ ] Ausgabe wird mit `VisionOutputSchema` validiert bevor Rückgabe
- [ ] Rohe Modell-Ausgabe wird in `rawOutput` gespeichert
- [ ] Wenn `ANTHROPIC_API_KEY` gesetzt: Claude-Provider wird verwendet
- [ ] Wenn kein Key: MockVisionProvider als Fallback
- [ ] `ANTHROPIC_API_KEY` in `.env.example` dokumentiert
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Modell: `claude-haiku-4-5-20251001` — günstigster Claude-Modell mit Vision-Support
- JSON-only Prompt — kein Markdown, keine Prosa-Antworten
- Bei Parse-Fehler: Exception werfen (nicht silent-fail) — der Upload-Handler gibt 500 zurück
- `imageUrl` muss öffentlich erreichbar sein — bei lokalem Storage ggf. Signed URL nötig
  (Hinweis in Kommentar, nicht im Scope dieses Tickets zu lösen)
- Kein `userId` oder Session-Daten an Anthropic senden
- Keine Bild-Daten loggen (Datenschutz, CLAUDE.md)

---

## Abhängigkeiten

- IF-007 (Upload API — ruft Vision-Provider auf) — merged ✓
- IF-001 (Local Storage Provider) — `imageUrl` kommt von dort
- `VisionProvider`-Interface in `packages/vision` — vorhanden ✓

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Signed URLs für lokalen Storage (separates Ticket wenn nötig)
- Streaming-Response
- Retry-Logik bei Anthropic-Fehler
- OpenAI-Vision-Provider (`.env.example` hat `OPENAI_API_KEY` — bleibt als Platzhalter)

---

## Referenzen

Review: REVIEW-IF-029 (nach Implementierung)
