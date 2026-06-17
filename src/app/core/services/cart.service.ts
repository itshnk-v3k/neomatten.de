/*
 * EN: Signal-based shopping cart. Holds line items, persists them to
 *     localStorage, and exposes derived count / subtotal / shipping / discount /
 *     total signals (the header badge uses `count`). Shipping is auto-determined
 *     by cart contents (free for full/premium mat sets to Germany or orders from
 *     €100); the 10% welcome discount applies while the signed-in user still has
 *     `firstOrderDiscount`. A mock seam for the future backend cart API.
 * RU: Корзина на сигналах. Хранит позиции, сохраняет в localStorage и отдаёт
 *     производные сигналы count / subtotal / shipping / discount / total (бейдж
 *     в хедере — `count`). Доставка определяется содержимым корзины (бесплатно
 *     для полных/премиум-комплектов в Германию или заказов от €100); скидка 10%
 *     действует, пока у вошедшего пользователя есть `firstOrderDiscount`. Точка
 *     подмены под будущий API корзины.
 */
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { PRICING, type PricingConfig } from '@core/config/pricing.config';
import type { CartItem } from '@core/models/cart-item.model';
import { type ProductDTO, productToCartItem } from '@core/models/product.model';
import { AuthService } from '@core/services/auth.service';
import { computeTotals } from '@shared/utils/money.util';

const CART_STORAGE_KEY = 'neomatten_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly auth = inject(AuthService);
  private readonly pricing = inject(PRICING);

  private readonly itemsSignal = signal<CartItem[]>(this.restore());

  /** Read-only cart items. */
  readonly items = this.itemsSignal.asReadonly();

  /** Total quantity across all items (header badge). */
  readonly count = computed(() => this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0));

  /** Sum of line prices before shipping/discount. */
  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  );

  /** Auto-determined shipping cost for the current cart contents (EUR). */
  readonly shipping = computed(() =>
    computeShipping(this.itemsSignal(), this.subtotal(), this.pricing)
  );

  /** Whether the welcome discount currently applies. */
  readonly discountApplies = computed(() => this.auth.user()?.firstOrderDiscount === true);

  /** Discount + grand total (single shared formula, see {@link computeTotals}). */
  private readonly totals = computed(() =>
    computeTotals({
      subtotal: this.subtotal(),
      shipping: this.shipping(),
      discountApplies: this.discountApplies(),
      discountRate: this.pricing.firstOrderDiscountRate,
    })
  );

  /** Discount amount in EUR (welcome discount off the subtotal when it applies). */
  readonly discount = computed(() => this.totals().discount);

  /** Grand total: subtotal − discount + shipping. */
  readonly total = computed(() => this.totals().total);

  private readonly loadingSignal = signal(true);
  /** True while the cart loads; flips false after a short delay (mock). */
  readonly loading = this.loadingSignal.asReadonly();

  /** IDs of lines currently being removed (guards against double-click DELETEs). */
  private readonly removingIdsSignal = signal<ReadonlySet<string>>(new Set());
  /** Read-only set of line ids mid-removal (the UI disables those rows). */
  readonly removingIds = this.removingIdsSignal.asReadonly();

  /** Pending debounced quantity-sync timers, keyed by line id. */
  private readonly quantitySyncTimers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor() {
    // Persist on every change.
    effect(() => this.persist(this.itemsSignal()));
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the cart API request lifecycle.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /**
   * Adds a line, merging into an existing line when it has the same SKU and
   * identical configuration — so re-adding the same item bumps its quantity
   * instead of creating a duplicate. Returns true when it merged into an
   * existing line, false when it added a new one (callers use this to pick the
   * "added" vs "quantity updated" toast).
   */
  add(item: CartItem): boolean {
    const items = this.itemsSignal();
    const index = items.findIndex(existing => isSameConfiguration(existing, item));
    if (index >= 0) {
      const next = [...items];
      const existing = next[index];
      next[index] = { ...existing, quantity: existing.quantity + item.quantity };
      this.itemsSignal.set(next);
      return true;
    }
    this.itemsSignal.set([...items, item]);
    return false;
  }

  /** Adds a simple catalogue product (cushion / bag); see {@link add} for the return. */
  addProduct(product: ProductDTO): boolean {
    return this.add(productToCartItem(product, this.lineId()));
  }

  /** Unique cart-line id (client-side until the backend assigns one). */
  private lineId(): string {
    return `line-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Removes a line. Idempotent: while a line is mid-removal further calls are
   * ignored, so a double-click can't fire a second DELETE.
   * TODO(backend): DELETE /api/cart/:id (the await models that round-trip).
   */
  async remove(id: string): Promise<void> {
    if (this.removingIdsSignal().has(id)) return; // already being removed
    this.removingIdsSignal.update(set => new Set(set).add(id));
    try {
      // TODO(backend): await this.api.delete(`/cart/${id}`);
      await delay(300);
      this.itemsSignal.update(items => items.filter(item => item.id !== id));
    } finally {
      this.removingIdsSignal.update(set => {
        const next = new Set(set);
        next.delete(id);
        return next;
      });
    }
  }

  /** Whether the given line is currently being removed. */
  isRemoving(id: string): boolean {
    return this.removingIdsSignal().has(id);
  }

  /**
   * Sets a line's quantity. The local signal updates immediately (responsive,
   * optimistic UI); the backend sync is debounced 300ms so rapid +/- taps
   * collapse into a single request per line.
   */
  updateQuantity(id: string, quantity: number): void {
    const next = Math.max(1, quantity);
    this.itemsSignal.update(items =>
      items.map(item => (item.id === id ? { ...item, quantity: next } : item))
    );
    this.scheduleQuantitySync(id);
  }

  /** Debounces the (future) per-line quantity PATCH so rapid taps batch into one. */
  private scheduleQuantitySync(id: string): void {
    clearTimeout(this.quantitySyncTimers.get(id));
    this.quantitySyncTimers.set(
      id,
      setTimeout(() => {
        this.quantitySyncTimers.delete(id);
        // The line may have been removed during the debounce window.
        if (!this.itemsSignal().some(item => item.id === id)) return;
        // TODO(backend): PATCH /api/cart/:id { quantity } with the line's current qty.
      }, 300)
    );
  }

  clear(): void {
    this.itemsSignal.set([]);
  }

  private restore(): CartItem[] {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }

  private persist(items: CartItem[]): void {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage write failures (e.g. private mode quota).
    }
  }
}

/** Resolves after `ms` (mocks the backend round-trip for remove). */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Two cart lines are the "same item" (so re-adding bumps quantity) when their
 * SKU and full configuration match. `orderItemSku` is deliberately excluded — it
 * embeds an add-time timestamp and is unique per add; quantity/thumbnail are
 * ignored as they don't define the item's identity.
 */
function isSameConfiguration(a: CartItem, b: CartItem): boolean {
  return (
    a.sku === b.sku &&
    a.category === b.category &&
    a.name === b.name &&
    a.brand === b.brand &&
    a.model === b.model &&
    a.yearRange === b.yearRange &&
    a.tier === b.tier &&
    a.texture === b.texture &&
    a.materialColour === b.materialColour &&
    a.edgeColour === b.edgeColour &&
    a.heelPad === b.heelPad &&
    a.heelRest === b.heelRest &&
    a.mounting === b.mounting &&
    a.accessories === b.accessories &&
    a.unitPrice === b.unitPrice &&
    sameKitPieces(a.kitPieces, b.kitPieces)
  );
}

/** Order-insensitive equality of two kit-piece lists. */
function sameKitPieces(a?: readonly string[], b?: readonly string[]): boolean {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((piece, i) => piece === sortedB[i]);
}

/**
 * Shipping cost for a set of items. Free when the order qualifies for free
 * shipping (≥ threshold, or it contains a full-interior / premium mat set
 * shipping to Germany); otherwise the most expensive single line's shipping tier
 * (one shipment per order). Pure so the configurator can reuse it for one item.
 */
export function computeShipping(
  items: readonly CartItem[],
  subtotal: number,
  pricing: PricingConfig
): number {
  if (items.length === 0) return 0;
  if (subtotal >= pricing.freeShippingThreshold) return 0;
  if (items.some(isFreeShippingItem)) return 0;
  return items.reduce((max, item) => Math.max(max, itemShippingTier(item, pricing)), 0);
}

/** Full-interior (4 mats) or premium (with trunk) sets ship free to Germany. */
function isFreeShippingItem(item: CartItem): boolean {
  if (item.category !== 'mats') return false;
  const pieces = item.kitPieces?.length ?? 0;
  return pieces >= 4 || (item.kitPieces?.includes('trunk') ?? false);
}

/** Per-line shipping tier (matches the configurator delivery table). */
function itemShippingTier(item: CartItem, pricing: PricingConfig): number {
  const tiers = pricing.shipping;
  if (item.category === 'mats') {
    const pieces = item.kitPieces?.length ?? 1;
    if (pieces <= 1) return tiers.single; // single mat
    if (pieces === 2) return tiers.pair; // pair
    return tiers.full; // full set
  }
  // Simple products (cushions, bags): single-mat rate.
  return tiers.single;
}
