/*
 * EN: Account dashboard (protected by authGuard). Greets the user, lists their
 *     order history from OrderService with a status badge per order
 *     (Pending / Pending contact / In production / Shipped / Delivered) and shows
 *     the profile (name, email, phone, address) with edit / change-password /
 *     delete-account actions and a logout action. Delete is confirmed via a dialog.
 * RU: Панель аккаунта (под authGuard). Приветствует пользователя, показывает
 *     историю заказов из OrderService с бейджем статуса на заказ
 *     (Ожидает / Ожидает контакта / В производстве / Отправлен / Доставлен) и
 *     профиль (имя, e-mail, телефон, адрес) с действиями редактирования /
 *     смены пароля / удаления аккаунта и выходом. Удаление — через диалог.
 */
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslationService } from '@core/i18n/translation.service';
import type { OrderRecord, OrderStatus, PaymentMethod } from '@core/models/order.model';
import { AuthService } from '@core/services/auth.service';
import { OrderService } from '@core/services/order.service';
import { ConfiguratorService } from '@features/configurator/configurator.service';
import {
  LucideCheck,
  LucideCopy,
  LucideCreditCard,
  LucidePackage,
  LucideShoppingBag,
  LucideStore,
} from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'nm-account-page',
  imports: [
    DatePipe,
    RouterLink,
    ButtonDirective,
    SkeletonComponent,
    TranslatePipe,
    EuroPipe,
    LucideCreditCard,
    LucideShoppingBag,
    LucidePackage,
    LucideStore,
    LucideCopy,
    LucideCheck,
  ],
  // Fill the account content column so the card's lg:max-w-[80%] is meaningful.
  host: { '[style.display]': '"flex"', '[style.width]': '"100%"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly config = inject(ConfiguratorService);
  private readonly translation = inject(TranslationService);
  protected readonly orders = inject(OrderService);

  protected readonly user = this.auth.user;
  protected readonly orderList = this.orders.orders;

  /** Localized mat/edge colour names for a configured order line (falls back to the id). */
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

  /**
   * Values (order IDs / SKUs) currently showing the "copied" checkmark. Keyed by
   * the copied text so each button — there can be many SKUs per order — flips
   * back independently after its own 1.5s timer.
   */
  private readonly copied = signal(new Set<string>());

  /** Whether `text`'s copy button should currently render the checkmark. */
  protected isCopied(text: string): boolean {
    return this.copied().has(text);
  }

  /** Copy `text` to the clipboard, toast `successKey`, and flash a checkmark. */
  protected copyToClipboard(text: string, successKey: string): void {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.copied.update(set => new Set(set).add(text));
        this.toast.success(successKey);
        setTimeout(() => {
          this.copied.update(set => {
            const next = new Set(set);
            next.delete(text);
            return next;
          });
        }, 1500);
      })
      .catch(() => {
        this.toast.error('error_generic');
      });
  }

  /** Badge colour classes per order status (matches the spec's status palette). */
  protected statusBadgeClasses(status: OrderStatus): string {
    switch (status) {
      case 'review':
        return 'bg-chrome-light text-ink';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'in_production':
        return 'bg-info/20 text-info';
      case 'shipped':
        return 'bg-primary/20 text-primary';
      case 'delivered':
        return 'bg-success/20 text-success';
      case 'completed':
        return 'bg-success text-white';
      case 'cancelled':
        return 'bg-error/20 text-error';
    }
  }

  /**
   * Total quantity across all line items in an order — the sum of each line's
   * `quantity`, NOT the number of line items. A single line with quantity 10 is
   * "10 items", not "1".
   */
  protected totalQuantity(order: OrderRecord): number {
    return order.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  }

  /** Translation key for an order's payment method label (icon picked in template). */
  protected paymentKey(method: PaymentMethod): string {
    switch (method) {
      case 'stripe_card':
        return 'order_payment_card';
      case 'klarna':
        return 'order_payment_klarna';
      case 'paypal':
        return 'order_payment_paypal';
      case 'contact_manager':
      default:
        return 'order_payment_pickup';
    }
  }
}
