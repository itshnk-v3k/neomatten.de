/*
 * EN: Vehicle / mat-pattern domain models, normalized from the real dataset and
 *     shaped to map onto the future Postgres tables. All enum-like values are
 *     snake_case keys rendered via the translate pipe (DE/EN) — never raw RU/UA.
 *     Brand + model names stay as-is.
 * RU: Доменные модели авто / лекал ковриков, нормализованные из реального набора
 *     и спроектированные под будущие таблицы Postgres. Все enum-значения —
 *     snake_case-ключи, отображаемые через translate (DE/EN), никогда сырой
 *     RU/UA. Названия марок и моделей остаются как есть.
 */
import type { MediaAsset } from './media.model';

/** Normalized body type (→ `body_type_*` translation key). */
export type BodyType =
  | 'sedan'
  | 'suv'
  | 'hatchback'
  | 'crossover'
  | 'minivan'
  | 'wagon'
  | 'coupe'
  | 'liftback'
  | 'pickup'
  | 'cabrio'
  | 'van';

/** Body types in display order (for catalog filters). */
export const BODY_TYPES: readonly BodyType[] = [
  'sedan',
  'suv',
  'crossover',
  'hatchback',
  'wagon',
  'minivan',
  'coupe',
  'liftback',
  'pickup',
  'cabrio',
  'van',
] as const;

/** Heel-pad cut-out variant ("Лапа") → `heel_pad_*`. `none` = no heel pad. */
export type HeelPad = 'none' | 'standard' | '3d';

/** Restyling / facelift generation → `restyling_*` (pre, 1, 2, 3, 6). */
export type Restyling = 'pre' | '1' | '2' | '3' | '6';

/** Mat-kit quality tier → `mat_kit_tier_*`. */
export type MatKitTier = 'premium' | 'standard' | 'economy';

export const MAT_KIT_TIERS: readonly MatKitTier[] = ['premium', 'standard', 'economy'] as const;

/** A single mat piece included in a kit → `mat_kit_piece_*`. */
export type MatKitPiece =
  | 'driver'
  | 'passenger'
  | 'rear_left'
  | 'rear_right'
  | 'bridge'
  | 'trunk'
  | 'second_row'
  | 'third_row'
  | 'first_row';

/** A car brand. `id` is a slug; `name` is the display name (kept as-is). */
export interface Brand {
  readonly id: string;
  readonly name: string;
  /** Distinct models under the brand (derived from the source names). */
  readonly modelCount: number;
  readonly patternCount: number;
  /**
   * Brand logo, admin-managed. Absent in the mock (the grid falls back to
   * BrandLogoComponent initials via MediaService.getBrandLogoUrl).
   * TODO(admin): populate from the media API when logos are uploaded.
   */
  readonly logo?: MediaAsset;
}

/**
 * A normalized mat pattern (lekalo) — the single flat entity behind both the
 * catalog and the configurator, mirroring `vehicle-patterns.json`. `model` and
 * `year*` are derived from the source `name` (no explicit columns exist). All
 * enum-like fields are snake_case keys rendered via the translate pipe (DE/EN);
 * `bodyType`/`heelPad`/`restyling` are null when the source value was missing or
 * un-normalizable. Brand + model names are kept verbatim.
 */
export interface VehiclePattern {
  readonly id: string;
  readonly brandId: string;
  readonly brandName: string;
  /** Derived model name, e.g. "A4 B8", "MDX" (verbatim, not translated). */
  readonly model: string;
  /** Full original vehicle name, e.g. "Audi A4 B8 (2007-2012) Седан IV поколение". */
  readonly name: string;
  readonly bodyType: BodyType | null;
  readonly heelPad: HeelPad | null;
  readonly restyling: Restyling | null;
  /** Article number; always present in the clean dataset. */
  readonly sku: string | null;
  /** Original trim / complectation string (kept for backend fidelity). */
  readonly trim: string | null;
  readonly yearFrom: number | null;
  readonly yearTo: number | null;
  /** Readable range, e.g. "2007–2012" or "2018–…" (open-ended). */
  readonly yearLabel: string | null;
  readonly tiers: readonly MatKitTier[];
  readonly pieces: readonly MatKitPiece[];
  readonly notes: string | null;
  /**
   * Optional admin-managed preview render for this pattern. Absent in the mock
   * (the configurator falls back to the CSS preview / MediaService.getMatPreviewUrl).
   * TODO(admin): populate from the media API when real renders are uploaded.
   */
  readonly previewImage?: MediaAsset;
}
