/*
 * EN: Cart line-item model. A cart item is an order item (same configured-mat /
 *     product fields) plus a client-side line `id`, so the pre-order cart state
 *     and the persisted order share one shape. `CartItemDTO` is the explicit
 *     wire name for the future backend cart endpoint. Maps to a future
 *     `cart_items` table.
 * RU: Модель позиции корзины. Позиция корзины — это позиция заказа (те же поля
 *     конфигурации/товара) плюс клиентский `id` строки, чтобы состояние корзины
 *     до заказа и сохранённый заказ имели единую форму. `CartItemDTO` — явное
 *     имя контракта для будущего эндпоинта корзины. Ложится в `cart_items`.
 */
import type { OrderItemDTO } from './order.model';

export interface CartItem extends OrderItemDTO {
  /** Unique line id (generated client-side until the backend assigns one). */
  readonly id: string;
}

/** Explicit wire-contract alias for the future backend cart API. */
export type CartItemDTO = CartItem;
