import { z } from 'zod'

export const BundleStatusSchema = z.enum(['suggested', 'accepted', 'rejected', 'listing_created'])
export type BundleStatus = z.infer<typeof BundleStatusSchema>

export const BundleSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  itemIds: z.array(z.string()).min(2),
  rationale: z.string().nullable(),
  status: BundleStatusSchema,
  createdAt: z.coerce.date(),
})
export type Bundle = z.infer<typeof BundleSchema>
