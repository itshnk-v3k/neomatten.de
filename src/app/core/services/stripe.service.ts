/*
 * EN: Stripe.js loader + checkout seam (mock). Lazily loads Stripe.js with the
 *     environment's publishable key and exposes the points where the real
 *     payment flow drops in once the backend exists: `redirectToCheckout`
 *     (Checkout Session) and `createPaymentIntent` (PaymentIntent client secret).
 *     Both are mocks today — they log/return placeholders so the UI flow works
 *     end-to-end without a backend.
 * RU: Загрузчик Stripe.js + точка оплаты (мок). Лениво грузит Stripe.js с
 *     publishable-ключом из окружения и обозначает места, куда встанет реальный
 *     поток оплаты при наличии бэкенда: `redirectToCheckout` (Checkout Session) и
 *     `createPaymentIntent` (client secret PaymentIntent). Сейчас оба — моки.
 */
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

@Injectable({ providedIn: 'root' })
export class StripeService {
  private stripe: Stripe | null = null;

  private readonly publishableKey = environment.stripePublishableKey ?? 'pk_test_placeholder';

  /** Loads (once) and returns the Stripe.js instance, or null if it fails to load. */
  async load(): Promise<Stripe | null> {
    if (!this.stripe) {
      this.stripe = await loadStripe(this.publishableKey);
    }
    return this.stripe;
  }

  /**
   * Redirects to Stripe Checkout (mock).
   * TODO(backend): create a checkout session via POST /api/payments/create-session
   * to get a sessionId, then `stripe.redirectToCheckout({ sessionId })`.
   */
  async redirectToCheckout(amount: number, currency = 'eur'): Promise<void> {
    await this.load();
    console.log('[Stripe mock] would charge:', amount, currency);
  }

  /**
   * Creates a PaymentIntent and returns its client secret (mock).
   * TODO(backend): POST /api/payments/intent → { clientSecret }.
   */
  async createPaymentIntent(amount: number): Promise<string> {
    void amount;
    return 'pi_mock_secret_' + crypto.randomUUID();
  }
}
