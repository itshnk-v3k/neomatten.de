/*
 * EN: Order + payment domain models / DTOs. These are the wire contracts shared
 *     with the future .NET/C#/PostgreSQL + Swagger backend: an order is a list
 *     of order items plus money totals, status and payment method. `OrderRecord`
 *     is the localStorage shape used by OrderService today and is intentionally
 *     identical to `OrderDTO` so swapping the mock for real HTTP is a no-op on
 *     the model side.
 * RU: Доменные модели/DTO заказа и оплаты. Это контракты обмена с будущим
 *     бэкендом .NET/C#/PostgreSQL + Swagger: заказ — список позиций плюс суммы,
 *     статус и способ оплаты. `OrderRecord` — форма для localStorage, которую
 *     сейчас использует OrderService, и она намеренно совпадает с `OrderDTO`,
 *     чтобы замена мока на реальный HTTP не меняла модель.
 */

/** Payment method. CONTACT_MANAGER = no online payment, sales rep follows up. */
export type PaymentMethod = 'stripe_card' | 'klarna' | 'paypal' | 'contact_manager';

export const PAYMENT_METHODS: readonly PaymentMethod[] = [
  'stripe_card',
  'klarna',
  'paypal',
  'contact_manager',
] as const;

/**
 * Order lifecycle status (→ `order_status_*` translation key). Mock for now.
 * Flow: review → pending → in_production → shipped → delivered → completed
 * (`cancelled` is terminal). The admin panel will drive transitions later
 * (TODO(backend): PATCH /api/orders/:id/status).
 */
export type OrderStatus =
  | 'review' // order received, awaiting review by admin (contact-manager path)
  | 'pending' // confirmed, payment received, in production queue
  | 'in_production' // being made (2–3 days)
  | 'shipped' // sent to customer
  | 'delivered' // customer received / picked up
  | 'completed' // customer confirmed receipt
  | 'cancelled'; // cancelled

/** Product category an order item belongs to (→ `order_category_*`). */
export type ProductCategory = 'mats' | 'cushion' | 'eva_bag' | 'leather_bag';

/**
 * A single ordered line. For configured mat sets the configurator fields
 * (tier/texture/colours/kit pieces/…) are populated; for simple products
 * (cushions, bags) only the common fields are. Maps to a future `order_items`
 * table. `CartItemDTO` mirrors this shape for the pre-order (cart) state.
 */
export interface OrderItemDTO {
  /** Article number; null for on-request / un-purchasable patterns. */
  readonly sku: string | null;
  /**
   * Unique per-line article number generated for a configured (custom mat) order
   * on add-to-cart: `NM-{BRAND_CODE}-{PATTERN_SKU}-{TIMESTAMP_BASE36}`
   * (e.g. "NM-BMW-BM-04-1X2Y3Z"). Absent for simple catalogue products.
   */
  readonly orderItemSku?: string;
  readonly category: ProductCategory;
  /** Display name (configured mat set or product name). */
  readonly name: string;
  // --- Configured-mat detail (optional for simple products) ---
  readonly brand?: string;
  readonly model?: string;
  readonly yearRange?: string;
  readonly tier?: string;
  readonly kitPieces?: readonly string[];
  readonly texture?: string;
  readonly materialColour?: string;
  readonly edgeColour?: string;
  readonly heelPad?: string;
  /** Heel-rest pad accessory: 'none' | 'metal' | 'rubber'. */
  readonly heelRest?: string;
  readonly mounting?: string;
  readonly accessories?: string;
  // --- Common ---
  readonly quantity: number;
  readonly unitPrice: number;
  readonly thumbnailUrl?: string;
}

/**
 * A complete order. `subtotal`/`shipping`/`discount` break down `total` and are
 * extra to the minimal spec contract so the cart/account UIs can show the
 * breakdown without recomputing it.
 */
export interface OrderDTO {
  readonly id: string;
  /** Owning user id; null for guest checkout (not used in the mock flow). */
  readonly userId: string | null;
  readonly items: readonly OrderItemDTO[];
  readonly subtotal: number;
  readonly shipping: number;
  readonly discount: number;
  readonly total: number;
  readonly status: OrderStatus;
  readonly paymentMethod: PaymentMethod;
  readonly shippingAddress?: string;
  /** ISO timestamp. */
  readonly createdAt: string;
  /** ISO timestamp. */
  readonly updatedAt: string;
}

/**
 * The localStorage record persisted by OrderService. Identical to `OrderDTO`
 * (the spec's `OrderRecord { id, date, items[], total, status, paymentMethod }`
 * is a subset — `createdAt` is the `date`), so it doubles as the backend DTO.
 */
export type OrderRecord = OrderDTO;
