import { prisma } from '@itemflow/db'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; lid: string }> }

const listingSelect = {
  id: true,
  projectId: true,
  targetType: true,
  targetId: true,
  platform: true,
  title: true,
  description: true,
  priceCents: true,
  minimumPriceCents: true,
  category: true,
  shippingMode: true,
  pickupOnly: true,
  photoAssetIds: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function POST(
  _request: Request,
  context: RouteContext,
) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, lid } = await context.params
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

  const listing = await prisma.listingDraft.findFirst({
    where: {
      id: lid,
      projectId,
    },
    select: {
      id: true,
      status: true,
    },
  })

  if (!listing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (listing.status === 'reviewed') {
    return Response.json({ error: 'Listing already approved' }, { status: 409 })
  }

  if (listing.status !== 'draft') {
    return Response.json({ error: 'Listing cannot be approved in current status' }, { status: 409 })
  }

  const updated = await prisma.listingDraft.update({
    where: { id: listing.id },
    data: { status: 'reviewed' },
    select: listingSelect,
  })

  return Response.json({ listing: updated }, { status: 200 })
}
