import type { InventoryItem, Bundle, RecommendationAction, ConfidenceLevel } from '@itemflow/shared'

export interface ScoringThresholds {
  /** Minimum sell_score to recommend sell_individually */
  sellMinScore: number
  /** Minimum expected price (cents) to recommend sell_individually */
  sellMinPriceCents: number
  /** Maximum expected price (cents) to consider bundling */
  bundleMaxPriceCents: number
  /** Minimum bundle_fit_score to recommend bundle */
  bundleMinFitScore: number
  /** Maximum expected price (cents) to recommend give_away */
  giveAwayMaxPriceCents: number
  /** Minimum effort_score to recommend give_away over bundling */
  giveAwayMinEffortScore: number
}

// Initial hypotheses from docs/SCORING_MODEL.md — calibrate after Phase 0
export const DEFAULT_THRESHOLDS: ScoringThresholds = {
  sellMinScore: 10,
  sellMinPriceCents: 2000, // 20 EUR
  bundleMaxPriceCents: 2000,
  bundleMinFitScore: 4,
  giveAwayMaxPriceCents: 1000,
  giveAwayMinEffortScore: 3,
}

export interface ItemScores {
  resaleValue: number // 1–5
  demand: number // 1–5
  brand: number // 1–5
  condition: number // 1–5
  bundleFit: number // 1–5
  effort: number // 1–5
  shippingPenalty: number // 0–3
  uncertaintyPenalty: number // 0–3
  total: number
}

export interface ScoringResult {
  action: RecommendationAction
  confidence: ConfidenceLevel
  rationale: string
  expectedPriceCents: number | null
  minimumPriceCents: number | null
  effortScore: number
  demandScore: number
  scores: ItemScores
  /** True for categories requiring manual review before any sell recommendation */
  isSensitiveCategory: boolean
}

export interface ScoringInput {
  item: InventoryItem
  thresholds?: Partial<ScoringThresholds>
}

export interface BundleScoringInput {
  bundle: Bundle
  items: InventoryItem[]
  thresholds?: Partial<ScoringThresholds>
}

export interface ScoringEngine {
  scoreItem(input: ScoringInput): ScoringResult
  scoreBundle(input: BundleScoringInput): ScoringResult
}

export type { InventoryItem, Bundle, RecommendationAction, ConfidenceLevel }
export { RecommendationActionSchema, ConfidenceLevelSchema } from '@itemflow/shared'
export { RuleBasedScoringEngine } from './engines/rule-based.js'
export { shouldAutoAccept, DEFAULT_AUTO_ACCEPT_THRESHOLD } from './auto-accept.js'
