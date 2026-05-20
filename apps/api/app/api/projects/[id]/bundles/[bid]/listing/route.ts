import { prisma } from '@itemflow/db'
import { generateListingDraft } from '@itemflow/listings'
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
      rationale: true,
      status: true,
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

  const raw = await generateListingDraft({
    title: bundle.title,
    description: bundle.rationale ?? '',
    condition: 'Verschiedene Zustände',
    category: 'Paket',
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
