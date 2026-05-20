import { prisma } from '@itemflow/db'
import { CreateProjectSchema } from '@itemflow/shared'

import { auth } from '../../../auth'

const projectSelect = {
  id: true,
  title: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function GET() {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: session.user.userId,
      status: { not: 'deleted' },
    },
    orderBy: { createdAt: 'desc' },
    select: projectSelect,
  })

  return Response.json({ projects })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid input' }, { status: 400 })
  }

  const parsed = CreateProjectSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const project = await prisma.project.create({
    data: {
      userId: session.user.userId,
      title: parsed.data.title ?? generateProjectTitle(),
      description: parsed.data.description ?? null,
    },
    select: projectSelect,
  })

  return Response.json({ project }, { status: 201 })
}

function generateProjectTitle(): string {
  return `Projekt ${new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`
}
