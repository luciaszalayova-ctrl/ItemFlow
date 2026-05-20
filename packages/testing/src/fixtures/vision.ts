import type { VisionCandidateRaw } from "@itemflow/shared";

export const FIXTURE_KINDERBUCH_BUNDLE: VisionCandidateRaw[] = [
  {
    rawLabel: "Kinderbuch Der kleine Drache Kokosnuss",
    normalizedName: "Kinderbuch Der kleine Drache Kokosnuss",
    category: "books",
    attributes: { format: "hardcover", audienceAge: "ab 5 Jahren" },
    confidence: 0.86,
    bundlePotential: true
  },
  {
    rawLabel: "Kinderbuch Conni lernt Radfahren",
    normalizedName: "Kinderbuch Conni lernt Radfahren",
    category: "books",
    attributes: { format: "paperback", audienceAge: "ab 4 Jahren" },
    confidence: 0.84,
    bundlePotential: true
  },
  {
    rawLabel: "Kinderbuch Wieso Weshalb Warum Tiere",
    normalizedName: "Kinderbuch Wieso Weshalb Warum Tiere",
    category: "books",
    attributes: { format: "hardcover", audienceAge: "ab 4 Jahren" },
    confidence: 0.85,
    bundlePotential: true
  }
];

export const FIXTURE_LEGO_PAKET: VisionCandidateRaw[] = [
  {
    rawLabel: "LEGO Duplo Steine gemischt",
    normalizedName: "LEGO Duplo Steine Paket",
    category: "toys",
    attributes: { brand: "LEGO", productLine: "Duplo", mixedPieces: true },
    confidence: 0.88,
    bundlePotential: true
  }
];

export const FIXTURE_IKEA_REGAL: VisionCandidateRaw[] = [
  {
    rawLabel: "IKEA Kallax Regal weiss",
    normalizedName: "IKEA Kallax Regal",
    category: "furniture",
    attributes: { brand: "IKEA", color: "weiss", compartments: 4 },
    confidence: 0.92,
    bundlePotential: false
  }
];

export const FIXTURE_BOSCH_AKKU: VisionCandidateRaw[] = [
  {
    rawLabel: "Bosch Akkuschrauber mit Ladegerät",
    normalizedName: "Bosch Akkuschrauber mit Ladegerät",
    category: "tools",
    attributes: { brand: "Bosch", includedItems: ["Akkuschrauber", "Ladegerät"] },
    confidence: 0.93,
    bundlePotential: false
  }
];

export const FIXTURE_KABEL_CHAOS: VisionCandidateRaw[] = [
  {
    rawLabel: "Diverse Kabel und Adapter",
    normalizedName: "Kabel und Adapter Paket",
    category: "electronics-accessories",
    attributes: { mixedTypes: true, tangled: true },
    confidence: 0.45,
    bundlePotential: true,
    uncertaintyNotes: "Genauer Kabeltyp unklar"
  }
];

export const FIXTURE_KINDERSITZ: VisionCandidateRaw[] = [
  {
    rawLabel: "Kinderautositz",
    normalizedName: "Kinderautositz",
    category: "baby-gear",
    attributes: { installationType: "Isofix oder Gurt", color: "schwarz" },
    confidence: 0.82,
    bundlePotential: false,
    uncertaintyNotes: "Sicherheitsrelevantes Produkt — manuelle Prüfung erforderlich"
  }
];

export const FIXTURE_MAP = new Map<string, VisionCandidateRaw[]>([
  ["kinderbuch-bundle", FIXTURE_KINDERBUCH_BUNDLE],
  ["lego-paket", FIXTURE_LEGO_PAKET],
  ["ikea-regal", FIXTURE_IKEA_REGAL],
  ["bosch-akku", FIXTURE_BOSCH_AKKU],
  ["kabel-chaos", FIXTURE_KABEL_CHAOS],
  ["kindersitz", FIXTURE_KINDERSITZ]
]);
