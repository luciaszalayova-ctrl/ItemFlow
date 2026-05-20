import { describe, expect, it } from "vitest";

import { VisionOutputSchema, type VisionCandidateRaw } from "@itemflow/shared";

import { MockVisionProvider } from "./mock-vision.js";

const FIXTURE_IKEA_REGAL: VisionCandidateRaw[] = [
  {
    rawLabel: "IKEA Kallax Regal weiss",
    normalizedName: "IKEA Kallax Regal",
    category: "furniture",
    attributes: { brand: "IKEA", color: "weiss", compartments: 4 },
    confidence: 0.92,
    bundlePotential: false
  }
];

const FIXTURE_KABEL_CHAOS: VisionCandidateRaw[] = [
  {
    rawLabel: "Diverse Kabel und Adapter",
    normalizedName: "Kabel und Adapter Paket",
    category: "electronics-accessories",
    attributes: { mixedTypes: true, tangled: true },
    confidence: 0.45,
    bundlePotential: true,
    uncertaintyNotes: "Genauer Kabeltyp unklar"
  }
];

describe("MockVisionProvider", () => {
  it("gibt füreinen bekannten Key konfigurierte Candidates zurück", async () => {
    const provider = new MockVisionProvider(
      new Map<string, VisionCandidateRaw[]>([["ikea-regal", FIXTURE_IKEA_REGAL]])
    );

    const result = await provider.analyze({
      assetId: "asset-known",
      projectId: "project-1",
      imageUrl: "ikea-regal"
    });

    expect(result.candidates).toEqual(FIXTURE_IKEA_REGAL);
  });

  it("gibt füreinen unbekannten Key defaultCandidates zurück", async () => {
    const provider = new MockVisionProvider(
      new Map<string, VisionCandidateRaw[]>(),
      FIXTURE_KABEL_CHAOS
    );

    const result = await provider.analyze({
      assetId: "asset-default",
      projectId: "project-1",
      imageUrl: "unknown-key"
    });

    expect(result.candidates).toEqual(FIXTURE_KABEL_CHAOS);
  });

  it("gibt bei leeren defaultCandidates ein leeres Array zurück", async () => {
    const provider = new MockVisionProvider(new Map<string, VisionCandidateRaw[]>());

    const result = await provider.analyze({
      assetId: "asset-empty",
      projectId: "project-1",
      imageUrl: "missing"
    });

    expect(result.candidates).toEqual([]);
  });

  it("liefert einen Rückgabewert, der die VisionOutputSchema-Validierung besteht", async () => {
    const provider = new MockVisionProvider(
      new Map<string, VisionCandidateRaw[]>([["ikea-regal", FIXTURE_IKEA_REGAL]])
    );

    const result = await provider.analyze({
      assetId: "asset-schema",
      projectId: "project-1",
      imageUrl: "ikea-regal"
    });

    expect(() => VisionOutputSchema.parse({ candidates: result.candidates })).not.toThrow();
  });

  it("reicht die assetId aus dem Input korrekt durch", async () => {
    const provider = new MockVisionProvider(
      new Map<string, VisionCandidateRaw[]>([["ikea-regal", FIXTURE_IKEA_REGAL]])
    );

    const result = await provider.analyze({
      assetId: "asset-forwarded",
      projectId: "project-1",
      imageUrl: "ikea-regal"
    });

    expect(result.assetId).toBe("asset-forwarded");
  });
});
