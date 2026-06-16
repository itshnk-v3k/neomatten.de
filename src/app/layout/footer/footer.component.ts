/*
 * EN: Site footer. Dark, responsive footer with brand/social, navigation,
 *     legal links, contact details, opening hours and payment methods, plus a
 *     copyright bottom bar. Consumes shared nav constants and company info.
 * RU: Подвал сайта. Тёмный адаптивный футер с брендом/соцсетями, навигацией,
 *     юридическими ссылками, контактами, часами работы и способами оплаты, плюс
 *     нижняя строка с копирайтом. Использует общие константы навигации и данные компании.
 */
import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { COMPANY_INFO, COMPANY_MAPS_URL, COMPANY_PHONE_HREF } from '@core/config/company-info';
import { ScrollService } from '@core/services/scroll.service';
import { FOOTER_LEGAL, FOOTER_NAV, type NavLink } from '@layout/navigation';
import { LucideMail, LucideMapPin, LucidePhone, LucideStore } from '@lucide/angular';
import {
  type BrandIcon,
  BrandIconComponent,
} from '@shared/components/brand-icon/brand-icon.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
// Per-icon, tree-shakeable named imports from simple-icons (CC0 brand marks).
import {
  siInstagram,
  siKlarna,
  siMastercard,
  siPaypal,
  siTelegram,
  siTiktok,
  siVisa,
  siWhatsapp,
} from 'simple-icons';

@Component({
  selector: 'nm-footer',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    BrandIconComponent,
    TranslatePipe,
    LucideMapPin,
    LucidePhone,
    LucideMail,
    LucideStore,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  private readonly scroll = inject(ScrollService);

  protected readonly company = COMPANY_INFO;
  protected readonly phoneHref = COMPANY_PHONE_HREF;
  protected readonly mapsUrl = COMPANY_MAPS_URL;
  protected readonly nav = FOOTER_NAV;
  protected readonly legal = FOOTER_LEGAL;

  /** Scrolls to a home-page section (navigating home first if needed). */
  protected goToSection(link: NavLink): void {
    if (link.sectionId) {
      void this.scroll.scrollToSection(link.path, link.sectionId);
    }
  }

  /** Brand logos for the social links, keyed by `COMPANY_INFO.social[].id`. */
  protected readonly socialIcons: Record<string, BrandIcon> = {
    instagram: siInstagram,
    tiktok: siTiktok,
    telegram: siTelegram,
    whatsapp: siWhatsapp,
  };
  /** Current year, computed once on init (interpolated into the copyright line). */
  protected readonly currentYear = new Date().getFullYear();

  /** Brand payment marks rendered as pills (brand names are not translated). */
  protected readonly paymentBrands: readonly { icon: BrandIcon; label: string }[] = [
    { icon: siVisa, label: 'Visa' },
    { icon: siMastercard, label: 'Mastercard' },
    { icon: siPaypal, label: 'PayPal' },
    { icon: siKlarna, label: 'Klarna' },
  ];
}
