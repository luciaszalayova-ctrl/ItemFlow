import type { InventoryItem, Bundle, GeneratedListing, SupportedPlatform } from '@itemflow/shared'
import { GeneratedListingSchema } from '@itemflow/shared'

export interface ListingGeneratorInput {
  targetType: 'item' | 'bundle'
  item?: InventoryItem
  bundle?: Bundle
  /** Items included in the bundle (required when targetType is "bundle") */
  bundleItems?: InventoryItem[]
  platform: SupportedPlatform
  /** ISO 639-1 language code — defaults to "de" */
  language?: string
  /** Suggested price from scoring (cents) */
  suggestedPriceCents?: number
  /** Minimum acceptable price from scoring (cents) */
  minimumPriceCents?: number
}

export interface ListingGenerator {
  readonly platform: SupportedPlatform
  generate(input: ListingGeneratorInput): Promise<GeneratedListing>
}

export async function generateListingDraft(input: {
  title: string
  description: string
  condition: string
  category: string
}): Promise<GeneratedListing> {
  return GeneratedListingSchema.parse({
    title: input.title,
    description: `Verkaufe ${input.title}.\nZustand: ${input.condition}.\n${input.description}`.trim(),
    priceCents: 500,
    category: input.category,
    shippingMode: 'Abholung bevorzugt, Versand auf Anfrage möglich.',
    pickupOnly: true,
  })
}

export type { InventoryItem, Bundle, GeneratedListing, SupportedPlatform }
export { GeneratedListingSchema, SupportedPlatformSchema } from '@itemflow/shared'
export { TemplateListingGenerator } from './generators/template-kleinanzeigen.js'
