/*
 * EN: Global "Order confirmed!" dialog shown after a successful online payment.
 *     Watches CheckoutService.confirmedOrder; when set it shows the order id,
 *     a 2–3 business-day manufacturing notice and a CTA to the account orders.
 *     Mounted once in the shell so it survives the post-checkout navigation to
 *     /account.
 * RU: Глобальный диалог «Bestellung bestätigt!» после успешной онлайн-оплаты.
 *     Следит за CheckoutService.confirmedOrder; при наличии показывает номер
 *     заказа, уведомление о 2–3 рабочих днях изготовления и кнопку перехода к
 *     заказам. Монтируется один раз в оболочке, чтобы пережить переход на /account.
 */
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CheckoutService } from '@core/services/checkout.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-order-confirmed-dialog',
  imports: [DialogComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-confirmed-dialog.component.html',
})
export class OrderConfirmedDialogComponent {
  private readonly checkout = inject(CheckoutService);
  private readonly router = inject(Router);

  protected readonly order = this.checkout.confirmedOrder;
  protected readonly open = computed(() => this.order() !== null);

  /** Closing clears the confirmed order so the dialog won't re-open. */
  protected onOpenChange(open: boolean): void {
    if (!open) {
      this.checkout.dismissConfirmation();
    }
  }

  protected viewOrders(): void {
    this.checkout.dismissConfirmation();
    void this.router.navigate(['/account']);
  }
}
