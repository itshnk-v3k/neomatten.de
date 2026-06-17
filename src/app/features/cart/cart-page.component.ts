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
import { ConfiguratorService } from '@features/configurator/configurator.service';
import { LucideCheck, LucideCopy, LucideMinus, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { AuthDialogComponent } from '@shared/components/auth-dialog/auth-dialog.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { PaymentDialogComponent } from '@shared/components/payment-dialog/payment-dialog.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'nm-cart-page',
  imports: [
    RouterLink,
    LucidePlus,
    LucideMinus,
    LucideTrash2,
    LucideCopy,
    LucideCheck,
    BreadcrumbComponent,
    ButtonDirective,
    AuthDialogComponent,
    PaymentDialogComponent,
    SkeletonComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
})
export class CartPageComponent {
  protected readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly auth = inject(AuthService);
  private readonly config = inject(ConfiguratorService);
  private readonly translation = inject(TranslationService);
  private readonly toast = inject(ToastService);

  /** Localized mat/edge colour names for a configured line (falls back to the id). */
  protected matColourName(id: string): string {
    return this.config.matColourName(id, this.translation.currentLanguage());
  }
  protected edgeColourName(id: string): string {
    return this.config.edgeColourName(id, this.translation.currentLanguage());
  }
  /** Hex values for the mat/edge colour swatches (falls back to '' if unknown). */
  protected matColourHex(id: string): string {
    return this.config.matColourHex(id);
  }
  protected edgeColourHex(id: string): string {
    return this.config.edgeColourHex(id);
  }

  /** SKUs currently flashing the "copied" checkmark; each flips back after 1.5s. */
  private readonly copiedSkus = signal(new Set<string>());

  protected isCopied(sku: string): boolean {
    return this.copiedSkus().has(sku);
  }

  /** Copy a line SKU to the clipboard, toast, and briefly show a checkmark. */
  protected copySku(sku: string): void {
    navigator.clipboard
      .writeText(sku)
      .then(() => {
        this.copiedSkus.update(set => new Set(set).add(sku));
        this.toast.success('order_copy_sku');
        setTimeout(() => {
          this.copiedSkus.update(set => {
            const next = new Set(set);
            next.delete(sku);
            return next;
          });
        }, 1500);
      })
      .catch(() => {
        this.toast.error('error_generic');
      });
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
