/*
 * EN: Checkout orchestration shared by the cart and the configurator. Given the
 *     items + money breakdown + chosen payment method it: processes the payment
 *     (PaymentService mock), computes the 10% first-order discount from the
 *     signed-in user, creates + persists the order (OrderService), optionally
 *     clears the cart, notifies the manager for the "contact manager" path
 *     (EmailService mock), toasts and navigates to /account. One seam to swap for
 *     a real backend checkout endpoint.
 * RU: Оркестрация оформления заказа, общая для корзины и конфигуратора. По
 *     позициям + разбивке сумм + выбранному способу оплаты: проводит оплату (мок
 *     PaymentService), считает скидку 10% на первый заказ для вошедшего
 *     пользователя, создаёт и сохраняет заказ (OrderService), при необходимости
 *     очищает корзину, уведомляет менеджера для пути «связаться с менеджером»
 *     (мок EmailService), показывает тост и переходит на /account.
 */
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PRICING } from '@core/config/pricing.config';
import type { OrderItemDTO, OrderRecord, PaymentMethod } from '@core/models/order.model';
import { AnalyticsService } from '@core/services/analytics.service';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { EmailService } from '@core/services/email.service';
import { OrderService } from '@core/services/order.service';
import { PaymentService } from '@core/services/payment.service';
import { ToastService } from '@shared/services/toast.service';
import { computeTotals } from '@shared/utils/money.util';

export interface CheckoutInput {
  readonly items: readonly OrderItemDTO[];
  readonly subtotal: number;
  readonly shipping: number;
  readonly method: PaymentMethod;
  /** Clear the cart on success (true for the cart checkout, false for configurator). */
  readonly clearCart?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly auth = inject(AuthService);
  private readonly pricing = inject(PRICING);
  private readonly analytics = inject(AnalyticsService);
  private readonly payment = inject(PaymentService);
  private readonly orders = inject(OrderService);
  private readonly cart = inject(CartService);
  private readonly email = inject(EmailService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /**
   * The most recent order confirmed by a successful online payment (status
   * `pending`). Drives the global "Order confirmed!" dialog (see
   * OrderConfirmedDialogComponent). Null until an online payment succeeds and
   * after the dialog is dismissed. Contact-manager orders (status `review`) do
   * not set this — they get a toast only.
   */
  readonly confirmedOrder = signal<OrderRecord | null>(null);

  /** Dismisses the global order-confirmed dialog. */
  dismissConfirmation(): void {
    this.confirmedOrder.set(null);
  }

  /**
   * Runs the full checkout. Returns the created order, or null if payment failed.
   * Requires an authenticated user (the CTAs are auth-gated before reaching here).
   */
  async complete(input: CheckoutInput): Promise<OrderRecord | null> {
    const { discount, total } = computeTotals({
      subtotal: input.subtotal,
      shipping: input.shipping,
      discountApplies: this.auth.user()?.firstOrderDiscount === true,
      discountRate: this.pricing.firstOrderDiscountRate,
    });

    // Online methods process payment first; "contact manager" records intent only.
    if (input.method !== 'contact_manager') {
      const result = await this.payment.process(input.method, total);
      if (!result.success) {
        this.toast.error(result.errorKey ?? 'payment_error_generic');
        return null;
      }
    }

    const order = this.orders.create({
      items: input.items,
      subtotal: input.subtotal,
      shipping: input.shipping,
      discount,
      total,
      paymentMethod: input.method,
    });

    if (input.method === 'contact_manager') {
      await this.email.notifyManager(order.id, total, this.auth.user()?.email);
    } else {
      // Online payment (mock) → GA4 purchase. Contact-manager is intent only.
      this.analytics.trackPurchase(order);
    }
    if (input.clearCart) {
      this.cart.clear();
    }

    this.toast.success(
      input.method === 'contact_manager' ? 'checkout_manager_success' : 'checkout_paid_success'
    );
    // Online payments (status `pending`) trigger the global confirmation dialog;
    // contact-manager (status `review`) gets the toast only.
    if (input.method !== 'contact_manager') {
      this.confirmedOrder.set(order);
    }
    void this.router.navigate(['/account']);
    return order;
  }
}
