/*
 * EN: Home payment & delivery section — four columns (online pay, cash on
 *     delivery, pickup, shipping) with icons and decorative connectors. Static.
 * RU: Секция оплаты и доставки главной — четыре колонки (онлайн-оплата, наложка,
 *     самовывоз, доставка) с иконками и декоративными коннекторами. Статика.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideCreditCard, LucideMapPin, LucidePackage, LucideTruck } from '@lucide/angular';
import { RevealOnScrollDirective } from '@shared/directives/reveal-on-scroll.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

@Component({
  selector: 'nm-home-payment-delivery',
  imports: [
    TranslatePipe,
    RevealOnScrollDirective,
    LucideCreditCard,
    LucidePackage,
    LucideMapPin,
    LucideTruck,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-delivery.component.html',
  styleUrl: './payment-delivery.component.scss',
})
export class PaymentDeliveryComponent {}
