import { z } from 'zod'

export const BundleStatusSchema = z.enum(['suggested', 'accepted', 'rejected', 'listing_created'])
export type BundleStatus = z.infer<typeof BundleStatusSchema>

export const BundleSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  itemIds: z.array(z.string()),
  rationale: z.string().nullable(),
  status: BundleStatusSchema,
  createdAt: z.coerce.date(),
})
export type Bundle = z.infer<typeof BundleSchema>

export const CreateBundleSchema = z.object({
  title: z.string().min(1).max(120),
  itemIds: z.array(z.string().cuid()).min(2),
  rationale: z.string().max(500).optional(),
})
export type CreateBundle = z.infer<typeof CreateBundleSchema>

export const UpdateBundleSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
})
export type UpdateBundle = z.infer<typeof UpdateBundleSchema>
