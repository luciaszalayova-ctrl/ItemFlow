import { VisionOutputSchema, type VisionCandidateRaw } from "@itemflow/shared";

import type {
  VisionAnalysisInput,
  VisionAnalysisResult,
  VisionProvider
} from "../index.js";

export class MockVisionProvider implements VisionProvider {
  readonly name = "mock";

  constructor(
    private readonly fixtures: Map<string, VisionCandidateRaw[]>,
    private readonly defaultCandidates: VisionCandidateRaw[] = []
  ) {}

  async analyze(input: VisionAnalysisInput): Promise<VisionAnalysisResult> {
    const candidates = this.fixtures.get(input.imageUrl) ?? this.defaultCandidates;

    VisionOutputSchema.parse({ candidates });

    return {
      assetId: input.assetId,
      candidates,
      rawOutput: { provider: "mock", imageUrl: input.imageUrl }
    };
  }
}
