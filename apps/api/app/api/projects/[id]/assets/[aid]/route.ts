import { prisma } from "@itemflow/db";
import { LocalFileSystemStorageProvider } from "@itemflow/vision";

import { auth } from "@/auth";

type RouteContext = { params: Promise<{ id: string; aid: string }> };

export async function DELETE(_request: Request, context: RouteContext): Promise<Response> {
  const session = await auth();
  if (!session?.user?.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId, aid } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true },
  });
  if (!project || project.status === "deleted") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (project.userId !== session.user.userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const asset = await prisma.asset.findFirst({
    where: { id: aid, projectId },
    select: { id: true, storageKey: true },
  });
  if (!asset) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const storage = new LocalFileSystemStorageProvider();
  await storage.delete(asset.storageKey).catch(() => {
    // File missing should not block DB cleanup.
  });

  await prisma.asset.delete({ where: { id: asset.id } });

  return new Response(null, { status: 204 });
}
