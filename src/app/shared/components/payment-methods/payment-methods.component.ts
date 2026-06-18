/*
 * EN: Accepted-payment-methods row — a horizontal strip of small rounded badges
 *     with colored brand marks (Visa, Mastercard, PayPal, Klarna, Stripe) plus a
 *     "pay on pickup" badge (lucide Store in primary). Brand marks come from
 *     simple-icons via nm-brand-icon: brand-coloured where they read on white
 *     (Visa/Mastercard/PayPal/Stripe); Klarna is its dark wordmark on its pink
 *     badge so it stays legible. White/light badge backgrounds keep every mark
 *     visible on both light and dark surfaces (e.g. the dark footer).
 * RU: Ряд принимаемых способов оплаты — горизонтальная лента маленьких бейджей с
 *     цветными марками брендов (Visa, Mastercard, PayPal, Klarna, Stripe) плюс
 *     бейдж «оплата при получении» (иконка Store в основном цвете). Марки — из
 *     simple-icons через nm-brand-icon. Светлый фон бейджей сохраняет читаемость
 *     на светлых и тёмных поверхностях.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LucideStore } from '@lucide/angular';
import {
  type BrandIcon,
  BrandIconComponent,
} from '@shared/components/brand-icon/brand-icon.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
// Per-icon, tree-shakeable named imports from simple-icons (CC0 brand marks).
import { siKlarna, siMastercard, siPaypal, siStripe, siVisa } from 'simple-icons';

interface PaymentBrand {
  /** Brand name (not translated) — used as the badge's accessible label/title. */
  readonly label: string;
  readonly icon: BrandIcon;
  /** True → render in the simple-icons brand hex (reads on a white badge). */
  readonly colored: boolean;
  /** Explicit icon colour when not `colored` (Klarna's dark wordmark on pink). */
  readonly iconColor?: string;
  /** Badge background utility (defaults to white; Klarna gets its pink). */
  readonly badgeClass: string;
}

@Component({
  selector: 'nm-payment-methods',
  imports: [BrandIconComponent, TranslatePipe, LucideStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './payment-methods.component.html',
})
export class PaymentMethodsComponent {
  /** Brands in the order requested: Visa → Mastercard → PayPal → Klarna → Stripe. */
  protected readonly brands: readonly PaymentBrand[] = [
    { label: 'Visa', icon: siVisa, colored: true, badgeClass: 'bg-white' },
    { label: 'Mastercard', icon: siMastercard, colored: true, badgeClass: 'bg-white' },
    { label: 'PayPal', icon: siPaypal, colored: true, badgeClass: 'bg-white' },
    // Klarna's brand hex is pink (invisible on white) → dark wordmark on a pink badge.
    {
      label: 'Klarna',
      icon: siKlarna,
      colored: false,
      iconColor: '#17120E',
      badgeClass: 'bg-[#FFB3C7]',
    },
    { label: 'Stripe', icon: siStripe, colored: true, badgeClass: 'bg-white' },
  ];
}
