/**
 * Catalogue product DTO — the wire contract shared with the NestJS backend and
 * the admin panel. Maps to the Prisma `Product` model. Bilingual display names
 * (DE/EN) are stored separately so the admin panel can edit each language.
 */

/** A single spec row on the product detail page. `labelKey` is a translate key. */
export interface ProductSpec {
  readonly labelKey: string;
  readonly value: string;
}

/** A catalogue product. */
export interface ProductDTO {
  readonly id: string;
  /** URL-safe slug (German), unique per product. */
  readonly slug: string;
  /** Product family / type (e.g. 'mats' | 'cushion' | 'eva_bag' | 'leather_bag'). */
  readonly type: string;
  /** German display name. */
  readonly nameDE: string;
  /** English display name. */
  readonly nameEN: string;
  readonly description?: string;
  readonly specs?: readonly ProductSpec[];
  readonly basePrice: number;
  /** Whether the product is published / orderable. */
  readonly isActive: boolean;
  /** Image URLs for the detail-page carousel (first is the listing thumbnail). */
  readonly images?: readonly string[];
}
