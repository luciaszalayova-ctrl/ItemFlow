import { prisma } from '@itemflow/db'
import { z } from 'zod'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; cid: string }> }

const ActionSchema = z.object({
  action: z.enum(['accept', 'reject']),
})

function extractBrand(attributesJson: unknown): string | null {
  if (typeof attributesJson === 'object' && attributesJson !== null) {
    const brand = (attributesJson as Record<string, unknown>).brand
    return typeof brand === 'string' ? brand : null
  }

  return null
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, cid } = await context.params
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true },
  })

  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
  }

  const parsed = ActionSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
  }

  const candidate = await prisma.itemCandidate.findFirst({
    where: {
      id: cid,
      projectId,
    },
    select: {
      id: true,
      projectId: true,
      normalizedName: true,
      category: true,
      attributesJson: true,
      status: true,
    },
  })

  if (!candidate) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (candidate.status !== 'pending') {
    return Response.json({ error: 'Candidate already processed' }, { status: 409 })
  }

  if (parsed.data.action === 'reject') {
    await prisma.itemCandidate.update({
      where: { id: candidate.id },
      data: { status: 'rejected' },
    })

    return Response.json({ candidateId: candidate.id, status: 'rejected' })
  }

  const inventoryItem = await prisma.$transaction(async (tx) => {
    await tx.itemCandidate.update({
      where: { id: candidate.id },
      data: { status: 'accepted' },
    })

    return tx.inventoryItem.create({
      data: {
        projectId: candidate.projectId,
        title: candidate.normalizedName,
        category: candidate.category,
        brand: extractBrand(candidate.attributesJson),
        sourceCandidateIds: [candidate.id],
        status: 'ready_for_scoring',
      },
      select: { id: true },
    })
  })

  return Response.json(
    {
      candidateId: candidate.id,
      status: 'accepted',
      inventoryItemId: inventoryItem.id,
    },
    { status: 201 },
  )
}
