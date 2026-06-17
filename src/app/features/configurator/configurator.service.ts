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
import { inject, Injectable, signal } from '@angular/core';
import type { Language } from '@core/i18n/language.model';
import type { CartItem } from '@core/models/cart-item.model';
import type { MatColour, MatColoursData } from '@core/models/mat-colour.model';
import type { OrderItemDTO } from '@core/models/order.model';
import type { VehiclePattern } from '@core/models/vehicle.model';
import type { SelectOption } from '@shared/models/select-option.model';

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
// images via MediaService. Mat + edge colour palettes are now loaded at runtime
// from mock JSON (see ConfiguratorService.matColours / edgeColours) and will move
// to `GET /api/settings/colours`.
export const TEXTURES: readonly Texture[] = ['rhombus', 'honeycomb', 'drop'] as const;

/** Localized display name for a colour (German name when DE, English otherwise). */
export function colourName(colour: MatColour, lang: Language): string {
  return lang === 'de' ? colour.name_de : colour.name_en;
}

/**
 * Per-brand trim levels (keyed by brand id slug). Values are proper nouns shown
 * as-is — the translate pipe falls back to the literal string for unknown keys,
 * so no i18n entries are needed. Brands without an entry use `default`.
 */
export const BRAND_TRIMS: Readonly<Record<string, readonly string[]>> = {
  audi: [
    'Base',
    'Sport',
    'S-Line',
    'S-Line Plus',
    'Black Edition',
    'Quattro',
    'RS',
    'S',
    'Edition 1',
  ],
  bmw: [
    'Base',
    'M Sport',
    'M Sport Pro',
    'xDrive',
    'Sport Line',
    'Luxury Line',
    'M Performance',
    'Alpina',
  ],
  'mercedes-benz': [
    'Base',
    'AMG Line',
    'AMG',
    'Exclusive',
    'Avantgarde',
    'Elegance',
    'Night Edition',
    'Edition 1',
  ],
  volkswagen: [
    'Base',
    'Life',
    'Style',
    'R-Line',
    'GTI',
    'R',
    'Highline',
    'Comfortline',
    'Trendline',
  ],
  toyota: ['Base', 'Comfort', 'Executive', 'GR Sport', 'Hybrid', 'Lounge'],
  ford: ['Base', 'Trend', 'Titanium', 'ST-Line', 'ST', 'Vignale'],
  skoda: ['Active', 'Ambition', 'Style', 'Sportline', 'RS', 'Scout', 'L&K'],
  seat: ['Reference', 'Style', 'FR', 'Xcellence', 'Cupra'],
  hyundai: ['Classic', 'Comfort', 'Smart', 'Premium', 'N-Line', 'N'],
  kia: ['Concept', 'Dream-Team', 'Spirit', 'GT-Line', 'GT'],
  porsche: ['Base', 'S', 'GTS', 'Turbo', 'Turbo S', 'Carrera', 'Targa', '4S'],
  renault: ['Life', 'Zen', 'Intens', 'Techno', 'RS Line', 'RS'],
  peugeot: ['Active', 'Allure', 'GT', 'GT Premium', 'e-GT'],
  opel: ['Edition', 'Elegance', 'GS', 'GS Line', 'OPC'],
  volvo: ['Core', 'Plus', 'Ultra', 'Black Edition', 'Polestar'],
  mazda: ['Prime-Line', 'Exclusive-Line', 'Homura', 'Takumi'],
  subaru: ['Active', 'Comfort', 'Trend', 'STI Sport'],
  mitsubishi: ['Inform', 'Plus', 'Top', 'Instyle', 'Ralliart'],
  nissan: ['Visia', 'Acenta', 'N-Connecta', 'Tekna', 'N-Sport'],
  honda: ['Comfort', 'Elegance', 'Sport', 'Executive', 'Type R'],
  default: ['Base', 'Comfort', 'Sport', 'Premium', 'Luxury', 'Limited Edition'],
};

// --- mock pricing -----------------------------------------------------------
// TODO(admin)/TODO(backend): all prices below (tier base prices, add-on prices
// and shipping tiers) are a mock. They should be admin-managed and/or computed
// by the backend (e.g. `POST /api/configurator/price`); swap `price()`/`shipping()`
// to call the API — the call sites stay the same.

const BASE_BY_TIER = { economy: 89, standard: 119, premium: 159 } as const;
const EXTRA_MAT_PRICE = 15;
// Heel-pad (step 08) upgrade prices. TODO(admin): GET /api/settings/prices.
const HEEL_PAD_STANDARD_PRICE = 5;
const HEEL_PAD_3D_PRICE = 10;
// Heel-rest pad (step 09) accessory prices. TODO(admin): GET /api/settings/prices.
const HEEL_METAL_PRICE = 20;
const HEEL_RUBBER_PRICE = 15;

/** Shipping tiers (EUR) matching the step-11 delivery table. */
export const SHIPPING_SINGLE = 4.99;
export const SHIPPING_PAIR = 6.99;
export const SHIPPING_FULL = 9.99;
export const SHIPPING_PREMIUM = 12.99;

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
}

export type PricingTier = 'economy' | 'standard' | 'premium';

@Injectable({ providedIn: 'root' })
export class ConfiguratorService {
  private readonly http = inject(HttpClient);

  private readonly loadingSignal = signal(true);
  /** True while configurator data initializes; flips false once colours load. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Mat (fill) colour palette, loaded at runtime. Empty until the load resolves. */
  readonly matColours = signal<MatColour[]>([]);
  /** Edge (border) colour palette, loaded at runtime. Empty until the load resolves. */
  readonly edgeColours = signal<MatColour[]>([]);

  constructor() {
    // TODO(backend): GET /api/settings/colours
    this.http.get<MatColoursData>('assets/data/mat-colours.json').subscribe({
      next: data => {
        this.matColours.set(data.mat_colours ?? []);
        this.edgeColours.set(data.edge_colours ?? []);
        this.loadingSignal.set(false);
      },
      // Don't strand the page on the skeleton if the palette fails to load.
      error: () => this.loadingSignal.set(false),
    });
  }

  /** Localized name for a stored mat-colour id (falls back to the id itself). */
  matColourName(id: string, lang: Language): string {
    const colour = this.matColours().find(c => c.id === id);
    return colour ? colourName(colour, lang) : id;
  }

  /** Localized name for a stored edge-colour id (falls back to the id itself). */
  edgeColourName(id: string, lang: Language): string {
    const colour = this.edgeColours().find(c => c.id === id);
    return colour ? colourName(colour, lang) : id;
  }

  // Static refine-spec options (no such columns in the dataset — informational).
  readonly transmissionOptions: SelectOption[] = [
    { value: 'automatic', label: 'configurator_transmission_automatic' },
    { value: 'manual', label: 'configurator_transmission_manual' },
  ];
  readonly driveOptions: SelectOption[] = [
    { value: 'awd', label: 'configurator_drive_awd' },
    { value: 'front', label: 'configurator_drive_front' },
    { value: 'rear', label: 'configurator_drive_rear' },
  ];
  readonly engineOptions: SelectOption[] = [
    { value: '1.6', label: '1.6 L' },
    { value: '2.0', label: '2.0 L' },
    { value: '2.5', label: '2.5 L' },
    { value: '3.0', label: '3.0 L' },
    { value: 'electric', label: 'configurator_engine_electric' },
  ];
  /**
   * Trim-level options for a brand (by id slug). Falls back to `default` for
   * brands without a curated list. Values are proper nouns shown as-is.
   */
  trimsFor(brandId: string): SelectOption[] {
    const trims = BRAND_TRIMS[brandId] ?? BRAND_TRIMS['default'];
    return trims.map(t => ({ value: t, label: t }));
  }

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
    if (heelPad === 'standard') return HEEL_PAD_STANDARD_PRICE;
    if (heelPad === '3d') return HEEL_PAD_3D_PRICE;
    return 0;
  }

  /** Heel-rest pad (step 09) accessory price for the chosen option, in EUR. */
  heelRestPrice(heelRest: HeelRest): number {
    if (heelRest === 'metal') return HEEL_METAL_PRICE;
    if (heelRest === 'rubber') return HEEL_RUBBER_PRICE;
    return 0;
  }

  /** Mock configured-mat price (before shipping/discount), in EUR. */
  price(state: ConfigState): number {
    const floors = FLOOR_ZONES.filter(z => state.zones.has(z)).length;
    if (floors === 0 && !state.zones.has('trunk')) return 0;
    const tier = this.tierFor(state.zones);
    const extras = Math.max(0, floors - 2); // beyond the front pair
    // Mounting (3D) is Coming Soon — not charged. Heel-pad + heel-rest are add-ons.
    const total =
      BASE_BY_TIER[tier] +
      extras * EXTRA_MAT_PRICE +
      this.heelPadPrice(state.heelPad) +
      this.heelRestPrice(state.heelRest);
    return round2(total);
  }

  /** Shipping cost for the kit (EUR). Free for full interior / premium sets. */
  shipping(zones: ReadonlySet<CarZone>): number {
    const floors = FLOOR_ZONES.filter(z => zones.has(z)).length;
    if (zones.has('trunk')) return 0; // premium set → free to Germany
    if (floors >= 4) return 0; // full interior → free to Germany
    if (floors <= 1) return SHIPPING_SINGLE;
    if (floors === 2) return SHIPPING_PAIR;
    return SHIPPING_FULL;
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
      texture: state.texture,
      materialColour: state.materialColor,
      edgeColour: state.edgeColor,
      heelPad: state.heelPad,
      heelRest: state.heelRest,
      mounting: state.mounting,
      accessories: state.accessories,
      quantity: 1,
      unitPrice: this.price(state),
    };
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
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
