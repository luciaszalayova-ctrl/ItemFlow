import { z } from 'zod'

export const InventoryItemStatusSchema = z.enum([
  'draft',
  'ready_for_scoring',
  'scored',
  'listing_created',
  'handled',
  'done',
])
export type InventoryItemStatus = z.infer<typeof InventoryItemStatusSchema>

export const InventoryItemSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  title: z.string(),
  category: z.string(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  condition: z.string().nullable(),
  quantity: z.number().int().min(1),
  description: z.string().nullable(),
  defects: z.string().nullable(),
  completeness: z.string().nullable(),
  scoringOverride: z
    .enum(['sell_individually', 'bundle', 'give_away', 'donate', 'recycle_dispose'])
    .nullable()
    .optional(),
  sourceCandidateIds: z.array(z.string()),
  status: InventoryItemStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type InventoryItem = z.infer<typeof InventoryItemSchema>

export const UpdateInventoryItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  condition: z.string().nullable().optional(),
  quantity: z.number().int().min(1).optional(),
  description: z.string().nullable().optional(),
  defects: z.string().nullable().optional(),
  completeness: z.string().nullable().optional(),
  status: z.enum(['ready_for_scoring', 'scored', 'done']).optional(),
  scoringOverride: z
    .enum(['sell_individually', 'bundle', 'give_away', 'donate', 'recycle_dispose'])
    .nullable()
    .optional(),
})
export type UpdateInventoryItem = z.infer<typeof UpdateInventoryItemSchema>
