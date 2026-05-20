import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";

import { prisma } from "../src/index.js";

const DEV_USER_EMAIL = "dev@itemflow.local";

type SeedFixtureCandidate = {
  rawLabel: string;
  normalizedName: string;
  category: string;
  confidence: number;
  attributes: Record<string, unknown>;
  bundlePotential: boolean;
  uncertaintyNotes?: string;
};

type SeedFixture = {
  fileName: string;
  candidate: SeedFixtureCandidate;
};

const VISION_SEED_FIXTURES: SeedFixture[] = [
  {
    fileName: "kinderbuch-bundle.jpg",
    candidate: {
      rawLabel: "Kinderbuch Wieso Weshalb Warum Tiere",
      normalizedName: "Kinderbuch Wieso Weshalb Warum Tiere",
      category: "books",
      confidence: 0.85,
      attributes: {
        format: "hardcover",
        audienceAge: "ab 4 Jahren"
      },
      bundlePotential: true
    }
  },
  {
    fileName: "lego-paket.jpg",
    candidate: {
      rawLabel: "LEGO Duplo Steine gemischt",
      normalizedName: "LEGO Duplo Steine Paket",
      category: "toys",
      confidence: 0.88,
      attributes: {
        brand: "LEGO",
        productLine: "Duplo",
        mixedPieces: true
      },
      bundlePotential: true
    }
  },
  {
    fileName: "ikea-regal.jpg",
    candidate: {
      rawLabel: "IKEA Kallax Regal weiss",
      normalizedName: "IKEA Kallax Regal",
      category: "furniture",
      confidence: 0.92,
      attributes: {
        brand: "IKEA",
        color: "weiss",
        compartments: 4
      },
      bundlePotential: false
    }
  },
  {
    fileName: "bosch-akku.jpg",
    candidate: {
      rawLabel: "Bosch Akkuschrauber mit Ladegerät",
      normalizedName: "Bosch Akkuschrauber mit Ladegerät",
      category: "tools",
      confidence: 0.93,
      attributes: {
        brand: "Bosch",
        includedItems: ["Akkuschrauber", "Ladegerät"]
      },
      bundlePotential: false
    }
  },
  {
    fileName: "kabel-chaos.jpg",
    candidate: {
      rawLabel: "Diverse Kabel und Adapter",
      normalizedName: "Kabel und Adapter Paket",
      category: "electronics-accessories",
      confidence: 0.45,
      attributes: {
        mixedTypes: true,
        tangled: true
      },
      bundlePotential: true,
      uncertaintyNotes: "Genauer Kabeltyp unklar"
    }
  },
  {
    fileName: "kindersitz.jpg",
    candidate: {
      rawLabel: "Kinderautositz",
      normalizedName: "Kinderautositz",
      category: "baby-gear",
      confidence: 0.82,
      attributes: {
        installationType: "Isofix oder Gurt",
        color: "schwarz"
      },
      bundlePotential: false,
      uncertaintyNotes: "Sicherheitsrelevantes Produkt — manuelle Prüfung erforderlich"
    }
  }
];

async function main(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: DEV_USER_EMAIL }
  });

  if (existing) {
    console.log("Seed already done.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      email: DEV_USER_EMAIL,
      passwordHash: bcrypt.hashSync("dev-password", 10)
    }
  });

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      title: "Kellerwohnung aufräumen"
    }
  });

  const createdAssets = await Promise.all(
    VISION_SEED_FIXTURES.map(async (fixture) =>
      prisma.asset.create({
        data: {
          projectId: project.id,
          storageKey: fixture.fileName,
          mimeType: "image/jpeg",
          fileName: fixture.fileName,
          sizeBytes: 500000
        }
      })
    )
  );

  const createdCandidates = await Promise.all(
    VISION_SEED_FIXTURES.map(async (fixture, index) => {
      const attributesJson = buildAttributesJson(fixture.candidate);
      const rawModelOutputJson = buildRawModelOutputJson(fixture.candidate);

      return prisma.itemCandidate.create({
        data: {
          projectId: project.id,
          assetId: createdAssets[index].id,
          rawLabel: fixture.candidate.rawLabel,
          normalizedName: fixture.candidate.normalizedName,
          category: fixture.candidate.category,
          attributesJson,
          confidence: fixture.candidate.confidence,
          rawModelOutputJson
        }
      });
    })
  );

  const candidateByFileName = new Map(
    VISION_SEED_FIXTURES.map((fixture, index) => [fixture.fileName, createdCandidates[index]])
  );

  await prisma.inventoryItem.createMany({
    data: [
      {
        projectId: project.id,
        title: "Bosch Akkuschrauber mit Ladegerät",
        category: "tools",
        brand: "Bosch",
        condition: "gut",
        sourceCandidateIds: [candidateByFileName.get("bosch-akku.jpg")!.id],
        status: "ready_for_scoring"
      },
      {
        projectId: project.id,
        title: "IKEA Kallax Regal",
        category: "furniture",
        brand: "IKEA",
        condition: "sehr gut",
        sourceCandidateIds: [candidateByFileName.get("ikea-regal.jpg")!.id],
        status: "ready_for_scoring"
      },
      {
        projectId: project.id,
        title: "Kinderautositz",
        category: "Kindersitz",
        condition: "gut",
        sourceCandidateIds: [candidateByFileName.get("kindersitz.jpg")!.id],
        status: "ready_for_scoring"
      }
    ]
  });

  console.log("Dev seed completed.");
}

function buildAttributesJson(
  candidate: SeedFixtureCandidate
): Prisma.InputJsonValue {
  const attributesJson: Record<string, unknown> = {};

  const brand = candidate.attributes["brand"];

  if (typeof brand === "string") {
    attributesJson.brand = brand;
  }

  if (candidate.bundlePotential) {
    attributesJson.bundlePotential = candidate.bundlePotential;
  }

  return attributesJson as Prisma.InputJsonValue;
}

function buildRawModelOutputJson(
  candidate: SeedFixtureCandidate
): Prisma.InputJsonValue {
  const rawModelOutputJson: Record<string, unknown> = {};

  if (candidate.bundlePotential) {
    rawModelOutputJson.bundlePotential = candidate.bundlePotential;
  }

  if (typeof candidate.uncertaintyNotes === "string") {
    rawModelOutputJson.uncertaintyNotes = candidate.uncertaintyNotes;
  }

  return rawModelOutputJson as Prisma.InputJsonValue;
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
