import { prisma } from '@itemflow/db'
import { UpdateListingDraftSchema } from '@itemflow/shared'

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

export async function GET(
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
    select: listingSelect,
  })

  if (!listing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ listing })
}

export async function PATCH(
  request: Request,
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

  if (listing.status !== 'draft' && listing.status !== 'reviewed') {
    return Response.json({ error: 'Listing cannot be edited in current status' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = UpdateListingDraftSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const updated = await prisma.listingDraft.update({
    where: { id: listing.id },
    data: parsed.data,
    select: listingSelect,
  })

  return Response.json({ listing: updated })
}
