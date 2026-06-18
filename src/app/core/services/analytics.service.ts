/*
 * EN: Google Analytics 4 (G-6G3KVDD5GH) with GDPR consent mode. The gtag.js
 *     snippet in index.html boots in consent "denied" mode (no storage, no
 *     page_view). This service is the single seam that flips consent based on the
 *     visitor's cookie choice (key `neomatten_cookie_consent`, written by
 *     nm-cookie-consent) and emits the app's analytics events. Nothing is sent
 *     until consent is granted: every track* call is a no-op while denied.
 * RU: Google Analytics 4 (G-6G3KVDD5GH) с режимом согласия GDPR. Сниппет gtag.js
 *     в index.html стартует в режиме «denied» (без хранения и без page_view).
 *     Этот сервис — единственная точка, переключающая согласие по выбору cookie
 *     посетителя (ключ `neomatten_cookie_consent`, пишет nm-cookie-consent) и
 *     отправляющая события аналитики. Пока согласие не дано, любой вызов track*
 *     ничего не делает.
 */
import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { OrderItemDTO, OrderRecord } from '@core/models/order.model';
import { round2 } from '@shared/utils/money.util';

/** Reporting currency for GA4 ecommerce events. */
const CURRENCY = 'EUR';

/** localStorage key written by nm-cookie-consent ('accepted' | 'declined'). */
const COOKIE_CONSENT_KEY = 'neomatten_cookie_consent';

/** A GA4 ecommerce `items[]` entry. */
interface GaItem {
  readonly item_id: string;
  readonly item_name: string;
  readonly item_category: string;
  readonly price: number;
  readonly quantity: number;
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** True once the visitor has granted analytics consent (events flow only then). */
  private readonly granted = signal(false);
  /** Read-only consent state for any UI that needs it. */
  readonly consentGranted = this.granted.asReadonly();

  constructor() {
    // Returning visitor who already accepted: restore granted consent on load.
    // (A first-time visitor has no stored choice → stays denied until they pick.)
    if (this.isBrowser && this.readStoredConsent() === 'accepted') {
      this.enableAnalytics();
    }
  }

  /**
   * Called by nm-cookie-consent when the visitor clicks Accept. Updates GA
   * consent to granted and sends the initial page view for the current page
   * (subsequent views come from the router; see AppComponent).
   */
  onConsentAccepted(): void {
    if (!this.isBrowser) return;
    this.enableAnalytics();
    this.trackPageView(window.location.pathname + window.location.search);
  }

  /** Called by nm-cookie-consent when the visitor clicks Decline. Stays denied. */
  onConsentDeclined(): void {
    if (!this.isBrowser) return;
    this.granted.set(false);
    this.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
  }

  /** Sends a GA4 page_view (no-op until consent is granted). */
  trackPageView(pagePath: string): void {
    this.track('page_view', { page_path: pagePath, page_location: this.pageLocation(pagePath) });
  }

  /** User landed on the configurator (optionally for a specific brand). */
  trackConfiguratorStarted(brand?: string): void {
    this.track('configurator_started', brand ? { brand } : {});
  }

  /** A configured mat set was added to the cart from the configurator (step 13). */
  trackConfiguratorCompleted(item: OrderItemDTO): void {
    this.track('configurator_completed', {
      brand: item.brand,
      model: item.model,
      tier: item.tier,
      value: round2(item.unitPrice * item.quantity),
      currency: CURRENCY,
    });
  }

  /** GA4 `add_to_cart` ecommerce event for any cart line (mat set or product). */
  trackAddToCart(item: OrderItemDTO): void {
    this.track('add_to_cart', {
      currency: CURRENCY,
      value: round2(item.unitPrice * item.quantity),
      items: [toGaItem(item)],
    });
  }

  /** GA4 `purchase` ecommerce event (mock checkout; backend confirms later). */
  trackPurchase(order: OrderRecord): void {
    this.track('purchase', {
      transaction_id: order.id,
      currency: CURRENCY,
      value: order.total,
      shipping: order.shipping,
      items: order.items.map(toGaItem),
    });
  }

  /** A contact-style form was submitted (`source` distinguishes which form). */
  trackContactFormSubmitted(source: string): void {
    this.track('contact_form_submitted', { source });
  }

  /** Grants GA consent and marks analytics enabled. */
  private enableAnalytics(): void {
    this.granted.set(true);
    this.gtag('consent', 'update', { analytics_storage: 'granted' });
  }

  /** Emits a GA4 event — but only in the browser and only once consent is granted. */
  private track(eventName: string, params: Record<string, unknown>): void {
    if (!this.isBrowser || !this.granted()) return;
    this.gtag('event', eventName, params);
  }

  /** Safe gtag accessor (the snippet defines it synchronously in index.html). */
  private gtag(...args: unknown[]): void {
    if (this.isBrowser && typeof window.gtag === 'function') {
      window.gtag(...args);
    }
  }

  /** Absolute URL for a path, for GA4's `page_location`. */
  private pageLocation(pagePath: string): string {
    return this.isBrowser ? window.location.origin + pagePath : pagePath;
  }

  private readStoredConsent(): string | null {
    try {
      return localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
      return null;
    }
  }
}

/** Maps an order/cart line to a GA4 ecommerce item. */
function toGaItem(item: OrderItemDTO): GaItem {
  return {
    item_id: item.orderItemSku ?? item.sku ?? 'unknown',
    item_name: item.name,
    item_category: item.category,
    price: item.unitPrice,
    quantity: item.quantity,
  };
}
