import { z } from 'zod'

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const
export const MAX_ASSET_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export const AssetSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  storageKey: z.string(),
  mimeType: z.string(),
  fileName: z.string(),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationSeconds: z.number().positive().nullable(),
  createdAt: z.coerce.date(),
})
export type Asset = z.infer<typeof AssetSchema>
