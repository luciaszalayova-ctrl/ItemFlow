import type { VisionCandidateRaw } from '@itemflow/shared'

export interface VisionAnalysisInput {
  assetId: string
  projectId: string
  /** Accessible URL or signed URL to the uploaded image */
  imageUrl: string
}

export interface VisionAnalysisResult {
  assetId: string
  candidates: VisionCandidateRaw[]
  /** Raw model response stored separately from normalized data */
  rawOutput: Record<string, unknown>
}

export interface VisionProvider {
  readonly name: string
  analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult>
}

export type { VisionCandidateRaw }
export { VisionOutputSchema, VisionCandidateRawSchema } from '@itemflow/shared'
export { LocalFileSystemStorageProvider } from './providers/local-fs.js'
