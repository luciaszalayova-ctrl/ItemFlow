import { basename, extname } from "node:path";

import { type Prisma, prisma } from "@itemflow/db";
import { ACCEPTED_IMAGE_TYPES, MAX_ASSET_SIZE_BYTES } from "@itemflow/shared";
import { FIXTURE_MAP } from "@itemflow/testing";
import { LocalFileSystemStorageProvider, MockVisionProvider } from "@itemflow/vision";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true, status: true },
  });
  if (!project || project.status === "deleted") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (project.userId !== session.user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assets = await prisma.asset.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    select: { id: true, fileName: true, sizeBytes: true, createdAt: true },
  });

  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await auth();
  if (!session?.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: projectId } = await context.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.userId !== session.user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid multipart request" }, { status: 400 });
  }

  const fileField = formData.get("file");
  if (!(fileField instanceof File)) {
    return NextResponse.json({ error: "Missing or invalid file field" }, { status: 400 });
  }

  const mimeType = fileField.type;
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(mimeType)) {
    return NextResponse.json({ error: `Unsupported file type: ${mimeType}` }, { status: 400 });
  }

  const buffer = Buffer.from(await fileField.arrayBuffer());
  if (buffer.length > MAX_ASSET_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds maximum allowed size" }, { status: 413 });
  }

  const originalFileName = fileField.name;
  const storageKey = `${projectId}/${Date.now()}-${originalFileName}`;

  const storage = new LocalFileSystemStorageProvider();
  const uploadResult = await storage.upload({
    key: storageKey,
    buffer,
    mimeType,
    fileName: originalFileName,
    sizeBytes: buffer.length,
  });

  const fixtureKey = basename(originalFileName, extname(originalFileName));
  const vision = new MockVisionProvider(FIXTURE_MAP, []);
  const visionResult = await vision.analyze({
    assetId: "pending",
    projectId,
    imageUrl: fixtureKey,
  });

  const asset = await prisma.asset.create({
    data: {
      projectId,
      storageKey: uploadResult.key,
      mimeType,
      fileName: originalFileName,
      sizeBytes: uploadResult.sizeBytes,
    },
  });

  const createdCandidates = await prisma.$transaction(
    visionResult.candidates.map((c) =>
      prisma.itemCandidate.create({
        data: {
          projectId,
          assetId: asset.id,
          rawLabel: c.rawLabel,
          normalizedName: c.normalizedName,
          category: c.category,
          attributesJson: (c.attributes ?? {}) as Prisma.InputJsonValue,
          confidence: c.confidence,
          rawModelOutputJson: {
            bundlePotential: c.bundlePotential,
            uncertaintyNotes: c.uncertaintyNotes,
          },
        },
      })
    )
  );

  return NextResponse.json({
    assetId: asset.id,
    asset: {
      id: asset.id,
      fileName: asset.fileName,
      sizeBytes: asset.sizeBytes,
      createdAt: asset.createdAt,
    },
    candidateCount: createdCandidates.length,
    candidates: createdCandidates.map((c) => {
      const raw = c.rawModelOutputJson as {
        bundlePotential?: boolean;
        uncertaintyNotes?: string;
      };
      return {
        id: c.id,
        rawLabel: c.rawLabel,
        normalizedName: c.normalizedName,
        category: c.category,
        confidence: c.confidence,
        bundlePotential: raw.bundlePotential ?? false,
        ...(raw.uncertaintyNotes !== undefined && { uncertaintyNotes: raw.uncertaintyNotes }),
      };
    }),
  });
}
