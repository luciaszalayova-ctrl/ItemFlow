import { prisma } from '@itemflow/db'
import { UpdateInventoryItemSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; iid: string }> }

const itemSelect = {
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
  scoringOverride: true,
  sourceCandidateIds: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(
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
    select: itemSelect,
  })

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const latestRecommendation = await prisma.recommendation.findFirst({
    where: {
      targetType: 'item',
      targetId: item.id,
    },
    orderBy: { createdAt: 'desc' },
    select: { action: true },
  })

  return Response.json({
    item: {
      ...item,
      scoringRecommendation: latestRecommendation
        ? mapRecommendationAction(latestRecommendation.action)
        : null,
    },
  })
}

export async function PATCH(
  request: Request,
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
    select: {
      id: true,
      status: true,
    },
  })

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = UpdateInventoryItemSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const isOverrideOnlyUpdate =
    parsed.data.scoringOverride !== undefined && Object.keys(parsed.data).length === 1

  if (isOverrideOnlyUpdate) {
    if (item.status === 'listing_created' || item.status === 'handled') {
      return Response.json({ error: 'Item cannot be edited in current status' }, { status: 409 })
    }
  } else if (item.status !== 'draft' && item.status !== 'ready_for_scoring') {
    return Response.json({ error: 'Item cannot be edited in current status' }, { status: 409 })
  }

  const updated = await prisma.inventoryItem.update({
    where: { id: item.id },
    data: parsed.data,
    select: itemSelect,
  })

  const latestRecommendation = await prisma.recommendation.findFirst({
    where: {
      targetType: 'item',
      targetId: updated.id,
    },
    orderBy: { createdAt: 'desc' },
    select: { action: true },
  })

  return Response.json({
    item: {
      ...updated,
      scoringRecommendation: latestRecommendation
        ? mapRecommendationAction(latestRecommendation.action)
        : null,
    },
  })
}

function mapRecommendationAction(action: string): string {
  switch (action) {
    case 'sell_individually':
      return 'sell_single'
    case 'bundle':
      return 'bundle'
    case 'donate':
      return 'donate'
    case 'give_away':
      return 'gift'
    case 'recycle_dispose':
      return 'recycle'
    default:
      return action
  }
}
