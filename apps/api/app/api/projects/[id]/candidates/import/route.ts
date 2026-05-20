import { Prisma, prisma } from '@itemflow/db'
import { DEFAULT_AUTO_ACCEPT_THRESHOLD, shouldAutoAccept } from '@itemflow/scoring'
import { ProjectSettingsSchema, VisionCandidateRawSchema } from '@itemflow/shared'
import { z } from 'zod'

import { auth } from '@/auth'

const ImportBodySchema = z.object({
  candidates: z.array(VisionCandidateRawSchema).min(1).max(50),
})

type RouteContext = { params: Promise<{ id: string }> }

const createdCandidateSelect = {
  id: true,
  rawLabel: true,
  normalizedName: true,
  category: true,
  confidence: true,
  status: true,
  createdAt: true,
} as const

export async function POST(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true, settings: true },
  })

  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = ImportBodySchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Ungueltiges Format.', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const settingsParsed = ProjectSettingsSchema.safeParse(project.settings ?? {})
  const threshold = settingsParsed.success
    ? settingsParsed.data.autoAcceptThreshold
    : DEFAULT_AUTO_ACCEPT_THRESHOLD

  const candidates = await prisma.$transaction(
    parsed.data.candidates.map((candidate) =>
      prisma.itemCandidate.create({
        data: {
          projectId,
          assetId: null,
          rawLabel: candidate.rawLabel,
          normalizedName: candidate.normalizedName,
          category: candidate.category,
          attributesJson: (candidate.attributes ?? {}) as Prisma.InputJsonValue,
          confidence: candidate.confidence,
          boundingBoxJson:
            candidate.boundingBox === undefined
              ? Prisma.DbNull
              : (candidate.boundingBox as Prisma.InputJsonValue),
          rawModelOutputJson: candidate as Prisma.InputJsonValue,
          status: 'pending',
        },
        select: createdCandidateSelect,
      }),
    ),
  )

  const toAutoAccept = candidates.filter((c) => shouldAutoAccept(c.confidence, threshold))

  if (toAutoAccept.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (let i = 0; i < toAutoAccept.length; i++) {
        const candidate = toAutoAccept[i]!
        const rawCandidate = parsed.data.candidates.find(
          (r) => r.rawLabel === candidate.rawLabel && r.normalizedName === candidate.normalizedName,
        )
        const brand =
          typeof rawCandidate?.attributes?.brand === 'string'
            ? rawCandidate.attributes.brand
            : null

        await tx.inventoryItem.create({
          data: {
            projectId,
            title: candidate.normalizedName,
            category: candidate.category,
            brand,
            status: 'ready_for_scoring',
            sourceCandidateIds: [candidate.id],
          },
        })

        await tx.itemCandidate.update({
          where: { id: candidate.id },
          data: { status: 'accepted' },
        })
      }
    })
  }

  const autoAccepted = toAutoAccept.length
  const pendingCount = candidates.length - autoAccepted

  return Response.json(
    { candidates, count: candidates.length, autoAccepted, pendingCount },
    { status: 201 },
  )
}
