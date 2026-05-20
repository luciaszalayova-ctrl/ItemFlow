import { prisma } from '@itemflow/db'
import { z } from 'zod'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const BulkPatchSchema = z.object({
  ids: z.array(z.string()).min(1).max(50),
  action: z.enum(['accept', 'reject']),
})

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId } = await context.params
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
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = BulkPatchSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { ids, action } = parsed.data

  await prisma.$transaction(async (tx) => {
    const candidates = await tx.itemCandidate.findMany({
      where: { id: { in: ids }, projectId, status: 'pending' },
      select: { id: true },
    })

    const validIds = candidates.map((c) => c.id)

    if (action === 'accept') {
      for (const cid of validIds) {
        const candidate = await tx.itemCandidate.findUnique({
          where: { id: cid },
          select: {
            id: true,
            normalizedName: true,
            category: true,
            attributesJson: true,
          },
        })
        if (!candidate) continue

        const attrs = candidate.attributesJson as Record<string, unknown> | null
        const brand = typeof attrs?.brand === 'string' ? attrs.brand : null

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
          where: { id: cid },
          data: { status: 'accepted' },
        })
      }
    } else {
      await tx.itemCandidate.updateMany({
        where: { id: { in: validIds } },
        data: { status: 'rejected' },
      })
    }
  })

  return Response.json({ processed: ids.length })
}
