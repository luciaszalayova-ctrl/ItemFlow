import { describe, expect, it } from "vitest";

import type { Bundle, InventoryItem } from "@itemflow/shared";

import { RuleBasedScoringEngine } from "./rule-based.js";

describe("RuleBasedScoringEngine", () => {
  it('bewertet Bosch Akkuschrauber in Zustand "gut" als sell_individually', () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "Bosch Akkuschrauber",
        category: "Werkzeug",
        brand: "Bosch",
        condition: "gut",
        defects: null
      })
    });

    expect(result.action).toBe("sell_individually");
    expect(["high", "medium"]).toContain(result.confidence);
  });

  it('bewertet 3 Kinderbücher in Zustand "gut" als bundle', () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "3 Kinderbücher",
        category: "Bücher",
        brand: null,
        condition: "gut",
        quantity: 3,
        defects: null
      })
    });

    expect(result.action).toBe("bundle");
  });

  it("bewertet ein defektes Gerät mit defects als recycle_dispose", () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "Defekter Beistelltisch",
        category: "Moebel",
        brand: "Sony",
        condition: "defekt",
        defects: "stark gebrochen"
      })
    });

    expect(result.action).toBe("recycle_dispose");
  });

  it("markiert einen Kindersitz als needs_review und sensible Kategorie", () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "Kinderautositz",
        category: "Kindersitz",
        brand: null,
        condition: "gut",
        defects: null
      })
    });

    expect(result.action).toBe("needs_review");
    expect(result.isSensitiveCategory).toBe(true);
  });

  it("bewertet Kabel-Durcheinander als bundle oder give_away", () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "Kabel-Durcheinander",
        category: "Kabel",
        brand: null,
        condition: "akzeptabel",
        quantity: 4,
        defects: null
      })
    });

    expect(["bundle", "give_away"]).toContain(result.action);
    expect(result.expectedPriceCents).toBeLessThan(1000);
  });

  it("respektiert einen Threshold-Override fürsellMinScore", () => {
    const engine = new RuleBasedScoringEngine();

    const result = engine.scoreItem({
      item: createItem({
        title: "Bosch Akkuschrauber",
        category: "Werkzeug",
        brand: "Bosch",
        condition: "gut",
        defects: null
      }),
      thresholds: {
        sellMinScore: 99
      }
    });

    expect(result.action).not.toBe("sell_individually");
  });

  it("scoreBundle() bewertet 3 Kinderbücher als bundle", () => {
    const engine = new RuleBasedScoringEngine();
    const items = [
      createItem({
        id: "book-1",
        title: "Kinderbuch 1",
        category: "Bücher",
        quantity: 1,
        condition: "gut",
        defects: null
      }),
      createItem({
        id: "book-2",
        title: "Kinderbuch 2",
        category: "Bücher",
        quantity: 1,
        condition: "gut",
        defects: null
      }),
      createItem({
        id: "book-3",
        title: "Kinderbuch 3",
        category: "Bücher",
        quantity: 1,
        condition: "gut",
        defects: null
      })
    ];

    const result = engine.scoreBundle({
      bundle: createBundle(items),
      items
    });

    expect(result.action).toBe("bundle");
  });
});

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  const now = new Date("2026-05-19T00:00:00.000Z");

  return {
    id: overrides.id ?? "item-1",
    projectId: overrides.projectId ?? "project-1",
    title: overrides.title ?? "Test Item",
    category: overrides.category ?? "Sonstiges",
    brand: overrides.brand ?? null,
    model: overrides.model ?? null,
    condition: overrides.condition ?? null,
    quantity: overrides.quantity ?? 1,
    description: overrides.description ?? null,
    defects: overrides.defects ?? null,
    completeness: overrides.completeness ?? null,
    sourceCandidateIds: overrides.sourceCandidateIds ?? [],
    status: overrides.status ?? "ready_for_scoring",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now
  };
}

function createBundle(items: InventoryItem[]): Bundle {
  return {
    id: "bundle-1",
    projectId: "project-1",
    title: "Kinderbücher Paket",
    itemIds: items.map((item) => item.id),
    rationale: null,
    status: "suggested",
    createdAt: new Date("2026-05-19T00:00:00.000Z")
  };
}
