import type { OrderItemDTO } from './order.dto';

/**
 * Cart line-item — an order item (same fields) plus a client-side line `id`, so
 * the pre-order cart state and the persisted order share one shape. Wire
 * contract for the backend cart endpoint; maps to a future `cart_items` table.
 */
export interface CartItemDTO extends Omit<OrderItemDTO, 'id'> {
  /** Unique line id (generated client-side until the backend assigns one). */
  readonly id: string;
}
