import { prisma } from '@itemflow/db'
import { CandidateStatusSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string }> }

const candidateSelect = {
  id: true,
  assetId: true,
  rawLabel: true,
  normalizedName: true,
  category: true,
  attributesJson: true,
  confidence: true,
  rawModelOutputJson: true,
  status: true,
  createdAt: true,
} as const

export async function GET(request: Request, context: RouteContext) {
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

  const { searchParams } = new URL(request.url)
  const rawStatusFilter = searchParams.get('status')

  let statusFilter: ReturnType<typeof CandidateStatusSchema.parse> | undefined
  if (rawStatusFilter !== null) {
    const parsedStatus = CandidateStatusSchema.safeParse(rawStatusFilter)
    if (!parsedStatus.success) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    statusFilter = parsedStatus.data
  }

  const candidates = await prisma.itemCandidate.findMany({
    where: {
      projectId,
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    orderBy: { createdAt: 'asc' },
    select: candidateSelect,
  })

  return Response.json({ candidates })
}
