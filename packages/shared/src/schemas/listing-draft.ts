import { z } from 'zod'

export const ListingStatusSchema = z.enum([
  'draft',
  'reviewed',
  'exported',
  'prefilled',
  'published_external',
  'archived',
])
export type ListingStatus = z.infer<typeof ListingStatusSchema>

export const SupportedPlatformSchema = z.enum(['kleinanzeigen', 'ebay', 'vinted', 'other'])
export type SupportedPlatform = z.infer<typeof SupportedPlatformSchema>

export const ListingDraftSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  targetType: z.enum(['item', 'bundle']),
  targetId: z.string(),
  platform: SupportedPlatformSchema,
  title: z.string(),
  description: z.string(),
  priceCents: z.number().int().nonnegative(),
  minimumPriceCents: z.number().int().nonnegative().nullable(),
  category: z.string().nullable(),
  shippingMode: z.string().nullable(),
  pickupOnly: z.boolean(),
  photoAssetIds: z.array(z.string()),
  status: ListingStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type ListingDraft = z.infer<typeof ListingDraftSchema>

// Validates AI-generated listing output before it is stored as a draft.
export const GeneratedListingSchema = z.object({
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
export type GeneratedListing = z.infer<typeof GeneratedListingSchema>

export const UpdateListingDraftSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  description: z.string().min(1).max(2000).optional(),
  priceCents: z.number().int().nonnegative().optional(),
  minimumPriceCents: z.number().int().nonnegative().nullable().optional(),
  category: z.string().nullable().optional(),
  shippingMode: z.string().nullable().optional(),
  pickupOnly: z.boolean().optional(),
})
export type UpdateListingDraft = z.infer<typeof UpdateListingDraftSchema>
