import { prisma } from '@itemflow/db'
import { UpdateBundleSchema } from '@itemflow/shared'

import { auth } from '@/auth'

type RouteContext = { params: Promise<{ id: string; bid: string }> }

const bundleSelect = {
  id: true,
  title: true,
  itemIds: true,
  rationale: true,
  status: true,
  createdAt: true,
} as const

export async function GET(_request: Request, context: RouteContext) {
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
    select: bundleSelect,
  })

  if (!bundle) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json({ bundle })
}

export async function PATCH(request: Request, context: RouteContext) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = UpdateBundleSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const bundle = await prisma.bundle.findFirst({
    where: { id: bid, projectId },
    select: { id: true, status: true },
  })

  if (!bundle) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (bundle.status !== 'suggested') {
    return Response.json({ error: 'Bundle kann nicht mehr geändert werden.' }, { status: 409 })
  }

  const updated = await prisma.bundle.update({
    where: { id: bundle.id },
    data: { status: parsed.data.status },
    select: bundleSelect,
  })

  return Response.json({ bundle: updated })
}
