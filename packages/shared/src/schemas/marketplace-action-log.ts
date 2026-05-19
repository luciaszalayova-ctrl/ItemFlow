import { z } from 'zod'

export const MarketplaceActionTypeSchema = z.enum([
  'export',
  'copy',
  'prefill_started',
  'prefill_completed',
  'api_submission',
  'publish_confirmed',
])
export type MarketplaceActionType = z.infer<typeof MarketplaceActionTypeSchema>

export const MarketplaceActionLogSchema = z.object({
  id: z.string(),
  listingDraftId: z.string(),
  marketplace: z.string(),
  actionType: MarketplaceActionTypeSchema,
  status: z.string(),
  detailsJson: z.record(z.unknown()).nullable(),
  createdAt: z.coerce.date(),
})
export type MarketplaceActionLog = z.infer<typeof MarketplaceActionLogSchema>
