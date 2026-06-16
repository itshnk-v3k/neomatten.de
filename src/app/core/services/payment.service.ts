/*
 * EN: Mock payment service. `process(method, amount)` returns a mock success
 *     result today; each method has a single clearly-marked seam where the real
 *     Stripe / Klarna / PayPal SDK call drops in (a one-liner per provider).
 *     CONTACT_MANAGER is not an online payment — it records intent and the sales
 *     rep follows up (see EmailService).
 * RU: Мок-сервис оплаты. `process(method, amount)` сейчас возвращает успешный
 *     мок-результат; у каждого способа — единая помеченная точка, куда вставится
 *     реальный вызов SDK Stripe / Klarna / PayPal (по одной строке на провайдера).
 *     CONTACT_MANAGER — не онлайн-оплата: фиксирует намерение, менеджер
 *     связывается позже (см. EmailService).
 */
import { inject, Injectable } from '@angular/core';
import type { PaymentMethod } from '@core/models/order.model';
import { StripeService } from '@core/services/stripe.service';

export interface PaymentResult {
  readonly success: boolean;
  readonly method: PaymentMethod;
  readonly amount: number;
  /** Provider transaction reference (mock). */
  readonly reference: string;
  /** Translate key for an error message when `success` is false. */
  readonly errorKey?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly stripe = inject(StripeService);

  /**
   * Processes a payment. Mock: always succeeds (except a guard for non-positive
   * amounts). Swap the per-method seam below for the real SDK call.
   */
  async process(method: PaymentMethod, amount: number): Promise<PaymentResult> {
    if (amount <= 0) {
      return { success: false, method, amount, reference: '', errorKey: 'payment_error_amount' };
    }

    switch (method) {
      case 'stripe_card': {
        // Load Stripe.js (mock today); the real redirect/confirm lands with the
        // backend. Simulate the processing latency so the UI shows its loading state.
        await this.stripe.load();
        // TODO(backend): real Stripe redirect/confirm via Checkout Session / PaymentIntent.
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.mockSuccess(method, amount);
      }
      case 'klarna':
        // TODO(backend): await Klarna.Payments.authorize({ ... }).
        return this.mockSuccess(method, amount);
      case 'paypal':
        // TODO(backend): await paypal.Buttons(...).createOrder / onApprove capture.
        return this.mockSuccess(method, amount);
      case 'contact_manager':
        // Not an online payment — intent only; EmailService notifies the manager.
        return this.mockSuccess(method, amount);
    }
  }

  private mockSuccess(method: PaymentMethod, amount: number): PaymentResult {
    return {
      success: true,
      method,
      amount,
      reference: `mock-${method}-${Date.now().toString(36)}`,
    };
  }
}
