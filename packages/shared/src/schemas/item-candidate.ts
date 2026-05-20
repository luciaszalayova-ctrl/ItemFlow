import { z } from 'zod'

export const CandidateStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'merged', 'split'])
export type CandidateStatus = z.infer<typeof CandidateStatusSchema>

export const ItemCandidateSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  assetId: z.string().nullable(),
  rawLabel: z.string(),
  normalizedName: z.string(),
  category: z.string(),
  attributesJson: z.record(z.unknown()),
  confidence: z.number().min(0).max(1),
  boundingBoxJson: z.record(z.unknown()).nullable(),
  rawModelOutputJson: z.record(z.unknown()),
  status: CandidateStatusSchema,
  createdAt: z.coerce.date(),
})
export type ItemCandidate = z.infer<typeof ItemCandidateSchema>

// Validates raw AI vision output before it is trusted or stored.
// All fields are intentionally strict — the model must conform to this shape.
export const VisionCandidateRawSchema = z.object({
  rawLabel: z.string().min(1),
  normalizedName: z.string().min(1),
  category: z.string().min(1),
  attributes: z.record(z.unknown()).default({}),
  confidence: z.number().min(0).max(1),
  boundingBox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  bundlePotential: z.boolean().default(false),
  uncertaintyNotes: z.string().optional(),
})
export type VisionCandidateRaw = z.infer<typeof VisionCandidateRawSchema>

export const VisionOutputSchema = z.object({
  candidates: z.array(VisionCandidateRawSchema),
})
export type VisionOutput = z.infer<typeof VisionOutputSchema>
