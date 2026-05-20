import { prisma } from '@itemflow/db'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

type ExportListing = {
  id: string
  title: string
  description: string
  priceCents: number
  minimumPriceCents: number | null
  category: string | null
  shippingMode: string | null
  pickupOnly: boolean
  status: string
  targetType: string
}

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

type LoggableListing = Pick<ExportListing, 'id' | 'targetType'> & {
  platform?: string
}

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
  if (format !== 'json' && format !== 'csv') {
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

  await logExportActions({
    format,
    listings,
  })

  if (format === 'csv') {
    const csv = toCsv(listings)
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="itemflow-export-${id}.csv"`,
      },
    })
  }

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

async function logExportActions({
  format,
  listings,
}: {
  format: 'json' | 'csv'
  listings: LoggableListing[]
}) {
  if (listings.length === 0) {
    return
  }

  try {
    await prisma.marketplaceActionLog.createMany({
      data: listings.map((listing) => ({
        listingDraftId: listing.id,
        marketplace: listing.platform ?? listing.targetType,
        actionType: 'export',
        status: 'completed',
        detailsJson: {
          format,
          listingCount: listings.length,
        },
      })),
    })
  } catch {
    // Exporte sollen auch dann funktionieren, wenn das Logging fehlschlaegt.
  }
}

function toCsv(listings: ExportListing[]): string {
  const header = [
    'id',
    'titel',
    'beschreibung',
    'preis_euro',
    'mindestpreis_euro',
    'kategorie',
    'versandmodus',
    'nur_abholung',
    'status',
    'typ',
  ]

  const rows = listings.map((listing) => [
    listing.id,
    escapeCsvField(listing.title),
    escapeCsvField(listing.description),
    listing.priceCents != null ? (listing.priceCents / 100).toFixed(2) : '',
    listing.minimumPriceCents != null ? (listing.minimumPriceCents / 100).toFixed(2) : '',
    escapeCsvField(listing.category ?? ''),
    escapeCsvField(listing.shippingMode ?? ''),
    listing.pickupOnly ? 'ja' : 'nein',
    listing.status,
    listing.targetType,
  ])

  return [header, ...rows].map((row) => row.join(',')).join('\r\n')
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
