import { z } from 'zod'

export const RecommendationActionSchema = z.enum([
  'sell_individually',
  'bundle',
  'give_away',
  'donate',
  'recycle_dispose',
  'needs_review',
])
export type RecommendationAction = z.infer<typeof RecommendationActionSchema>

export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low'])
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>

export const RecommendationTargetTypeSchema = z.enum(['item', 'bundle'])
export type RecommendationTargetType = z.infer<typeof RecommendationTargetTypeSchema>

export const RecommendationSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  targetType: RecommendationTargetTypeSchema,
  targetId: z.string(),
  action: RecommendationActionSchema,
  expectedPriceCents: z.number().int().nonnegative().nullable(),
  minimumPriceCents: z.number().int().nonnegative().nullable(),
  effortScore: z.number().int().min(1).max(5).nullable(),
  demandScore: z.number().int().min(1).max(5).nullable(),
  confidence: ConfidenceLevelSchema,
  rationale: z.string().nullable(),
  createdAt: z.coerce.date(),
})
export type Recommendation = z.infer<typeof RecommendationSchema>
