import { GeneratedListingSchema, type GeneratedListing } from "@itemflow/shared";

import type {
  Bundle,
  InventoryItem,
  ListingGenerator,
  ListingGeneratorInput,
  SupportedPlatform
} from "../index.js";

const KLEINANZEIGEN_SHIPPING_MODE = "Abholung bevorzugt, Versand auf Anfrage möglich.";
const KLEINANZEIGEN_DISCLAIMER = "Privatverkauf, keine Garantie oder Rücknahme.";
const ITEM_PHOTO_RECOMMENDATIONS = ["Frontansicht", "Zustandsdetail"];
const BUNDLE_PHOTO_RECOMMENDATIONS = ["Alle Teile gemeinsam", "Einzelne Highlights"];

export class TemplateListingGenerator implements ListingGenerator {
  readonly platform: SupportedPlatform = "kleinanzeigen";

  async generate(input: ListingGeneratorInput): Promise<GeneratedListing> {
    if (input.platform !== "kleinanzeigen") {
      throw new Error(`Unsupported platform "${input.platform}" for TemplateListingGenerator.`);
    }

    const listing =
      input.targetType === "bundle"
        ? this.generateBundle(input)
        : this.generateItem(input);

    return GeneratedListingSchema.parse(listing);
  }

  private generateItem(input: ListingGeneratorInput): GeneratedListing {
    if (input.item === undefined) {
      throw new Error('ListingGeneratorInput.item is required when targetType is "item".');
    }

    const item = input.item;
    const title = truncateTitle(buildItemTitle(item));
    const priceCents = input.suggestedPriceCents ?? 500;
    const minimumPriceCents = input.minimumPriceCents;

    return compactListing({
      title,
      description: buildItemDescription(item, minimumPriceCents),
      priceCents,
      minimumPriceCents,
      category: item.category,
      shippingMode: KLEINANZEIGEN_SHIPPING_MODE,
      pickupOnly: true,
      negotiationNotes:
        minimumPriceCents !== undefined && minimumPriceCents < priceCents
          ? "Preis ist verhandelbar."
          : undefined,
      photoRecommendations: ITEM_PHOTO_RECOMMENDATIONS
    });
  }

  private generateBundle(input: ListingGeneratorInput): GeneratedListing {
    if (input.bundle === undefined || input.bundleItems === undefined) {
      throw new Error(
        'ListingGeneratorInput.bundle and bundleItems are required when targetType is "bundle".'
      );
    }

    const bundle = input.bundle;
    const items = input.bundleItems;
    const category = mostCommonCategory(items);
    const title = truncateTitle(`${category} Paket (${items.length} Teile)`);
    const priceCents = input.suggestedPriceCents ?? 500;
    const minimumPriceCents = input.minimumPriceCents;

    return compactListing({
      title,
      description: buildBundleDescription(bundle, items, minimumPriceCents),
      priceCents,
      minimumPriceCents,
      category,
      shippingMode: KLEINANZEIGEN_SHIPPING_MODE,
      pickupOnly: true,
      negotiationNotes:
        minimumPriceCents !== undefined && minimumPriceCents < priceCents
          ? "Preis ist verhandelbar."
          : undefined,
      photoRecommendations: BUNDLE_PHOTO_RECOMMENDATIONS
    });
  }
}

function buildItemTitle(item: InventoryItem): string {
  const titleParts: string[] = [];
  const normalizedTitle = item.title.trim();

  if (item.brand !== null) {
    const normalizedBrand = item.brand.trim();

    if (
      normalizedBrand.length > 0 &&
      !normalizedTitle.toLowerCase().startsWith(normalizedBrand.toLowerCase())
    ) {
      titleParts.push(normalizedBrand);
    }
  }

  titleParts.push(normalizedTitle);

  if (
    item.model !== null &&
    item.model.trim().length > 0 &&
    !normalizedTitle.toLowerCase().includes(item.model.trim().toLowerCase())
  ) {
    titleParts.push(item.model.trim());
  }

  return titleParts.join(" ");
}

function buildItemDescription(
  item: InventoryItem,
  minimumPriceCents: number | undefined
): string {
  const lines = [
    `Verkaufe ${item.title}.`,
    `Zustand: ${item.condition ?? "Zustand nicht angegeben"}.`
  ];

  if (item.completeness !== null) {
    lines.push(`Enthalten: ${item.completeness}.`);
  }

  if (item.defects !== null) {
    lines.push(`Hinweise: ${item.defects}.`);
  }

  lines.push(KLEINANZEIGEN_SHIPPING_MODE);
  lines.push(KLEINANZEIGEN_DISCLAIMER);

  if (minimumPriceCents !== undefined) {
    lines.push(`Mindestpreis: ${formatEuro(minimumPriceCents)}.`);
  }

  return lines.join("\n");
}

function buildBundleDescription(
  bundle: Bundle,
  items: InventoryItem[],
  minimumPriceCents: number | undefined
): string {
  const category = mostCommonCategory(items);
  const lines = [
    `Verkaufe ${items.length} ${category}-Artikel als Paket.`,
    "Zustand: Zustand nicht angegeben.",
    "Enthalten:"
  ];

  for (const item of items) {
    lines.push(`- ${item.title}`);
  }

  lines.push(KLEINANZEIGEN_SHIPPING_MODE);
  lines.push(KLEINANZEIGEN_DISCLAIMER);

  if (minimumPriceCents !== undefined) {
    lines.push(`Mindestpreis: ${formatEuro(minimumPriceCents)}.`);
  }

  return lines.join("\n");
}

function mostCommonCategory(items: InventoryItem[]): string {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  }

  let bestCategory = items[0]?.category ?? "Paket";
  let bestCount = counts.get(bestCategory) ?? 0;

  for (const [category, count] of counts.entries()) {
    if (count > bestCount) {
      bestCategory = category;
      bestCount = count;
    }
  }

  return bestCategory;
}

function truncateTitle(title: string): string {
  if (title.length <= 80) {
    return title;
  }

  const truncated = title.slice(0, 79);
  const lastSpaceIndex = truncated.lastIndexOf(" ");

  if (lastSpaceIndex <= 0) {
    return `${truncated.slice(0, 78)}…`;
  }

  return `${truncated.slice(0, lastSpaceIndex)}…`;
}

function formatEuro(cents: number): string {
  return `${(cents / 100).toFixed(2)} €`;
}

function compactListing(listing: GeneratedListing): GeneratedListing {
  return Object.fromEntries(
    Object.entries(listing).filter(([, value]) => value !== undefined)
  ) as GeneratedListing;
}
