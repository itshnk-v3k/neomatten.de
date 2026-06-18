/*
 * EN: Payment-method selector — an nm-dialog with three radio-style options: Card
 *     (Visa/Mastercard via Stripe), Klarna and PayPal, each shown with its
 *     simple-icons brand logo. Exactly one is selectable at a time; a sticky
 *     "Confirm payment" footer button (disabled until a method is picked) emits
 *     the choice and closes. The host runs CheckoutService.complete() with it.
 * RU: Выбор способа оплаты — nm-dialog с тремя вариантами в стиле радио: Карта
 *     (Visa/Mastercard через Stripe), Klarna и PayPal, каждый с логотипом из
 *     simple-icons. Одновременно выбирается ровно один; закреплённая кнопка
 *     «Jetzt bezahlen» (неактивна, пока способ не выбран) эмитит выбор и закрывает.
 *     Хост вызывает CheckoutService.complete() с выбранным способом.
 */
import { ChangeDetectionStrategy, Component, input, model, output, signal } from '@angular/core';
import type { PaymentMethod } from '@core/models/order.model';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { EuroPipe } from '@shared/pipes/euro.pipe';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { siKlarna, siMastercard, siPaypal, siVisa } from 'simple-icons';

@Component({
  selector: 'nm-payment-dialog',
  imports: [DialogComponent, BrandIconComponent, ButtonDirective, TranslatePipe, EuroPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-dialog.component.html',
})
export class PaymentDialogComponent {
  readonly open = model<boolean>(false);
  /** Amount to pay (EUR), shown for confirmation. */
  readonly amount = model<number>(0);
  /**
   * True while the host processes the payment (e.g. Stripe). Drives the confirm
   * button's loading state and disables interaction; the host closes/navigates
   * the dialog on success and resets this on failure.
   */
  readonly processing = input<boolean>(false);
  /** Emitted with the chosen payment method on confirm. */
  readonly selected = output<PaymentMethod>();

  /** Currently highlighted method (radio group); null until the user picks one. */
  protected readonly method = signal<PaymentMethod | null>(null);

  protected readonly visa = siVisa;
  protected readonly mastercard = siMastercard;
  protected readonly klarna = siKlarna;
  protected readonly paypal = siPaypal;

  /** Selectable options (card shows Visa + Mastercard; others a single brand). */
  protected readonly options: readonly { method: PaymentMethod; labelKey: string }[] = [
    { method: 'stripe_card', labelKey: 'payment_method_card' },
    { method: 'klarna', labelKey: 'payment_method_klarna' },
    { method: 'paypal', labelKey: 'payment_method_paypal' },
  ];

  protected select(method: PaymentMethod): void {
    this.method.set(method);
  }

  /**
   * Confirms the highlighted method: emits it for the host to process. The dialog
   * stays open (showing the loading state) while `processing` is true; the host
   * closes/navigates on success or resets `processing` on failure.
   */
  protected confirm(): void {
    const method = this.method();
    if (!method || this.processing()) {
      return;
    }
    this.selected.emit(method);
  }
}
