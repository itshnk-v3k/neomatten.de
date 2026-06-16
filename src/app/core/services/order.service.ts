/*
 * EN: Order history service. Persists every completed order (cart checkout or
 *     configurator submit) to localStorage as an `OrderRecord` (= `OrderDTO`)
 *     and exposes them as a signal for the account view. Status is mocked today
 *     (Pending → In production → Shipped → Delivered) and will come from the
 *     backend later. This shape is the DTO for the future backend integration.
 * RU: Сервис истории заказов. Сохраняет каждый завершённый заказ (оформление
 *     корзины или отправка конфигуратора) в localStorage как `OrderRecord`
 *     (= `OrderDTO`) и отдаёт их сигналом для страницы аккаунта. Статус сейчас
 *     мок (Pending → In production → Shipped → Delivered), позже придёт с
 *     бэкенда. Эта форма — DTO для будущей интеграции с бэкендом.
 */
import { computed, inject, Injectable, signal } from '@angular/core';
// import { ApiService } from '@core/http/api.service';
import type {
  OrderItemDTO,
  OrderRecord,
  OrderStatus,
  PaymentMethod,
} from '@core/models/order.model';
import { AuthService } from '@core/services/auth.service';

const ORDERS_STORAGE_KEY = 'neomatten_orders';

/** Input to create an order (totals + items + chosen payment method). */
export interface CreateOrderInput {
  readonly items: readonly OrderItemDTO[];
  readonly subtotal: number;
  readonly shipping: number;
  readonly discount: number;
  readonly total: number;
  readonly paymentMethod: PaymentMethod;
  readonly shippingAddress?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly auth = inject(AuthService);
  // TODO(backend): inject ApiService and replace localStorage with HTTP (see methods).
  // private readonly api = inject(ApiService);

  private readonly ordersSignal = signal<OrderRecord[]>(this.restore());

  /** All orders, newest first. */
  readonly orders = computed(() =>
    [...this.ordersSignal()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  );

  readonly count = computed(() => this.ordersSignal().length);

  private readonly loadingSignal = signal(true);
  /** True while order history loads; flips false after a short delay (mock). */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // One-time migration: `restore()` rewrites any legacy `pending_contact`
    // orders to `review`; persist the result so the migration sticks.
    this.persist();
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from `GET /orders` request lifecycle.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /**
   * Creates and persists an order, then clears the user's welcome discount.
   * Every new order starts as `review` regardless of payment method — the admin
   * reviews it and promotes it to `pending` (payment verified → production).
   * TODO(backend): replace with `this.api.post<OrderDTO>('/orders', input)` and
   * drop the localStorage persistence.
   */
  create(input: CreateOrderInput): OrderRecord {
    const now = new Date().toISOString();
    const order: OrderRecord = {
      id: this.mockId(),
      userId: this.auth.user()?.id ?? null,
      items: input.items,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount: input.discount,
      total: input.total,
      // Always start in review; the admin promotes to `pending` after verifying.
      status: 'review',
      paymentMethod: input.paymentMethod,
      shippingAddress: input.shippingAddress,
      createdAt: now,
      updatedAt: now,
    };
    this.ordersSignal.update(orders => [...orders, order]);
    this.persist();
    this.auth.clearFirstOrderDiscount();
    return order;
  }

  /** Loads the current user's orders. TODO(backend): `this.api.get<OrderDTO[]>('/orders')`. */
  private restore(): OrderRecord[] {
    try {
      const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const stored = JSON.parse(raw) as OrderRecord[];
      // One-time migration: the removed `pending_contact` status → `review`.
      return stored.map(order =>
        (order.status as string) === 'pending_contact'
          ? { ...order, status: 'review' as OrderStatus }
          : order
      );
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.ordersSignal()));
    } catch {
      // ignore storage errors
    }
  }

  private mockId(): string {
    return `NM-${Date.now().toString(36).toUpperCase()}`;
  }
}
