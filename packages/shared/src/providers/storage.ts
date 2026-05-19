import { z } from 'zod'

export const StorageUploadInputSchema = z.object({
  key: z.string().min(1),
  mimeType: z.string().min(1),
  fileName: z.string().min(1),
  sizeBytes: z.number().int().positive(),
})
export type StorageUploadInput = z.infer<typeof StorageUploadInputSchema> & {
  buffer: Buffer
}

export interface StorageUploadResult {
  key: string
  /** URL or path to access the file — format depends on provider */
  url: string
  sizeBytes: number
}

export interface StorageProvider {
  readonly name: string
  upload(input: StorageUploadInput): Promise<StorageUploadResult>
  delete(key: string): Promise<void>
  /** Returns a URL or local path for the given storage key */
  getUrl(key: string): string
}
