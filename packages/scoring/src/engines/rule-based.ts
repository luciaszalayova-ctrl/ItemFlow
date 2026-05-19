import type { Bundle, InventoryItem } from "@itemflow/shared";

import type {
  BundleScoringInput,
  ConfidenceLevel,
  ItemScores,
  RecommendationAction,
  ScoringEngine,
  ScoringInput,
  ScoringResult,
  ScoringThresholds
} from "../index.js";
import { DEFAULT_THRESHOLDS } from "../index.js";

export const PREMIUM_BRANDS = [
  "BOSCH",
  "MAKITA",
  "DEWALT",
  "APPLE",
  "SONY",
  "SAMSUNG",
  "LEGO",
  "PLAYMOBIL",
  "NIKE",
  "ADIDAS"
] as const;

export const MID_TIER_BRANDS = [
  "IKEA",
  "PHILIPS",
  "TEFAL",
  "BRAUN",
  "BUFFALO",
  "AEG",
  "SIEMENS"
] as const;

export const BUNDLE_CATEGORIES = [
  "buch",
  "buecher",
  "bücher",
  "spielzeug",
  "toy",
  "kabel",
  "zubehör",
  "zubehoer",
  "kleidung"
] as const;

export const SENSITIVE_CATEGORIES = [
  "kindersitz",
  "kindersitze",
  "helm",
  "helme",
  "babyschale",
  "elektrisch",
  "elektro",
  "medizin",
  "medikament",
  "kosmetik",
  "lebensmittel",
  "batterie",
  "waffe",
  "waffen"
] as const;

const CATEGORY_SCORE_RULES = [
  { terms: ["elektronik", "elektro", "electronic"], resaleValue: 4, demand: 4 },
  { terms: ["werkzeug", "tool"], resaleValue: 4, demand: 3 },
  { terms: ["spielzeug", "toy"], resaleValue: 3, demand: 3 },
  { terms: ["möbel", "moebel", "furniture"], resaleValue: 3, demand: 2 },
  { terms: ["kleidung", "clothing"], resaleValue: 2, demand: 3 },
  { terms: ["buch", "bücher", "buecher", "book"], resaleValue: 2, demand: 2 },
  { terms: ["kabel", "cable", "zubehör", "zubehoer"], resaleValue: 2, demand: 2 }
] as const;

export class RuleBasedScoringEngine implements ScoringEngine {
  constructor(private readonly thresholds: ScoringThresholds = DEFAULT_THRESHOLDS) {}

  scoreItem(input: ScoringInput): ScoringResult {
    const thresholds = resolveThresholds(this.thresholds, input.thresholds);
    const item = input.item;
    const scores = calculateItemScores(item);
    const pricing = estimatePrice(scores);
    const isSensitiveCategory = isSensitive(item.category);

    const action = determineAction({
      item,
      scores,
      thresholds,
      expectedPriceCents: pricing.expectedPriceCents,
      isSensitiveCategory
    });
    const confidence =
      action === "needs_review" ? "low" : getConfidenceLevel(scores.total);

    return {
      action,
      confidence,
      rationale: buildItemRationale(action, item, scores, isSensitiveCategory),
      expectedPriceCents: pricing.expectedPriceCents,
      minimumPriceCents: pricing.minimumPriceCents,
      effortScore: scores.effort,
      demandScore: scores.demand,
      scores,
      isSensitiveCategory
    };
  }

  scoreBundle(input: BundleScoringInput): ScoringResult {
    const thresholds = resolveThresholds(this.thresholds, input.thresholds);
    const results = input.items.map((item) => this.scoreItem({ item, thresholds }));
    const averageScores = averageItemScores(results.map((result) => result.scores));
    const boostedBundleFit = input.items.length > 2 ? Math.min(5, averageScores.bundleFit + 1) : averageScores.bundleFit;
    const scores: ItemScores = {
      ...averageScores,
      bundleFit: boostedBundleFit,
      total:
        averageScores.resaleValue +
        averageScores.demand +
        averageScores.brand +
        averageScores.condition -
        averageScores.effort -
        averageScores.shippingPenalty -
        averageScores.uncertaintyPenalty
    };

    const isSensitiveCategory = results.some((result) => result.isSensitiveCategory);
    const pricing = estimatePrice(scores);
    const action =
      isSensitiveCategory
        ? "needs_review"
        : pricing.expectedPriceCents <= thresholds.bundleMaxPriceCents &&
            scores.bundleFit >= thresholds.bundleMinFitScore
          ? "bundle"
          : determineBundleFallbackAction(scores, pricing.expectedPriceCents, thresholds);
    const confidence = action === "needs_review" ? "low" : action === "bundle" ? "medium" : getConfidenceLevel(scores.total);
    const categories = uniqueCategories(input.items);

    return {
      action,
      confidence,
      rationale: buildBundleRationale(action, input.bundle, categories, scores, isSensitiveCategory),
      expectedPriceCents: pricing.expectedPriceCents,
      minimumPriceCents: pricing.minimumPriceCents,
      effortScore: scores.effort,
      demandScore: scores.demand,
      scores,
      isSensitiveCategory
    };
  }
}

function determineAction({
  item,
  scores,
  thresholds,
  expectedPriceCents,
  isSensitiveCategory
}: {
  item: InventoryItem;
  scores: ItemScores;
  thresholds: ScoringThresholds;
  expectedPriceCents: number;
  isSensitiveCategory: boolean;
}): RecommendationAction {
  if (isSensitiveCategory) {
    return "needs_review";
  }

  if (scores.condition === 1 && item.defects !== null) {
    return "recycle_dispose";
  }

  if (
    scores.total >= thresholds.sellMinScore &&
    expectedPriceCents >= thresholds.sellMinPriceCents
  ) {
    return "sell_individually";
  }

  if (
    expectedPriceCents < thresholds.giveAwayMaxPriceCents &&
    scores.effort >= thresholds.giveAwayMinEffortScore
  ) {
    return "give_away";
  }

  if (
    expectedPriceCents <= thresholds.bundleMaxPriceCents &&
    scores.bundleFit >= thresholds.bundleMinFitScore
  ) {
    return "bundle";
  }

  if (scores.condition > 1 && scores.resaleValue <= 2) {
    return "donate";
  }

  return "needs_review";
}

function determineBundleFallbackAction(
  scores: ItemScores,
  expectedPriceCents: number,
  thresholds: ScoringThresholds
): RecommendationAction {
  if (
    expectedPriceCents < thresholds.giveAwayMaxPriceCents &&
    scores.effort >= thresholds.giveAwayMinEffortScore
  ) {
    return "give_away";
  }

  if (scores.condition > 1 && scores.resaleValue <= 2) {
    return "donate";
  }

  return "needs_review";
}

function calculateItemScores(item: InventoryItem): ItemScores {
  const categoryScores = getCategoryScores(item.category);
  const brand = getBrandScore(item.brand);
  const condition = getConditionScore(item.condition);
  const bundleFit = getBundleFitScore(item.category, item.quantity);
  const { effort, shippingPenalty } = getEffortAndShipping(item.category);
  const uncertaintyPenalty = getUncertaintyPenalty(item.condition, item.defects);
  const total =
    categoryScores.resaleValue +
    categoryScores.demand +
    brand +
    condition -
    effort -
    shippingPenalty -
    uncertaintyPenalty;

  return {
    resaleValue: categoryScores.resaleValue,
    demand: categoryScores.demand,
    brand,
    condition,
    bundleFit,
    effort,
    shippingPenalty,
    uncertaintyPenalty,
    total
  };
}

function averageItemScores(scoresList: ItemScores[]): ItemScores {
  if (scoresList.length === 0) {
    return {
      resaleValue: 2,
      demand: 2,
      brand: 1,
      condition: 2,
      bundleFit: 2,
      effort: 3,
      shippingPenalty: 1,
      uncertaintyPenalty: 2,
      total: -1
    };
  }

  const totals = scoresList.reduce(
    (accumulator, scores) => ({
      resaleValue: accumulator.resaleValue + scores.resaleValue,
      demand: accumulator.demand + scores.demand,
      brand: accumulator.brand + scores.brand,
      condition: accumulator.condition + scores.condition,
      bundleFit: accumulator.bundleFit + scores.bundleFit,
      effort: accumulator.effort + scores.effort,
      shippingPenalty: accumulator.shippingPenalty + scores.shippingPenalty,
      uncertaintyPenalty: accumulator.uncertaintyPenalty + scores.uncertaintyPenalty,
      total: accumulator.total + scores.total
    }),
    {
      resaleValue: 0,
      demand: 0,
      brand: 0,
      condition: 0,
      bundleFit: 0,
      effort: 0,
      shippingPenalty: 0,
      uncertaintyPenalty: 0,
      total: 0
    }
  );

  return {
    resaleValue: roundAverage(totals.resaleValue, scoresList.length),
    demand: roundAverage(totals.demand, scoresList.length),
    brand: roundAverage(totals.brand, scoresList.length),
    condition: roundAverage(totals.condition, scoresList.length),
    bundleFit: roundAverage(totals.bundleFit, scoresList.length),
    effort: roundAverage(totals.effort, scoresList.length),
    shippingPenalty: roundAverage(totals.shippingPenalty, scoresList.length),
    uncertaintyPenalty: roundAverage(totals.uncertaintyPenalty, scoresList.length),
    total: roundAverage(totals.total, scoresList.length)
  };
}

function estimatePrice(scores: ItemScores): {
  expectedPriceCents: number;
  minimumPriceCents: number;
} {
  const basePriceCents = scores.resaleValue * 1000;
  const conditionFactor = scores.condition / 5;
  const brandFactor = scores.brand === 5 ? 1.5 : scores.brand === 3 ? 1.1 : 1;
  const expectedPriceCents = Math.round(basePriceCents * conditionFactor * brandFactor);

  return {
    expectedPriceCents,
    minimumPriceCents: Math.round(expectedPriceCents * 0.6)
  };
}

function getConditionScore(condition: string | null): number {
  const normalized = normalize(condition);

  if (normalized === "") {
    return 2;
  }

  if (includesAny(normalized, ["neuwertig", "wie neu", "new"])) {
    return 5;
  }

  if (includesAny(normalized, ["sehr gut", "very good"])) {
    return 4;
  }

  if (includesAny(normalized, ["gut", "good"])) {
    return 3;
  }

  if (includesAny(normalized, ["befriedigend", "akzeptabel", "ok"])) {
    return 2;
  }

  if (includesAny(normalized, ["defekt", "kaputt", "broken"])) {
    return 1;
  }

  return 2;
}

function getCategoryScores(category: string): { resaleValue: number; demand: number } {
  const normalized = normalize(category);
  const match = CATEGORY_SCORE_RULES.find((rule) => includesAny(normalized, rule.terms));

  return match ?? { resaleValue: 2, demand: 2 };
}

function getBrandScore(brand: string | null): number {
  if (brand === null) {
    return 1;
  }

  const normalized = brand.trim().toUpperCase();

  if (PREMIUM_BRANDS.includes(normalized as (typeof PREMIUM_BRANDS)[number])) {
    return 5;
  }

  if (MID_TIER_BRANDS.includes(normalized as (typeof MID_TIER_BRANDS)[number])) {
    return 3;
  }

  return 2;
}

function getBundleFitScore(category: string, quantity: number): number {
  const normalized = normalize(category);
  const bundleCategory = includesAny(normalized, BUNDLE_CATEGORIES);

  if (bundleCategory && quantity > 1) {
    return 5;
  }

  if (bundleCategory) {
    return 4;
  }

  if (quantity > 1) {
    return 3;
  }

  return 2;
}

function getEffortAndShipping(category: string): {
  effort: number;
  shippingPenalty: number;
} {
  const normalized = normalize(category);

  if (includesAny(normalized, ["möbel", "moebel", "furniture"])) {
    return { effort: 5, shippingPenalty: 3 };
  }

  if (includesAny(normalized, ["elektronik", "elektro", "electronic"])) {
    return { effort: 3, shippingPenalty: 2 };
  }

  if (
    includesAny(normalized, [
      "buch",
      "bücher",
      "buecher",
      "book",
      "kleidung",
      "clothing",
      "zubehör",
      "zubehoer",
      "kabel",
      "cable"
    ])
  ) {
    return { effort: 2, shippingPenalty: 1 };
  }

  return { effort: 3, shippingPenalty: 1 };
}

function getUncertaintyPenalty(condition: string | null, defects: string | null): number {
  if (condition === null && defects === null) {
    return 2;
  }

  if (condition === null || defects !== null) {
    return 1;
  }

  return 0;
}

function isSensitive(category: string): boolean {
  return includesAny(normalize(category), SENSITIVE_CATEGORIES);
}

function getConfidenceLevel(sellScore: number): ConfidenceLevel {
  if (sellScore >= 14) {
    return "high";
  }

  if (sellScore >= 10) {
    return "medium";
  }

  return "low";
}

function buildItemRationale(
  action: RecommendationAction,
  item: InventoryItem,
  scores: ItemScores,
  isSensitiveCategory: boolean
): string {
  if (isSensitiveCategory) {
    return "Manuelle Prüfung: Kategorie erfordert Sicherheitsprüfung.";
  }

  if (action === "sell_individually") {
    return "Einzelverkauf empfohlen: hoher Wiederverkaufswert, bekannte Marke.";
  }

  if (action === "bundle") {
    return "Bundle empfohlen: geringer Einzelwert, aber gut bündelbar.";
  }

  if (action === "give_away") {
    return "Verschenken empfohlen: geringer Wert, hoher Aufwand.";
  }

  if (action === "donate") {
    return "Spende empfohlen: brauchbarer Zustand, aber schwacher Wiederverkaufswert.";
  }

  if (action === "recycle_dispose") {
    return `Entsorgen empfohlen: ${item.defects ?? "defekter Zustand"} und geringer Nutzwert.`;
  }

  if (scores.total < 10) {
    return "Manuelle Prüfung: Bewertung ist uneindeutig.";
  }

  return "Manuelle Prüfung: weitere Einordnung erforderlich.";
}

function buildBundleRationale(
  action: RecommendationAction,
  bundle: Bundle,
  categories: string[],
  scores: ItemScores,
  isSensitiveCategory: boolean
): string {
  if (isSensitiveCategory) {
    return "Manuelle Prüfung: Bundle enthält sicherheitsrelevante Kategorie.";
  }

  const base = `Bundle mit ${bundle.itemIds.length} Teilen. Kategorien: ${categories.join(", ")}.`;

  if (action === "bundle") {
    return `${base} Bundle empfohlen: gemeinsam attraktiver als einzeln.`;
  }

  if (action === "give_away") {
    return `${base} Verschenken empfohlen: geringer Wert bei relativ hohem Aufwand.`;
  }

  if (action === "donate") {
    return `${base} Spende empfohlen: brauchbar, aber mit geringem Wiederverkaufswert.`;
  }

  if (scores.total >= 10) {
    return `${base} Manuelle Prüfung: Scores sprechen teils für Einzelbewertung.`;
  }

  return `${base} Manuelle Prüfung: Bundle-Bewertung nicht eindeutig.`;
}

function resolveThresholds(
  defaults: ScoringThresholds,
  overrides?: Partial<ScoringThresholds>
): ScoringThresholds {
  return {
    ...defaults,
    ...overrides
  };
}

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function includesAny(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

function uniqueCategories(items: InventoryItem[]): string[] {
  return [...new Set(items.map((item) => item.category))];
}

function roundAverage(total: number, count: number): number {
  return Math.round(total / count);
}
