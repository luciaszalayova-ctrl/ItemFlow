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

  return Response.json({ item })
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

  if (item.status !== 'draft' && item.status !== 'ready_for_scoring') {
    return Response.json({ error: 'Item cannot be edited in current status' }, { status: 409 })
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

  const updated = await prisma.inventoryItem.update({
    where: { id: item.id },
    data: parsed.data,
    select: itemSelect,
  })

  return Response.json({ item: updated })
}
