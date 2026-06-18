/*
 * EN: Cart page. Lists configured-mat and product lines (brand/model/year/SKU/
 *     tier/colour/kit pieces/qty) with quantity steppers + remove, an order
 *     summary (subtotal, shipping, 10% discount when applicable, total) and
 *     auth-gated Pay-now / Contact-manager CTAs that reuse the shared auth +
 *     payment dialogs and CheckoutService (clears the cart on success).
 * RU: Страница корзины. Список позиций (марка/модель/год/SKU/тариф/цвет/состав/
 *     кол-во) со степперами и удалением, итог заказа (подытог, доставка, скидка
 *     10% при наличии, итого) и CTA «Оплатить» / «Связаться с менеджером» за
 *     авторизацией — переиспользуют общие диалоги входа/оплаты и CheckoutService
 *     (очищает корзину при успехе).
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '@core/i18n/translation.service';
import type { CartItem } from '@core/models/cart-item.model';
import type { PaymentMethod } from '@core/models/order.model';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { CheckoutService } from '@core/services/checkout.service';
import { ProductService } from '@core/services/product.service';
import {
  ConfigDetailsComponent,
  type ConfigDetailsVM,
} from '@features/configurator/config-details/config-details.component';
import {
  type CarZone,
  ConfiguratorService,
  type HeelPadAccessory,
  type HeelRest,
} from '@features/configurator/configurator.service';
import {
  LucideCheck,
  LucideChevronDown,
  LucideCopy,
  LucideMinus,
  LucidePlus,
  LucideTrash2,
} from '@lucide/angular';
import { AuthDialogComponent } from '@shared/components/auth-dialog/auth-dialog.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { PaymentDialogComponent } from '@shared/components/payment-dialog/payment-dialog.component';
import { PaymentMethodsComponent } from '@shared/components/payment-methods/payment-methods.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ClipboardService } from '@shared/services/clipboard.service';
import { categoryBadge } from '@shared/utils/product-category';

@Component({
  selector: 'nm-cart-page',
  imports: [
    RouterLink,
    LucidePlus,
    LucideMinus,
    LucideTrash2,
    LucideCopy,
    LucideCheck,
    LucideChevronDown,
    BreadcrumbComponent,
    ButtonDirective,
    AuthDialogComponent,
    PaymentDialogComponent,
    PaymentMethodsComponent,
    SkeletonComponent,
    ConfigDetailsComponent,
    TranslatePipe,
    EuroPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  /** Category chip preset (label key + classes) for an item's product category. */
  protected readonly categoryBadge = categoryBadge;
  /** Shared copy-to-clipboard helper (line SKU copy buttons). */
  protected readonly clipboard = inject(ClipboardService);

  protected readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfiguratorService);
  private readonly translation = inject(TranslationService);
  private readonly products = inject(ProductService);

  /**
   * Catalogue description for a simple (non-configured) product line, resolved by
   * SKU from products.json and translated. Returns null when the product or its
   * description i18n key can't be resolved (so nothing renders).
   */
  protected productDescription(item: CartItem): string | null {
    if (!item.sku) return null;
    const product = this.products.products().find(p => p.sku === item.sku);
    if (!product?.description) return null;
    const text = this.translation.translate(product.description);
    return text === product.description ? null : text;
  }

  /** Cart line ids whose configuration details are currently expanded (collapsed by default). */
  private readonly expandedIds = signal(new Set<string>());

  protected isExpanded(id: string): boolean {
    return this.expandedIds().has(id);
  }

  protected toggleExpanded(id: string): void {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /**
   * One-line collapsed preview — a few key highlights (texture · colour · heel rest
   * · positions) joined by "·". Positions collapse to the matching preset name
   * (e.g. "Front row") when they form one, else a "N×" mat count.
   */
  protected configPreview(item: CartItem): string {
    const lang = this.translation.currentLanguage();
    const t = (key: string): string => this.translation.translate(key);
    const parts: string[] = [];
    if (item.texture) parts.push(t(`configurator_texture_${item.texture}`));
    if (item.bodyType) parts.push(t(`body_type_${item.bodyType}`));
    if (item.materialColour) parts.push(this.config.matColourName(item.materialColour, lang));
    if (item.heelRest && item.heelRest !== 'none') parts.push(t(`heel_rest_${item.heelRest}`));
    const presetKey = this.positionsPresetKey(item.kitPieces ?? []);
    if (presetKey) parts.push(t(presetKey));
    else if (item.kitPieces?.length) parts.push(`${item.kitPieces.length}×`);
    return parts.join(' · ');
  }

  /** Maps a set of selected positions to its preset i18n key, or null if it isn't one. */
  private positionsPresetKey(pieces: readonly string[]): string | null {
    const set = new Set(pieces);
    const matches = (zones: readonly string[]): boolean =>
      zones.length === set.size && zones.every(z => set.has(z));
    if (matches(['front_left', 'front_right'])) return 'configurator_preset_front_row';
    if (matches(['rear_left', 'rear_right'])) return 'configurator_preset_rear_row';
    if (matches(['front_left', 'front_right', 'rear_left', 'rear_right'])) {
      return 'configurator_preset_full_interior';
    }
    if (matches(['front_left', 'front_right', 'rear_left', 'rear_right', 'trunk'])) {
      return 'configurator_preset_premium';
    }
    return null;
  }

  /**
   * Resolves a configured-mat cart line into the shared summary view-model, so the
   * cart shows the same full configuration list as the configurator's step-13
   * summary. Colour ids → localized names/hex; delivery tier/cost are recomputed
   * from the line's kit pieces. Optional/skipped fields stay null → render "—".
   */
  protected configDetails(item: CartItem): ConfigDetailsVM {
    const lang = this.translation.currentLanguage();
    const zones = new Set((item.kitPieces ?? []) as CarZone[]);
    const ship = this.config.shipping(zones);
    return {
      vehicle: item.brand
        ? `${item.brand} ${item.model ?? ''}${item.yearRange ? ` ${item.yearRange}` : ''}`.trim()
        : null,
      bodyType: item.bodyType ?? null,
      transmission: item.transmission ?? null,
      year: item.yearOfManufacture ?? null,
      drive: item.drive ?? null,
      engine: item.engine ?? null,
      material: item.material ?? null,
      texture: item.texture ?? null,
      materialColour: item.materialColour
        ? this.config.matColourName(item.materialColour, lang)
        : null,
      materialColourHex: item.materialColour ? this.config.matColourHex(item.materialColour) : null,
      edgeColour: item.edgeColour ? this.config.edgeColourName(item.edgeColour, lang) : null,
      edgeColourHex: item.edgeColour ? this.config.edgeColourHex(item.edgeColour) : null,
      mounting: item.mounting ?? null,
      heelPad: item.heelPad ?? null,
      heelPadPrice: this.config.heelPadPrice((item.heelPad ?? 'none') as HeelPadAccessory),
      heelRest: item.heelRest ?? null,
      heelRestColour: this.config.heelRestColourLabelKey(item.heelRestColour ?? null),
      heelRestPrice: this.config.heelRestPrice((item.heelRest ?? 'none') as HeelRest),
      accessories: item.accessories ?? null,
      positions: item.kitPieces ?? [],
      deliveryTierKey: zones.size > 0 ? this.config.deliveryTierKey(zones) : null,
      deliveryCost: ship === 0 ? null : ship,
    };
  }

  protected readonly items = this.cart.items;
  protected readonly subtotal = this.cart.subtotal;
  protected readonly shipping = this.cart.shipping;
  protected readonly discount = this.cart.discount;
  protected readonly discountApplies = this.cart.discountApplies;
  protected readonly total = this.cart.total;
  protected readonly isAuthenticated = this.auth.isAuthenticated;

  protected readonly authOpen = signal(false);
  protected readonly paymentOpen = signal(false);
  private readonly pendingAction = signal<'pay' | 'manager' | null>(null);
  /** Guards the checkout call so a double-click can't create a duplicate order. */
  protected readonly checkingOut = signal(false);

  protected inc(item: CartItem): void {
    this.cart.updateQuantity(item.id, item.quantity + 1);
  }
  protected dec(item: CartItem): void {
    this.cart.updateQuantity(item.id, item.quantity - 1);
  }
  protected removeItem(item: CartItem): void {
    // Service-level guard ignores re-entry; the button is also disabled meanwhile.
    void this.cart.remove(item.id);
  }

  protected payNow(): void {
    if (this.items().length === 0) return;
    if (!this.isAuthenticated()) {
      this.pendingAction.set('pay');
      this.authOpen.set(true);
      return;
    }
    this.paymentOpen.set(true);
  }

  protected contactManager(): void {
    if (this.items().length === 0) return;
    if (!this.isAuthenticated()) {
      this.pendingAction.set('manager');
      this.authOpen.set(true);
      return;
    }
    void this.runCheckout('contact_manager');
  }

  protected onAuthenticated(): void {
    const pending = this.pendingAction();
    this.pendingAction.set(null);
    if (pending === 'pay') this.paymentOpen.set(true);
    else if (pending === 'manager') void this.runCheckout('contact_manager');
  }

  protected onPaymentSelected(method: PaymentMethod): void {
    void this.runCheckout(method);
  }

  private async runCheckout(method: PaymentMethod): Promise<void> {
    if (this.checkingOut()) return; // double-click / re-entry guard
    this.checkingOut.set(true);
    try {
      await this.checkout.complete({
        items: this.items(),
        subtotal: this.subtotal(),
        shipping: this.shipping(),
        method,
        clearCart: true,
      });
    } finally {
      this.checkingOut.set(false);
    }
  }
}
