# IF-030-claude-listing-generator

Erstellt: 2026-05-20  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

Den Template-Listing-Generator in `packages/listings` durch einen Claude-basierten
Generator ersetzen. Alle Listings werden mit einem echten Sprachmodell erzeugt,
validiert mit `GeneratedListingSchema` und mit dem Template als Fallback abgesichert.

---

## Kontext

**Aktueller Stand** — `packages/listings/src/index.ts`:
```typescript
export async function generateListingDraft(input: {
  title: string
  description: string
  condition: string
  category: string
}): Promise<GeneratedListing> {
  return GeneratedListingSchema.parse({
    title: input.title,
    description: `Verkaufe ${input.title}. Zustand: ${input.condition}. ${input.description}`.trim(),
    priceCents: 500,           // ← Hardcoded!
    category: input.category,
    shippingMode: 'Abholung bevorzugt, Versand auf Anfrage moeglich.',
    pickupOnly: true,
  })
}
```

Alle Listings werden mit 5 € und einer generischen Beschreibung erstellt —
unbrauchbar für echte Verkäufe.

**`GeneratedListingSchema`** aus `@itemflow/shared`:
```typescript
z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().nonnegative(),
  minimumPriceCents: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  shippingMode: z.string().optional(),
  pickupOnly: z.boolean(),
  negotiationNotes: z.string().optional(),
  photoRecommendations: z.array(z.string()).optional(),
})
```

---

## Ziel

Claude generiert marktreife Kleinanzeigen-Texte mit realistischen Preisschätzungen.
Alle Ausgaben werden vor Persistierung validiert — kein unvalidiertes Modell-JSON
wird gespeichert (CLAUDE.md-Anforderung).

---

## Betroffene Dateien

```
packages/listings/package.json         ERWEITERN — @anthropic-ai/sdk
packages/listings/src/index.ts         ERWEITERN — Claude-Generator + Fallback
.env.example                           — bereits durch IF-029 ergänzt
```

---

## Implementierungsdetails

### 1. `packages/listings/package.json` — Dependency hinzufügen

```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.52.0",
  "@itemflow/shared": "workspace:*"
}
```

Danach: `corepack pnpm install` im Root.

### 2. `packages/listings/src/index.ts` — Ersetzen + Fallback

Die bestehende Funktion `generateListingDraft` erweitern: Wenn `ANTHROPIC_API_KEY`
gesetzt ist, Claude verwenden; sonst Template-Fallback.

```typescript
import Anthropic from '@anthropic-ai/sdk'
import type { InventoryItem, Bundle, GeneratedListing, SupportedPlatform } from '@itemflow/shared'
import { GeneratedListingSchema } from '@itemflow/shared'

export async function generateListingDraft(input: {
  title: string
  description: string
  condition: string
  category: string
}): Promise<GeneratedListing> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey) {
    return generateWithClaude(input, apiKey)
  }
  return generateWithTemplate(input)
}

async function generateWithClaude(
  input: { title: string; description: string; condition: string; category: string },
  apiKey: string,
): Promise<GeneratedListing> {
  const client = new Anthropic({ apiKey })

  const prompt = `Erstelle ein Kleinanzeigen-Inserat für folgenden Artikel:

Titel: ${input.title}
Kategorie: ${input.category}
Zustand: ${input.condition || 'nicht angegeben'}
Beschreibung: ${input.description || 'keine'}

Antworte NUR mit validem JSON, kein Markdown, keine Erklärungen:
{
  "title": "prägnanter Titel max. 80 Zeichen",
  "description": "ansprechende Beschreibung max. 500 Zeichen, Zustand und Besonderheiten erwähnen",
  "priceCents": Preisvorschlag in Cent als Integer (realistisch für deutschen Gebrauchtmarkt),
  "minimumPriceCents": Mindestpreis in Cent als Integer oder null,
  "category": "Kategoriebezeichnung",
  "shippingMode": "Versandhinweis oder null",
  "pickupOnly": true oder false
}

Regeln:
- Preise realistisch für Kleinanzeigen (nicht eBay-Auktionspreise)
- Kein Marketing-Sprech, keine Übertreibungen
- Ehrlicher Ton — Mängel wenn bekannt erwähnen
- Deutsch`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const textContent = message.content.find((block) => block.type === 'text')
  if (!textContent || textContent.type !== 'text') {
    throw new Error('Claude Listing: keine Text-Antwort erhalten')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(textContent.text)
  } catch {
    throw new Error(`Claude Listing: ungültiges JSON — ${textContent.text.slice(0, 200)}`)
  }

  // Alle KI-Ausgaben validieren bevor Rückgabe (CLAUDE.md)
  return GeneratedListingSchema.parse(parsed)
}

function generateWithTemplate(input: {
  title: string
  description: string
  condition: string
  category: string
}): GeneratedListing {
  return GeneratedListingSchema.parse({
    title: input.title,
    description: `Verkaufe ${input.title}. Zustand: ${input.condition}. ${input.description}`.trim(),
    priceCents: 500,
    category: input.category,
    shippingMode: 'Abholung bevorzugt, Versand auf Anfrage moeglich.',
    pickupOnly: true,
  })
}
```

---

## Akzeptanzkriterien

- [ ] Wenn `ANTHROPIC_API_KEY` gesetzt: Claude generiert Listing-Text und Preis
- [ ] Wenn kein Key: Template-Fallback funktioniert unverändert
- [ ] Claude-Ausgabe wird mit `GeneratedListingSchema.parse()` validiert — Exception bei ungültiger Ausgabe
- [ ] Kein unvalidiertes JSON wird zurückgegeben
- [ ] `pnpm typecheck` grün
- [ ] `pnpm lint` grün

---

## Rahmenbedingungen

- Modell: `claude-haiku-4-5-20251001` — schnell und günstig für Textgenerierung
- JSON-only Prompt — kein Markdown
- Bei Parse-Fehler: Exception werfen (Caller — die API-Route — gibt 500 zurück)
- Kein Nutzerdaten-Logging in der Funktion
- `process.env.ANTHROPIC_API_KEY` zur Laufzeit lesen (nicht zur Modul-Import-Zeit)

---

## Abhängigkeiten

- IF-004 (Template Listing Generator) — wird erweitert, nicht ersetzt
- IF-012 (Listing-Generierungs-API) — ruft `generateListingDraft()` auf
- IF-029 (Claude Vision Provider) — `ANTHROPIC_API_KEY` bereits in `.env.example`

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Preisschätzung aus Scoring-Daten an den Generator weitergeben (eigenes Refactor)
- Streaming-Response
- Retry-Logik
- Plattform-spezifische Prompts (Kleinanzeigen vs. eBay vs. Vinted)
- Tests für Claude-Ausgabe (Mocking der Anthropic-API)

---

## Referenzen

Review: REVIEW-IF-030 (nach Implementierung)
