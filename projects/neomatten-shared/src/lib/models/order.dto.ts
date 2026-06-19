/**
 * Order domain DTOs — the wire contract shared with the NestJS backend and the
 * admin panel. Maps to the Prisma `Order` / `OrderItem` models.
 */

/**
 * Order lifecycle status. Values mirror the Prisma `OrderStatus` enum exactly so
 * the same string travels FE ⇄ API ⇄ DB unchanged.
 * Flow: REVIEW → PENDING → IN_PRODUCTION → SHIPPED → DELIVERED → COMPLETED
 * (`CANCELLED` is terminal). Admin transitions via `PATCH /api/orders/:id/status`.
 */
export enum OrderStatus {
  REVIEW = 'REVIEW',
  PENDING = 'PENDING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/** Currency code (ISO 4217). EUR is the only currency today. */
export type CurrencyCode = 'EUR';

/**
 * A single ordered line. For configured mat sets the `configuration` blob holds
 * the configurator selections (tier/texture/colours/kit pieces/…); simple
 * products (cushions, bags) leave it empty. Maps to the Prisma `OrderItem` model.
 */
export interface OrderItemDTO {
  readonly id: string;
  /** Product family this line belongs to (e.g. 'mats' | 'cushion' | 'eva_bag'). */
  readonly productType: string;
  /** Display name (configured mat set or product name). */
  readonly name: string;
  /** Free-form configuration payload (configurator selections); `{}` for simple products. */
  readonly configuration: Record<string, unknown>;
  readonly quantity: number;
  readonly unitPrice: number;
}

/** A complete order. Maps to the Prisma `Order` model. */
export interface OrderDTO {
  readonly id: string;
  /** Owning user id; null for guest checkout. */
  readonly userId: string | null;
  readonly items: readonly OrderItemDTO[];
  readonly status: OrderStatus;
  readonly totalPrice: number;
  readonly currency: CurrencyCode;
  /** ISO timestamp. */
  readonly createdAt: string;
  /** ISO timestamp. */
  readonly updatedAt: string;
}
