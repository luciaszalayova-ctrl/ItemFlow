import { prisma } from '@itemflow/db'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  })

  if (!project || project.status === 'deleted') {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (project.userId !== session.user.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const logs = await prisma.marketplaceActionLog.findMany({
    where: {
      listingDraft: {
        projectId: id,
      },
      actionType: 'export',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      marketplace: true,
      actionType: true,
      status: true,
      detailsJson: true,
      createdAt: true,
    },
  })

  return Response.json({ logs }, { status: 200 })
}
