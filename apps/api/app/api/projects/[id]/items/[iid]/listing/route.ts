import { prisma } from '@itemflow/db'
import { TemplateListingGenerator } from '@itemflow/listings'
import { GeneratedListingSchema } from '@itemflow/shared'

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

const draftSelect = {
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

  if (item.status === 'listing_created') {
    return Response.json({ error: 'Listing already created' }, { status: 409 })
  }

  if (item.status !== 'scored') {
    return Response.json({ error: 'Item is not ready for listing generation' }, { status: 409 })
  }

  const recommendation = await prisma.recommendation.findFirst({
    where: {
      targetType: 'item',
      targetId: item.id,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      action: true,
      expectedPriceCents: true,
      minimumPriceCents: true,
    },
  })

  if (!recommendation) {
    return Response.json({ error: 'Item has no recommendation' }, { status: 409 })
  }

  const sourceCandidates =
    item.sourceCandidateIds.length > 0
      ? await prisma.itemCandidate.findMany({
          where: {
            id: { in: item.sourceCandidateIds },
          },
          select: { assetId: true },
        })
      : []

  const photoAssetIds = Array.from(new Set(sourceCandidates.map((candidate) => candidate.assetId)))

  const generator = new TemplateListingGenerator()
  const raw = await generator.generate({
    targetType: 'item',
    item,
    platform: 'kleinanzeigen',
    suggestedPriceCents: recommendation.expectedPriceCents ?? undefined,
    minimumPriceCents: recommendation.minimumPriceCents ?? undefined,
  })
  const generated = GeneratedListingSchema.parse(raw)

  const draft = await prisma.$transaction(async (tx) => {
    const created = await tx.listingDraft.create({
      data: {
        projectId: item.projectId,
        targetType: 'item',
        targetId: item.id,
        platform: 'kleinanzeigen',
        title: generated.title,
        description: generated.description,
        priceCents: generated.priceCents,
        minimumPriceCents: generated.minimumPriceCents ?? null,
        category: generated.category ?? null,
        shippingMode: generated.shippingMode ?? null,
        pickupOnly: generated.pickupOnly,
        photoAssetIds,
      },
      select: draftSelect,
    })

    await tx.inventoryItem.update({
      where: { id: item.id },
      data: { status: 'listing_created' },
    })

    return created
  })

  return Response.json({ draft }, { status: 201 })
}
