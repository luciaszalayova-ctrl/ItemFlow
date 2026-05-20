import { prisma } from '@itemflow/db'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const exportSelect = {
  id: true,
  platform: true,
  title: true,
  description: true,
  priceCents: true,
  minimumPriceCents: true,
  category: true,
  pickupOnly: true,
  shippingMode: true,
  photoAssetIds: true,
} as const

export async function POST(
  _request: Request,
  context: RouteContext,
) {
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

  const listings = await prisma.listingDraft.findMany({
    where: {
      projectId,
      status: 'reviewed',
    },
    orderBy: { createdAt: 'asc' },
    select: exportSelect,
  })

  if (listings.length === 0) {
    return Response.json({ exported: [], count: 0 }, { status: 200 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.listingDraft.updateMany({
      where: {
        id: { in: listings.map((listing) => listing.id) },
      },
      data: { status: 'exported' },
    })

    await tx.marketplaceActionLog.createMany({
      data: listings.map((listing) => ({
        listingDraftId: listing.id,
        marketplace: listing.platform,
        actionType: 'export',
        status: 'completed',
      })),
    })
  })

  return Response.json(
    {
      exported: listings,
      count: listings.length,
    },
    { status: 200 },
  )
}
