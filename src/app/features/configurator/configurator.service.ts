/*
 * EN: Configurator domain service. Holds the static option tables (textures,
 *     per-texture colour palettes, edge palette, refine-spec dropdown options,
 *     kit zones + presets) and the MOCK pricing model. Pricing is a pure
 *     function of the chosen configuration so the page can expose it as a
 *     computed signal that updates reactively. It also builds the OrderItemDTO /
 *     CartItem for a finished configuration. Swap the mock price table for
 *     backend-driven pricing later — the call sites stay the same.
 * RU: Доменный сервис конфигуратора. Хранит статичные таблицы опций (фактуры,
 *     палитры цветов по фактуре, палитра канта, опции уточняющих списков, зоны
 *     набора + пресеты) и МОК-модель цен. Цена — чистая функция выбранной
 *     конфигурации, поэтому страница отдаёт её реактивным computed-сигналом. Также
 *     строит OrderItemDTO / CartItem для готовой конфигурации. Позже мок-таблицу
 *     цен заменит расчёт с бэкенда — вызовы не изменятся.
 */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { PRICING } from '@core/config/pricing.config';
import type { Language } from '@core/i18n/language.model';
import type { CartItem } from '@core/models/cart-item.model';
import type { MatColour, MatColoursData, TextureColours } from '@core/models/mat-colour.model';
import type { OrderItemDTO } from '@core/models/order.model';
import type { VehiclePattern } from '@core/models/vehicle.model';
import type { SelectOption } from '@shared/models/select-option.model';
import { round2 } from '@shared/utils/money.util';

export type Texture = 'rhombus' | 'honeycomb' | 'drop';
export type MaterialType = 'eva' | 'ecoskin';
/** Mounting (step 07). `3d` is Coming Soon / disabled — selection stays `none`. */
export type Mounting = 'none' | '3d';
/**
 * Heel-pad ("Лапа"/Ferse) option in step 08. Availability is driven by the
 * selected pattern's `heelPad` field: `none` → only `none`; `standard` → `none` +
 * `standard`; `3d` → all three. Order is always Without → Standard → 3D.
 */
export type HeelPadAccessory = 'none' | 'standard' | '3d';
/** Heel-rest pad accessory (step 09) — a paid add-on, independent of the dataset. */
export type HeelRest = 'none' | 'metal' | 'rubber';

/**
 * A rubber heel-rest colour (step 09): the id stored in state/order, its webp
 * filename under `heel-rest-pad/heel-rest-rubber/`, an i18n label key and a CSS
 * background for the picker swatch.
 */
export interface HeelRestColour {
  readonly id: string;
  readonly file: string;
  readonly labelKey: string;
  readonly swatch: string;
}

/** Root path for the heel-rest overlay assets (2077×2077, aligned to mat-clips). */
const HEEL_REST_ASSET_BASE = 'assets/images/heel-rest-pad';

/** Rubber colour choices shown below the option cards when Rubber is selected. */
export const HEEL_REST_RUBBER_COLOURS: readonly HeelRestColour[] = [
  { id: 'brown', file: 'brown.webp', labelKey: 'heel_rest_rubber_brown', swatch: '#6b4423' },
  {
    id: 'black-red',
    file: 'black-with-red.webp',
    labelKey: 'heel_rest_rubber_black_red',
    swatch: 'linear-gradient(135deg, #1a1a1a 0 50%, #c81e1e 50% 100%)',
  },
  { id: 'grey', file: 'grey.webp', labelKey: 'heel_rest_rubber_grey', swatch: '#9ca3af' },
  {
    id: 'black-grey',
    file: 'black-grey.webp',
    labelKey: 'heel_rest_rubber_black_grey',
    swatch: 'linear-gradient(135deg, #1a1a1a 0 50%, #6b7280 50% 100%)',
  },
  { id: 'black', file: 'black.webp', labelKey: 'heel_rest_rubber_black', swatch: '#1a1a1a' },
];
export type Accessories = 'with_clips' | 'without_clips';
/** Clickable car-diagram zones = step-07 kit pieces. */
export type CarZone = 'front_left' | 'front_right' | 'rear_left' | 'rear_right' | 'trunk';
/** Multi-zone shortcuts in step 07. */
export type KitPreset = 'front_row' | 'rear_row' | 'full_interior' | 'premium';

export const CAR_ZONES: readonly CarZone[] = [
  'front_left',
  'front_right',
  'rear_left',
  'rear_right',
  'trunk',
] as const;

/** Floor zones (everything except the trunk) — used for the pricing tier. */
export const FLOOR_ZONES: readonly CarZone[] = [
  'front_left',
  'front_right',
  'rear_left',
  'rear_right',
] as const;

// TODO(admin): texture options below are static placeholders. They should become
// admin-managed catalogue data (e.g. `GET /api/configurator/options`) with swatch
// images via MediaService. Mat colours are now per-texture and edge colours a flat
// palette, both loaded at runtime from mock JSON (see ConfiguratorService
// .textureColours / .edgeColours) and will move to `GET /api/settings/colours`.
export const TEXTURES: readonly Texture[] = ['rhombus', 'honeycomb', 'drop'] as const;

/** Localized display name for a colour (German name when DE, English otherwise). */
export function colourName(colour: MatColour, lang: Language): string {
  return lang === 'de' ? colour.name_de : colour.name_en;
}

// --- mock pricing -----------------------------------------------------------
// All prices (tier base prices, add-on prices and shipping tiers) come from the
// injected `PRICING` config — a single source of truth shared with the cart and
// checkout. TODO(admin)/TODO(backend): provide `PRICING` from a settings API
// (e.g. `POST /api/configurator/price`); the call sites stay the same.

/** The full configuration state used by pricing + builders. */
export interface ConfigState {
  readonly material: MaterialType;
  readonly texture: Texture;
  readonly materialColor: string;
  readonly edgeColor: string;
  readonly zones: ReadonlySet<CarZone>;
  readonly accessories: Accessories;
  readonly mounting: Mounting;
  readonly heelPad: HeelPadAccessory;
  readonly heelRest: HeelRest;
  /** Selected rubber colour id (step 09); null unless heelRest === 'rubber'. */
  readonly heelRestColour: string | null;
  // Step-02 refine spec — optional/informational (don't affect pricing).
  readonly transmission: string | null;
  readonly year: number | null;
  readonly drive: string | null;
  readonly engine: string | null;
}

export type PricingTier = 'economy' | 'standard' | 'premium';

@Injectable({ providedIn: 'root' })
export class ConfiguratorService {
  private readonly http = inject(HttpClient);
  private readonly pricing = inject(PRICING);

  private readonly loadingSignal = signal(true);
  /** True while configurator data initializes; flips false once colours load. */
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Per-texture mat (fill) colour tables, loaded at runtime (supplier data v2 —
   * colours differ per texture). Empty until the load resolves.
   */
  readonly textureColours = signal<TextureColours[]>([]);
  /** Edge (border) colour palette, loaded at runtime. Empty until the load resolves. */
  readonly edgeColours = signal<MatColour[]>([]);

  /** Every mat colour across all textures, de-duplicated by id (name/hex lookups). */
  private readonly allMatColours = computed(() => {
    const byId = new Map<string, MatColour>();
    for (const t of this.textureColours()) {
      for (const c of t.colours) if (!byId.has(c.id)) byId.set(c.id, c);
    }
    return [...byId.values()];
  });

  constructor() {
    // TODO(backend): GET /api/settings/colours
    this.http.get<MatColoursData>('assets/data/mat-colours.json').subscribe({
      next: data => {
        this.textureColours.set(data.textures ?? []);
        this.edgeColours.set(data.edge_colours ?? []);
        this.loadingSignal.set(false);
      },
      // Don't strand the page on the skeleton if the palette fails to load.
      error: () => this.loadingSignal.set(false),
    });
  }

  /**
   * Mat (fill) colours available for a texture. When `size210` is true, restricts
   * to the subset offered in the larger 210x140 size (`size_210x140_colours`).
   */
  matColoursFor(texture: string, size210 = false): MatColour[] {
    const entry = this.textureColours().find(t => t.id === texture);
    if (!entry) return [];
    if (!size210) return entry.colours;
    const allowed = new Set(entry.size_210x140_colours);
    return entry.colours.filter(c => allowed.has(c.id));
  }

  /** Sizes a texture is produced in, e.g. ["200x120", "210x140"]. */
  sizesFor(texture: string): string[] {
    return this.textureColours().find(t => t.id === texture)?.sizes ?? [];
  }

  /** Localized name for a stored mat-colour id (falls back to the id itself). */
  matColourName(id: string, lang: Language): string {
    const colour = this.allMatColours().find(c => c.id === id);
    return colour ? colourName(colour, lang) : id;
  }

  /** Localized name for a stored edge-colour id (falls back to the id itself). */
  edgeColourName(id: string, lang: Language): string {
    const colour = this.edgeColours().find(c => c.id === id);
    return colour ? colourName(colour, lang) : id;
  }

  /** Hex for a stored mat-colour id (for cart/order swatches); '' if unknown. */
  matColourHex(id: string): string {
    return this.allMatColours().find(c => c.id === id)?.hex ?? '';
  }

  /** Hex for a stored edge-colour id (for cart/order swatches); '' if unknown. */
  edgeColourHex(id: string): string {
    return this.edgeColours().find(c => c.id === id)?.hex ?? '';
  }

  // Static refine-spec options (step 02). Informational only — they don't filter
  // patterns or affect pricing; they ride along into the OrderItemDTO for the
  // admin. `label` is an i18n key (rendered via the translate pipe in the pills).
  readonly transmissionOptions: SelectOption[] = [
    { value: 'automatic', label: 'refine_transmission_automatic' },
    { value: 'manual', label: 'refine_transmission_manual' },
    { value: 'robot', label: 'refine_transmission_robot' },
  ];
  readonly driveOptions: SelectOption[] = [
    { value: 'rear', label: 'refine_drive_rear' },
    { value: 'front', label: 'refine_drive_front' },
    { value: 'all', label: 'refine_drive_all' },
  ];
  readonly engineOptions: SelectOption[] = [
    { value: 'petrol', label: 'refine_engine_petrol' },
    { value: 'diesel', label: 'refine_engine_diesel' },
    { value: 'petrol-gas', label: 'refine_engine_petrol_gas' },
    { value: 'gas', label: 'refine_engine_gas' },
    { value: 'electric', label: 'refine_engine_electric' },
    { value: 'hybrid', label: 'refine_engine_hybrid' },
    { value: 'unknown', label: 'refine_engine_unknown' },
  ];

  /** Zones selected by a step-07 preset shortcut. */
  presetZones(preset: KitPreset): CarZone[] {
    switch (preset) {
      case 'front_row':
        return ['front_left', 'front_right'];
      case 'rear_row':
        return ['rear_left', 'rear_right'];
      case 'full_interior':
        return ['front_left', 'front_right', 'rear_left', 'rear_right'];
      case 'premium':
        return ['front_left', 'front_right', 'rear_left', 'rear_right', 'trunk'];
    }
  }

  /** Pricing tier implied by the kit selection. */
  tierFor(zones: ReadonlySet<CarZone>): PricingTier {
    if (zones.has('trunk')) return 'premium';
    const floors = FLOOR_ZONES.filter(z => zones.has(z)).length;
    return floors >= 4 ? 'standard' : 'economy';
  }

  /** Heel-pad (step 08) upgrade price for the chosen option, in EUR. */
  heelPadPrice(heelPad: HeelPadAccessory): number {
    if (heelPad === 'standard') return this.pricing.heelPad.standard;
    if (heelPad === '3d') return this.pricing.heelPad.threeD;
    return 0;
  }

  /** Heel-rest pad (step 09) accessory price for the chosen option, in EUR. */
  heelRestPrice(heelRest: HeelRest): number {
    if (heelRest === 'metal') return this.pricing.heelRest.metal;
    if (heelRest === 'rubber') return this.pricing.heelRest.rubber;
    return 0;
  }

  /** Rubber colour id chosen by default when Rubber is first selected. */
  readonly defaultHeelRestColour = HEEL_REST_RUBBER_COLOURS[0].id;

  /** Rubber colour record for an id (null when unknown / not a rubber colour). */
  heelRestColour(id: string | null): HeelRestColour | null {
    return HEEL_REST_RUBBER_COLOURS.find(c => c.id === id) ?? null;
  }

  /** i18n label key for a rubber colour id (null when none). */
  heelRestColourLabelKey(id: string | null): string | null {
    return this.heelRestColour(id)?.labelKey ?? null;
  }

  /**
   * Heel-rest overlay image to composite on the mat preview (above the clips
   * layer, no tint/blend), or null when no heel rest is selected. Metal is a
   * single image; rubber resolves to the selected colour's webp.
   */
  heelRestOverlaySrc(heelRest: HeelRest, colourId: string | null): string | null {
    if (heelRest === 'metal') {
      return `${HEEL_REST_ASSET_BASE}/heel-rest-metal/metal.webp`;
    }
    if (heelRest === 'rubber') {
      const colour = this.heelRestColour(colourId) ?? HEEL_REST_RUBBER_COLOURS[0];
      return `${HEEL_REST_ASSET_BASE}/heel-rest-rubber/${colour.file}`;
    }
    return null;
  }

  /** Mock configured-mat price (before shipping/discount), in EUR. */
  price(state: ConfigState): number {
    const floors = FLOOR_ZONES.filter(z => state.zones.has(z)).length;
    if (floors === 0 && !state.zones.has('trunk')) return 0;
    const tier = this.tierFor(state.zones);
    const extras = Math.max(0, floors - 2); // beyond the front pair
    // Mounting (3D) is Coming Soon — not charged. Heel-pad + heel-rest are add-ons.
    const total =
      this.pricing.tierBasePrices[tier] +
      extras * this.pricing.extraMatPrice +
      this.heelPadPrice(state.heelPad) +
      this.heelRestPrice(state.heelRest);
    return round2(total);
  }

  /** Delivery-tier i18n key implied by the kit (mirrors `shipping()` thresholds). */
  deliveryTierKey(zones: ReadonlySet<CarZone>): string {
    const floors = FLOOR_ZONES.filter(z => zones.has(z)).length;
    if (zones.has('trunk')) return 'configurator_delivery_premium';
    if (floors >= 3) return 'configurator_delivery_full';
    if (floors === 2) return 'configurator_delivery_pair';
    return 'configurator_delivery_single';
  }

  /** Shipping cost for the kit (EUR). Free for full interior / premium sets. */
  shipping(zones: ReadonlySet<CarZone>): number {
    const floors = FLOOR_ZONES.filter(z => zones.has(z)).length;
    if (zones.has('trunk')) return 0; // premium set → free to Germany
    if (floors >= 4) return 0; // full interior → free to Germany
    const tiers = this.pricing.shipping;
    if (floors <= 1) return tiers.single;
    if (floors === 2) return tiers.pair;
    return tiers.full;
  }

  /** Builds the cart line for a finished configuration. `id` must be unique. */
  toCartItem(id: string, pattern: VehiclePattern, state: ConfigState): CartItem {
    return { id, ...this.toOrderItem(pattern, state) };
  }

  /** Builds the order item (sans line id) for a finished configuration. */
  toOrderItem(pattern: VehiclePattern, state: ConfigState): OrderItemDTO {
    return {
      sku: pattern.sku,
      orderItemSku: orderItemSku(pattern),
      category: 'mats',
      name: `${pattern.brandName} ${pattern.model}`,
      brand: pattern.brandName,
      model: pattern.model,
      yearRange: pattern.yearLabel ?? undefined,
      tier: this.tierFor(state.zones),
      kitPieces: CAR_ZONES.filter(z => state.zones.has(z)),
      material: state.material,
      texture: state.texture,
      materialColour: state.materialColor,
      edgeColour: state.edgeColor,
      heelPad: state.heelPad,
      heelRest: state.heelRest,
      heelRestColour: state.heelRestColour ?? undefined,
      mounting: state.mounting,
      accessories: state.accessories,
      // Step-02 refine spec (informational, for the admin fulfilling the order).
      transmission: state.transmission ?? undefined,
      yearOfManufacture: state.year ?? undefined,
      drive: state.drive ?? undefined,
      engine: state.engine ?? undefined,
      quantity: 1,
      unitPrice: this.price(state),
    };
  }
}

/**
 * Unique per-line article number for a configured (custom) order:
 * `NM-{BRAND_CODE}-{PATTERN_SKU}-{TIMESTAMP_BASE36}` (e.g. "NM-BMW-BM-04-1X2Y3Z").
 * The brand code is the brand name's leading letters; the suffix mixes the
 * timestamp with a short random tail so two lines added in the same ms differ.
 */
function orderItemSku(pattern: VehiclePattern): string {
  const brandCode =
    pattern.brandName
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'NM';
  const patternSku = pattern.sku ?? 'CUSTOM';
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
  return `NM-${brandCode}-${patternSku}-${stamp}`;
}
