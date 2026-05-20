import { z } from 'zod'

export const ProjectStatusSchema = z.enum(['active', 'archived', 'deleted'])
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

export const ProjectSettingsSchema = z.object({
  autoAcceptThreshold: z.number().min(0).max(1).default(0.85),
})
export type ProjectSettings = z.infer<typeof ProjectSettingsSchema>

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: ProjectStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Project = z.infer<typeof ProjectSchema>

export const CreateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
})
export type CreateProject = z.infer<typeof CreateProjectSchema>

export const UpdateProjectSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  settings: z.object({
    autoAcceptThreshold: z.number().min(0).max(1),
  }).optional(),
})
export type UpdateProject = z.infer<typeof UpdateProjectSchema>
