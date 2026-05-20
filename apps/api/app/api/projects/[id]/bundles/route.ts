import { prisma } from '@itemflow/db'
import { BundleStatusSchema, CreateBundleSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const bundleSelect = {
  id: true,
  title: true,
  itemIds: true,
  rationale: true,
  status: true,
  createdAt: true,
} as const

export async function GET(request: Request, context: RouteContext) {
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

  const { searchParams } = new URL(request.url)
  const rawStatusFilter = searchParams.get('status')

  let statusFilter: ReturnType<typeof BundleStatusSchema.parse> | undefined
  if (rawStatusFilter !== null) {
    const parsedStatus = BundleStatusSchema.safeParse(rawStatusFilter)
    if (!parsedStatus.success) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    statusFilter = parsedStatus.data
  }

  const bundles = await prisma.bundle.findMany({
    where: {
      projectId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: bundleSelect,
  })

  return Response.json({ bundles })
}

export async function POST(request: Request, context: RouteContext) {
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

  const parsed = CreateBundleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const found = await prisma.inventoryItem.findMany({
    where: { id: { in: parsed.data.itemIds }, projectId },
    select: { id: true, status: true },
  })

  if (found.length !== parsed.data.itemIds.length) {
    return Response.json({ error: 'Ein oder mehrere Items nicht gefunden.' }, { status: 422 })
  }

  const hasProcessedItem = found.some(
    (item) => item.status === 'listing_created' || item.status === 'handled',
  )
  if (hasProcessedItem) {
    return Response.json({ error: 'Item bereits verarbeitet' }, { status: 422 })
  }

  const bundle = await prisma.bundle.create({
    data: {
      projectId,
      title: parsed.data.title,
      itemIds: parsed.data.itemIds,
      rationale: parsed.data.rationale ?? null,
      status: 'suggested',
    },
    select: bundleSelect,
  })

  return Response.json({ bundle }, { status: 201 })
}
