import { prisma } from '@itemflow/db'
import { DEFAULT_THRESHOLDS, RuleBasedScoringEngine } from '@itemflow/scoring'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; iid: string }> }

const scoreableItemSelect = {
  id: true,
  projectId: true,
  title: true,
  category: true,
  brand: true,
  model: true,
  condition: true,
  quantity: true,
  description: true,
  defects: true,
  completeness: true,
  sourceCandidateIds: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

const recommendationSelect = {
  id: true,
  action: true,
  confidence: true,
  rationale: true,
  expectedPriceCents: true,
  minimumPriceCents: true,
} as const

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, iid } = await context.params
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

  const item = await prisma.inventoryItem.findFirst({
    where: {
      id: iid,
      projectId,
    },
    select: scoreableItemSelect,
  })

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (item.status !== 'draft' && item.status !== 'ready_for_scoring') {
    return Response.json({ error: 'Item already scored or handled' }, { status: 409 })
  }

  const engine = new RuleBasedScoringEngine(DEFAULT_THRESHOLDS)
  const result = engine.scoreItem({ item })

  const recommendation = await prisma.$transaction(async (tx) => {
    const created = await tx.recommendation.create({
      data: {
        projectId: item.projectId,
        targetType: 'item',
        targetId: item.id,
        action: result.action,
        expectedPriceCents: result.expectedPriceCents,
        minimumPriceCents: result.minimumPriceCents,
        effortScore: result.effortScore,
        demandScore: result.demandScore,
        confidence: result.confidence,
        rationale: result.rationale,
      },
      select: recommendationSelect,
    })

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { status: 'scored' },
    })

    return created
  })

  return Response.json(
    {
      recommendation: {
        ...recommendation,
        isSensitiveCategory: result.isSensitiveCategory,
      },
    },
    { status: 201 },
  )
}
