import { prisma } from '@itemflow/db'
import { TemplateListingGenerator } from '@itemflow/listings'
import { GeneratedListingSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; bid: string }> }

export async function POST(_request: Request, context: RouteContext) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: projectId, bid } = await context.params
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

  const bundle = await prisma.bundle.findFirst({
    where: { id: bid, projectId },
    select: {
      id: true,
      projectId: true,
      title: true,
      itemIds: true,
      rationale: true,
      status: true,
      createdAt: true,
    },
  })

  if (!bundle) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (bundle.status === 'listing_created') {
    return Response.json({ error: 'Listing bereits erstellt.' }, { status: 409 })
  }

  if (bundle.status !== 'accepted') {
    return Response.json({ error: 'Bundle ist nicht für Listing-Erstellung freigegeben.' }, { status: 409 })
  }

  const bundleItems =
    bundle.itemIds.length > 0
      ? await prisma.inventoryItem.findMany({
          where: { id: { in: bundle.itemIds }, projectId },
          select: {
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
          },
        })
      : []

  const recommendations =
    bundleItems.length > 0
      ? await prisma.recommendation.findMany({
          where: { targetType: 'item', targetId: { in: bundleItems.map((item) => item.id) } },
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
    recommendations.length > 0
      ? [...latestByItem.values()].reduce((sum, recommendation) => {
          return sum + (recommendation.expectedPriceCents ?? 0)
        }, 0)
      : undefined

  const minimumPriceCents =
    recommendations.length > 0
      ? [...latestByItem.values()].reduce((sum, recommendation) => {
          return sum + (recommendation.minimumPriceCents ?? 0)
        }, 0)
      : undefined

  const generator = new TemplateListingGenerator()
  const raw = await generator.generate({
    targetType: 'bundle',
    bundle,
    bundleItems,
    platform: 'kleinanzeigen',
    suggestedPriceCents: suggestedPriceCents ?? undefined,
    minimumPriceCents: minimumPriceCents ?? undefined,
  })
  const generated = GeneratedListingSchema.parse(raw)

  const [listing] = await prisma.$transaction([
    prisma.listingDraft.create({
      data: {
        projectId,
        targetType: 'bundle',
        targetId: bundle.id,
        platform: 'kleinanzeigen',
        title: generated.title,
        description: generated.description,
        priceCents: generated.priceCents,
        minimumPriceCents: generated.minimumPriceCents ?? null,
        category: generated.category ?? null,
        shippingMode: generated.shippingMode ?? null,
        pickupOnly: generated.pickupOnly,
        photoAssetIds: [],
      },
    }),
    prisma.bundle.update({
      where: { id: bundle.id },
      data: { status: 'listing_created' },
    }),
  ])

  return Response.json({ listing })
}
