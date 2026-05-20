import { prisma } from '@itemflow/db'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const exportSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  minimumPriceCents: true,
  category: true,
  shippingMode: true,
  pickupOnly: true,
  status: true,
  targetType: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET(request: Request, context: RouteContext) {
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

  const format = new URL(request.url).searchParams.get('format') ?? 'json'
  if (format !== 'json') {
    return Response.json({ error: 'Unsupported format' }, { status: 400 })
  }

  const listings = await prisma.listingDraft.findMany({
    where: {
      projectId: id,
      status: { not: 'archived' },
    },
    select: exportSelect,
    orderBy: { createdAt: 'asc' },
  })

  return new Response(
    JSON.stringify(
      {
        listings,
        exportedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="itemflow-export-${id}.json"`,
      },
    },
  )
}
