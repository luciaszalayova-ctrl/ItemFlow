import { prisma } from '@itemflow/db'
import { TemplateListingGenerator } from '@itemflow/listings'
import { GeneratedListingSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; lid: string }> }

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

const bundleSelect = {
  id: true,
  projectId: true,
  title: true,
  itemIds: true,
  rationale: true,
  status: true,
  createdAt: true,
} as const

const listingSelect = {
  id: true,
  title: true,
  description: true,
  priceCents: true,
  minimumPriceCents: true,
  category: true,
  shippingMode: true,
  pickupOnly: true,
  status: true,
  updatedAt: true,
} as const

export async function POST(_request: Request, context: RouteContext) {
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
    where: { id: lid, projectId },
    select: {
      id: true,
      targetType: true,
      targetId: true,
      status: true,
    },
  })

  if (!listing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (listing.status !== 'draft' && listing.status !== 'reviewed') {
    return Response.json(
      { error: 'Listing kann in diesem Status nicht neu generiert werden.' },
      { status: 409 },
    )
  }

  const generator = new TemplateListingGenerator()
  let raw: unknown

  if (listing.targetType === 'item') {
    const item = await prisma.inventoryItem.findFirst({
      where: { id: listing.targetId, projectId },
      select: itemSelect,
    })

    if (!item) {
      return Response.json({ error: 'Item nicht gefunden.' }, { status: 404 })
    }

    const recommendation = await prisma.recommendation.findFirst({
      where: { targetType: 'item', targetId: item.id },
      orderBy: { createdAt: 'desc' },
      select: { expectedPriceCents: true, minimumPriceCents: true },
    })

    raw = await generator.generate({
      targetType: 'item',
      item,
      platform: 'kleinanzeigen',
      suggestedPriceCents: recommendation?.expectedPriceCents ?? undefined,
      minimumPriceCents: recommendation?.minimumPriceCents ?? undefined,
    })
  } else {
    const bundle = await prisma.bundle.findFirst({
      where: { id: listing.targetId, projectId },
      select: bundleSelect,
    })

    if (!bundle) {
      return Response.json({ error: 'Bundle nicht gefunden.' }, { status: 404 })
    }

    const bundleItems =
      bundle.itemIds.length > 0
        ? await prisma.inventoryItem.findMany({
            where: { id: { in: bundle.itemIds }, projectId },
            select: itemSelect,
          })
        : []

    const recommendations =
      bundleItems.length > 0
        ? await prisma.recommendation.findMany({
            where: {
              targetType: 'item',
              targetId: { in: bundleItems.map((item) => item.id) },
            },
            orderBy: { createdAt: 'desc' },
            select: {
              targetId: true,
              expectedPriceCents: true,
              minimumPriceCents: true,
            },
          })
        : []

    const latestByItem = new Map<
      string,
      { expectedPriceCents: number | null; minimumPriceCents: number | null }
    >()
    for (const recommendation of recommendations) {
      if (!latestByItem.has(recommendation.targetId)) {
        latestByItem.set(recommendation.targetId, recommendation)
      }
    }

    const suggestedPriceCents =
      latestByItem.size > 0
        ? [...latestByItem.values()].reduce((sum, recommendation) => {
            return sum + (recommendation.expectedPriceCents ?? 0)
          }, 0)
        : undefined

    const minimumPriceCents =
      latestByItem.size > 0
        ? [...latestByItem.values()].reduce((sum, recommendation) => {
            return sum + (recommendation.minimumPriceCents ?? 0)
          }, 0)
        : undefined

    raw = await generator.generate({
      targetType: 'bundle',
      bundle,
      bundleItems,
      platform: 'kleinanzeigen',
      suggestedPriceCents,
      minimumPriceCents,
    })
  }

  const generated = GeneratedListingSchema.parse(raw)

  const updated = await prisma.listingDraft.update({
    where: { id: listing.id },
    data: {
      title: generated.title,
      description: generated.description,
      priceCents: generated.priceCents,
      minimumPriceCents: generated.minimumPriceCents ?? null,
      category: generated.category ?? null,
      shippingMode: generated.shippingMode ?? null,
      pickupOnly: generated.pickupOnly,
      status: 'draft',
    },
    select: listingSelect,
  })

  return Response.json({ listing: updated })
}
