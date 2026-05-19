import { describe, expect, it } from "vitest";

import { GeneratedListingSchema, type Bundle, type InventoryItem } from "@itemflow/shared";

import { TemplateListingGenerator } from "./template-kleinanzeigen.js";

describe("TemplateListingGenerator", () => {
  it('erzeugt fuer einen Einzelartikel mit Brand einen Titel ab "Bosch"', async () => {
    const generator = new TemplateListingGenerator();

    const result = await generator.generate({
      targetType: "item",
      item: createItem({
        title: "Akkuschrauber mit Ladegeraet",
        category: "Werkzeug",
        brand: "Bosch"
      }),
      platform: "kleinanzeigen",
      suggestedPriceCents: 4500
    });

    expect(generator.platform).toBe("kleinanzeigen");
    expect(result.title.startsWith("Bosch")).toBe(true);
  });

  it("erzeugt fuer einen Einzelartikel ohne Brand einen Titel ab item.title", async () => {
    const generator = new TemplateListingGenerator();
    const item = createItem({
      title: "IKEA Kallax Regal",
      category: "Moebel",
      brand: null
    });

    const result = await generator.generate({
      targetType: "item",
      item,
      platform: "kleinanzeigen",
      suggestedPriceCents: 3500
    });

    expect(result.title.startsWith(item.title)).toBe(true);
  });

  it('nimmt "Hinweise:" in die Beschreibung auf, wenn Defekte vorhanden sind', async () => {
    const generator = new TemplateListingGenerator();

    const result = await generator.generate({
      targetType: "item",
      item: createItem({
        title: "Holzstuhl",
        category: "Moebel",
        defects: "Kratzer an der Sitzflaeche"
      }),
      platform: "kleinanzeigen",
      suggestedPriceCents: 1500
    });

    expect(result.description).toContain("Hinweise:");
  });

  it('erzeugt fuer ein Bundle einen Titel mit "(3 Teile)" und listet alle Items auf', async () => {
    const generator = new TemplateListingGenerator();
    const items = [
      createItem({ id: "item-1", title: "Kinderbuch 1", category: "Buecher" }),
      createItem({ id: "item-2", title: "Kinderbuch 2", category: "Buecher" }),
      createItem({ id: "item-3", title: "Kinderbuch 3", category: "Buecher" })
    ];

    const result = await generator.generate({
      targetType: "bundle",
      bundle: createBundle(items),
      bundleItems: items,
      platform: "kleinanzeigen",
      suggestedPriceCents: 1200
    });

    expect(result.title).toContain("(3 Teile)");
    expect(result.description).toContain("- Kinderbuch 1");
    expect(result.description).toContain("- Kinderbuch 2");
    expect(result.description).toContain("- Kinderbuch 3");
  });

  it("verwendet 500 Cents als Fallback, wenn kein suggestedPriceCents vorhanden ist", async () => {
    const generator = new TemplateListingGenerator();

    const result = await generator.generate({
      targetType: "item",
      item: createItem({
        title: "Kleines Deko-Set",
        category: "Deko"
      }),
      platform: "kleinanzeigen"
    });

    expect(result.priceCents).toBe(500);
  });

  it("liefert eine Ausgabe, die GeneratedListingSchema ohne Fehler validiert", async () => {
    const generator = new TemplateListingGenerator();

    const result = await generator.generate({
      targetType: "item",
      item: createItem({
        title: "Akkuschrauber mit Ladegeraet",
        category: "Werkzeug",
        brand: "Bosch",
        completeness: "Akkuschrauber und Ladegeraet",
        defects: null
      }),
      platform: "kleinanzeigen",
      suggestedPriceCents: 4500,
      minimumPriceCents: 3000
    });

    expect(() => GeneratedListingSchema.parse(result)).not.toThrow();
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
    condition: overrides.condition ?? "gut",
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
    title: "Kinderbuecher Paket",
    itemIds: items.map((item) => item.id),
    rationale: null,
    status: "suggested",
    createdAt: new Date("2026-05-19T00:00:00.000Z")
  };
}
