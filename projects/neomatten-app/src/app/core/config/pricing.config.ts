/*
 * EN: Pricing configuration seam. Every price, add-on, shipping tier, threshold
 *     and discount rate lives here as a single source of truth, exposed through
 *     the `PRICING` InjectionToken so it can be swapped for admin-managed /
 *     backend-driven values later without touching any call site (DIP).
 * RU: Точка конфигурации цен. Все цены, надбавки, тарифы доставки, пороги и
 *     ставка скидки собраны здесь как единый источник истины и отдаются через
 *     InjectionToken `PRICING`, чтобы позже заменить их на значения из
 *     админки/бэкенда без правки вызовов (DIP).
 */
import { InjectionToken } from '@angular/core';

/** Shipping price tiers (EUR), keyed by kit size. */
export interface ShippingTiers {
  /** Single mat / simple product. */
  readonly single: number;
  /** Pair (front row). */
  readonly pair: number;
  /** Full interior set. */
  readonly full: number;
  /** Premium set (with trunk). */
  readonly premium: number;
}

/** Configured-mat tier base prices (EUR). */
export interface TierBasePrices {
  readonly economy: number;
  readonly standard: number;
  readonly premium: number;
}

/** All admin-managed money values in one place (mock until the backend owns them). */
export interface PricingConfig {
  /** Base price per pricing tier. */
  readonly tierBasePrices: TierBasePrices;
  /** Per-mat surcharge beyond the front pair. */
  readonly extraMatPrice: number;
  /** Heel-pad (step 08) upgrade prices. */
  readonly heelPad: { readonly standard: number; readonly threeD: number };
  /** Heel-rest pad (step 09) accessory prices. */
  readonly heelRest: { readonly metal: number; readonly rubber: number };
  /** Shipping tiers (EUR). */
  readonly shipping: ShippingTiers;
  /** Free-shipping threshold (EUR). */
  readonly freeShippingThreshold: number;
  /** Welcome discount rate applied to the first order (e.g. 0.1 = 10%). */
  readonly firstOrderDiscountRate: number;
}

/**
 * Default mock pricing — the single source of truth for every price/limit.
 * TODO(backend)/TODO(admin): replace by providing `PRICING` with values fetched
 * from `GET /api/settings/prices`; the call sites stay identical.
 */
export const DEFAULT_PRICING: PricingConfig = {
  tierBasePrices: { economy: 89, standard: 119, premium: 159 },
  extraMatPrice: 15,
  heelPad: { standard: 5, threeD: 10 },
  heelRest: { metal: 20, rubber: 15 },
  shipping: { single: 4.99, pair: 6.99, full: 9.99, premium: 12.99 },
  freeShippingThreshold: 100,
  firstOrderDiscountRate: 0.1,
};

/**
 * Injectable pricing seam. Defaults to {@link DEFAULT_PRICING}; override it with a
 * provider (e.g. backed by a settings API) when prices become admin-managed.
 */
export const PRICING = new InjectionToken<PricingConfig>('PRICING', {
  providedIn: 'root',
  factory: () => DEFAULT_PRICING,
});
