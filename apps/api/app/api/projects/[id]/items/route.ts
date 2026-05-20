import { prisma } from '@itemflow/db'
import { InventoryItemStatusSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

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

  let statusFilter: ReturnType<typeof InventoryItemStatusSchema.parse> | undefined
  if (rawStatusFilter !== null) {
    const parsedStatus = InventoryItemStatusSchema.safeParse(rawStatusFilter)
    if (!parsedStatus.success) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    statusFilter = parsedStatus.data
  }

  const items = await prisma.inventoryItem.findMany({
    where: {
      projectId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: itemSelect,
  })

  return Response.json({ items })
}
