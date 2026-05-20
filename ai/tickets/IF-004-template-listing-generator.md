# IF-004-template-listing-generator

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

`TemplateListingGenerator` implementieren — eine templatebasierte Implementierung des
`ListingGenerator`-Interface für die Kleinanzeigen-Plattform. Erzeugt Listing-Entwürfe
aus `InventoryItem`- oder `Bundle`-Daten ohne LLM-Calls. Validiert jede Ausgabe mit
`GeneratedListingSchema`. Schließt die Mock-Pipeline ab: Vision → Scoring → Listing.

---

## Kontext

- `ListingGenerator`-Interface: `packages/listings/src/index.ts`
- `GeneratedListingSchema`: `packages/shared/src/schemas/listing-draft.ts`
- Schreibregeln und Formate: `docs/LISTING_GENERATION.md`
- Referenz-Pattern (Validierung): `packages/vision/src/providers/mock-vision.ts`

---

## Ziel

Nach diesem Ticket kann ein `InventoryItem` oder `Bundle` vollständig in einen
Kleinanzeigen-Listing-Entwurf umgewandelt werden — ohne externe Dienste, deterministisch,
testbar. Die LLM-basierte Version (Phase 2) ersetzt diese Implementierung später.

---

## Betroffene Dateien

```
packages/listings/src/generators/template-kleinanzeigen.ts       NEU
packages/listings/src/generators/template-kleinanzeigen.test.ts  NEU
packages/listings/src/index.ts                                    export ergänzen
```

---

## Implementierungsdetails

### Klasse

```typescript
export class TemplateListingGenerator implements ListingGenerator {
  readonly platform: SupportedPlatform = 'kleinanzeigen'

  async generate(input: ListingGeneratorInput): Promise<GeneratedListing> {
    const listing = input.targetType === 'bundle'
      ? this.generateBundle(input)
      : this.generateItem(input)

    // Validierung erzwingen — KI-Outputs immer validieren (hier auch für Template-Ausgaben)
    return GeneratedListingSchema.parse(listing)
  }
}
```

---

### Titelgenerierung

Format nach `docs/LISTING_GENERATION.md`:
```
[Marke] [Name/Typ] [wichtiges Merkmal] [Zusatz]
```

Regeln:
- Marke voranstellen wenn `item.brand != null` → `"Bosch Akkuschrauber mit Ladegeraet"`
- Kein Brand → Titel beginnt mit `item.title`
- Kein Merkmal aus `item.model` → weglassen
- Bundle: `"{Kategorie} Paket ({n} Teile)"` → z.B. `"Kinderbücher Paket (3 Teile)"`
- Maximal 80 Zeichen (bei Überlänge am letzten Wort kürzen + `…`)

Beispiele:
| Input | Titel |
|-------|-------|
| brand: "Bosch", title: "Akkuschrauber mit Ladegeraet" | `"Bosch Akkuschrauber mit Ladegeraet"` |
| brand: null, title: "IKEA Kallax Regal" | `"IKEA Kallax Regal"` |
| bundle, 3 Kinderbücher, category "Bücher" | `"Bücher Paket (3 Teile)"` |

---

### Beschreibungsgenerierung

Template nach `docs/LISTING_GENERATION.md`:

```
Verkaufe {was}.
Zustand: {condition}.
{Enthalten-Block wenn bundle oder completeness vorhanden}
{Hinweise-Block wenn defects vorhanden}
Abholung bevorzugt, Versand auf Anfrage möglich.
Privatverkauf, keine Garantie oder Rücknahme.
{Preishinweis wenn minimumPriceCents vorhanden}
```

Ausfüllregeln:

| Platzhalter | Quelle | Fallback |
|-------------|--------|---------|
| `{was}` | `item.title` oder `"{n} {category}-Artikel"` für Bundle | — |
| `{condition}` | `item.condition` | `"Zustand nicht angegeben"` |
| `Enthalten:` | `item.completeness` (Einzelartikel) oder Titelliste der Bundle-Items | weglassen |
| `Hinweise:` | `item.defects` | weglassen |
| Preishinweis | `"Mindestpreis: {minimumPriceCents / 100} €."` | weglassen |

Bundle-Beschreibung führt alle Item-Titel als Liste auf:
```
Enthalten:
- Bosch Akkuschrauber
- Bosch Ladegeraet
```

---

### Preislogik

| Bedingung | priceCents |
|-----------|------------|
| `input.suggestedPriceCents` vorhanden | verwenden |
| nicht vorhanden | `500` (5 EUR Fallback — bewusst konservativ) |

`minimumPriceCents`: aus `input.minimumPriceCents`, falls vorhanden.

---

### Weitere Felder

| Feld | Wert |
|------|------|
| `pickupOnly` | `true` (Kleinanzeigen-Standard) |
| `shippingMode` | `"Abholung bevorzugt, Versand auf Anfrage"` |
| `category` | `item.category` (Einzelartikel) / häufigste Kategorie der Bundle-Items |
| `negotiationNotes` | `"Preis ist verhandelbar."` wenn `minimumPriceCents < priceCents`, sonst weglassen |
| `photoRecommendations` | Einzelartikel: `["Frontansicht", "Zustandsdetail"]` / Bundle: `["Alle Teile gemeinsam", "Einzelne Highlights"]` |

---

### Validierung

`GeneratedListingSchema.parse(listing)` muss auf jede Ausgabe angewendet werden — auch
bei Template-Generatoren. Etabliert das Pattern: jede `generate()`-Implementierung
validiert ihren Output, bevor sie ihn zurückgibt.

---

### Vitest-Konfiguration

`packages/listings` hat noch kein Vitest. Analog zu `packages/vision` einrichten:
- `vitest` als devDependency in `packages/listings/package.json`
- `test`-Script: `"vitest run"`

---

## Akzeptanzkriterien

- [ ] `TemplateListingGenerator` implementiert `ListingGenerator`-Interface vollständig
- [ ] `platform` ist `'kleinanzeigen'`
- [ ] Einzelartikel-Listing: Titel, Beschreibung, Preis korrekt befüllt
- [ ] Bundle-Listing: Titel enthält Teileanzahl, Beschreibung listet alle Items
- [ ] `item.defects != null` → Hinweise in Beschreibung vorhanden
- [ ] `item.condition == null` → Fallback-Text `"Zustand nicht angegeben"`
- [ ] `GeneratedListingSchema.parse()` auf jede Ausgabe angewendet
- [ ] Titel maximal 80 Zeichen
- [ ] `pnpm typecheck` grün
- [ ] `pnpm test` grün
- [ ] `pnpm lint` grün

---

## Test-Anforderungen

`packages/listings/src/generators/template-kleinanzeigen.test.ts` — mind. 6 Szenarien:

1. **Einzelartikel mit Brand** (Bosch Akkuschrauber) → Titel beginnt mit `"Bosch"`, `platform === 'kleinanzeigen'`
2. **Einzelartikel ohne Brand** (IKEA Regal, brand null) → Titel beginnt mit item.title
3. **Artikel mit Defekten** → `"Hinweise:"` in Beschreibung vorhanden
4. **Bundle aus 3 Items** → Titel enthält `"(3 Teile)"`, alle Item-Titel in Beschreibung
5. **Kein suggestedPriceCents** → `priceCents === 500` (Fallback)
6. **Ausgabe besteht `GeneratedListingSchema`-Validierung** (kein Throw)

---

## Rahmenbedingungen

- `ListingGenerator`-Interface NICHT verändern
- Keine externen Dependencies
- Kein LLM-Call — reine String-Interpolation
- `GeneratedListingSchema.parse()` ist Pflicht
- Texte auf Deutsch (`language`-Parameter in diesem Ticket ignorieren — Deutsch ist Pflicht)
- `input.platform` muss `'kleinanzeigen'` sein — bei anderer Platform `Error` werfen

---

## Referenzen

Entscheidungen: keine  
Offene Fragen: keine  
Review: REVIEW-IF-004 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- LLM-basierter Listing-Generator (Phase 2)
- eBay- oder Vinted-Implementierung
- Datenbankpersistenz des Listing-Drafts
- API-Route für Listing-Generierung
- Mehrsprachigkeit (`language`-Parameter)
