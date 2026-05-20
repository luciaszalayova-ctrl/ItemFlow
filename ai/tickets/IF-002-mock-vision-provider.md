# IF-002-mock-vision-provider

Erstellt: 2026-05-19  
Erstellt von: Claude Code  
Implementiert von: **Codex**  
Status: `ready`

---

## Zusammenfassung

`MockVisionProvider` implementieren — eine deterministische Test-Implementierung des
`VisionProvider`-Interface, die vorkonfigurierte Fixture-Daten zurückgibt statt echte
KI-Calls zu machen. Dazu: 6 realistische Fixture-Szenarien in `packages/testing`.

---

## Kontext

- VisionProvider-Interface: `packages/vision/src/index.ts`
- Backlog-Tasks: T-503, T-1101, T-1102–T-1107
- Zweck: Vollständige Mock-Pipeline ohne echte KI-Calls testbar machen

Der MockVisionProvider ist die Grundlage für alle weiteren Tests und die
Mock-Analyse-Pipeline im MVP.

---

## Ziel

Nach diesem Ticket kann die gesamte Analyse-Pipeline (Upload → Erkennung → Review)
ohne echte KI-Calls durchgespielt werden. Tests und manuelle Entwicklung sind möglich.

---

## Betroffene Dateien

```
packages/vision/src/providers/mock-vision.ts      NEU
packages/vision/src/providers/mock-vision.test.ts NEU
packages/vision/src/index.ts                      export ergänzen

packages/testing/src/fixtures/vision.ts           NEU — Fixture-Szenarien
packages/testing/src/index.ts                     export ergänzen
packages/testing/tsconfig.json                    composite + references ergänzen
```

---

## Implementierungsdetails

### MockVisionProvider (`packages/vision/src/providers/mock-vision.ts`)

```typescript
export class MockVisionProvider implements VisionProvider {
  readonly name = 'mock'

  constructor(
    private readonly fixtures: Map<string, VisionCandidateRaw[]>,
    private readonly defaultCandidates: VisionCandidateRaw[] = []
  ) {}

  async analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const candidates = this.fixtures.get(input.imageUrl) ?? this.defaultCandidates
    // Validierung erzwingen — etabliert das Pattern für echte Provider
    VisionOutputSchema.parse({ candidates })
    return {
      assetId: input.assetId,
      candidates,
      rawOutput: { provider: 'mock', imageUrl: input.imageUrl },
    }
  }
}
```

### Fixture-Szenarien (`packages/testing/src/fixtures/vision.ts`)

6 Szenarien, je als `VisionCandidateRaw[]`:

| Konstante | Inhalt | Besonderheit |
|-----------|--------|-------------|
| `FIXTURE_KINDERBUCH_BUNDLE` | 3 Kinderbücher | bundlePotential: true, confidence ~0.85 |
| `FIXTURE_LEGO_PAKET` | LEGO/Duplo Steine gemischt | bundlePotential: true, Marke erkannt |
| `FIXTURE_IKEA_REGAL` | IKEA Kallax Regal | confidence hoch, Einzelverkauf |
| `FIXTURE_BOSCH_AKKU` | Bosch Akkuschrauber mit Ladegerät | confidence hoch, Marke klar |
| `FIXTURE_KABEL_CHAOS` | Diverses Kabel-Durcheinander | confidence niedrig, bundlePotential: true |
| `FIXTURE_KINDERSITZ` | Kinderautositz | `uncertaintyNotes: 'Sicherheitsrelevantes Produkt — manuelle Prüfung erforderlich'` |

Dazu: `FIXTURE_MAP` — fertige `Map<string, VisionCandidateRaw[]>` für direkten
Einsatz im MockVisionProvider (key = fixture name als String).

---

## Akzeptanzkriterien

- [ ] `MockVisionProvider` implementiert `VisionProvider`-Interface vollständig
- [ ] `analyze()` gibt Fixture-Daten für konfigurierten Key zurück
- [ ] `analyze()` gibt `defaultCandidates` zurück wenn kein Key passt
- [ ] `VisionOutputSchema.parse()` wird auf jeden Rückgabewert angewendet
- [ ] Alle 6 Fixture-Szenarien in `packages/testing/src/fixtures/vision.ts` vorhanden
- [ ] `FIXTURE_KINDERSITZ` enthält `uncertaintyNotes` mit Sicherheitshinweis
- [ ] Unit Tests: mind. 4 Szenarien (match, no-match, empty-default, schema-validation)
- [ ] `pnpm typecheck` grün
- [ ] `pnpm test` grün
- [ ] `pnpm lint` grün

---

## Test-Anforderungen

`packages/vision/src/providers/mock-vision.test.ts`:

1. Bekannter Key → gibt konfigurierte Candidates zurück
2. Unbekannter Key → gibt defaultCandidates zurück
3. Leere defaultCandidates → gibt leeres Array zurück (kein Fehler)
4. Rückgabewert besteht VisionOutputSchema-Validierung
5. `assetId` aus Input wird korrekt durchgereicht

---

## Rahmenbedingungen

- `VisionOutputSchema.parse()` ist Pflicht — KI-Outputs immer validieren
- `VisionProvider`-Interface NICHT verändern
- Fixtures müssen realistisch und für Scoring-Tests nutzbar sein
- `FIXTURE_KINDERSITZ` muss `uncertaintyNotes` enthalten (Safety-Anforderung)
- Keine echten Bild-URLs, keine externen Abhängigkeiten

---

## Referenzen

Entscheidungen: keine  
Offene Fragen: keine  
Review: REVIEW-IF-002 (nach Implementierung)

---

## Scope-Grenze

Nicht Teil dieses Tickets:
- Scoring-Logik (IF-003)
- Integration in API-Routen
- Echter Vision-Provider (Phase 2)
- Fixtures für Scoring oder Listings (separate Tickets)
