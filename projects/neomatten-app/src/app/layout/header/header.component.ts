/*
 * EN: Site header — brand monogram, primary navigation (active link marked
 *     aria-current), language switcher, click-to-call, account and cart actions
 *     (cart badge from CartService), and a burger that opens the mobile menu.
 *     Sits in normal flow at the top of the page and becomes sticky (with a
 *     shadow) once the page is scrolled. Section links scroll via ScrollService.
 * RU: Хедер сайта — монограмма бренда, основная навигация (активная ссылка с
 *     aria-current), переключатель языка, кнопка звонка, действия аккаунта и
 *     корзины (бейдж из CartService) и бургер, открывающий мобильное меню.
 *     В обычном потоке вверху страницы и становится закреплённым (с тенью) при
 *     прокрутке. Ссылки на секции прокручивают через ScrollService.
 */
import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  NgZone,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { COMPANY_INFO, COMPANY_PHONE_HREF } from '@core/config/company-info';
import { CartService } from '@core/services/cart.service';
import { ScrollService } from '@core/services/scroll.service';
import { LucideMenu, LucidePhone, LucideShoppingCart, LucideUser } from '@lucide/angular';
import { LanguageSwitcherComponent } from '@shared/components/language-switcher/language-switcher.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { fromEvent } from 'rxjs';

import { MobileMenuComponent } from '../mobile-menu/mobile-menu.component';
import { type NavLink, PRIMARY_NAV } from '../navigation';

@Component({
  selector: 'nm-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgOptimizedImage,
    LucideMenu,
    LucideUser,
    LucideShoppingCart,
    LucidePhone,
    LanguageSwitcherComponent,
    MobileMenuComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The HOST element carries the position so sticky resolves against the shell's
  // full-height flex column (its containing block), not the short inner <header>.
  // At top: relative (scrolls away with the page). Scrolled past: sticky top-0.
  host: {
    '[class.relative]': '!scrolled()',
    '[class.sticky]': 'scrolled()',
    '[class.top-0]': 'scrolled()',
    '[class.z-header]': 'scrolled()',
  },
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly cart = inject(CartService);
  private readonly scroll = inject(ScrollService);
  private readonly zone = inject(NgZone);

  protected readonly links = PRIMARY_NAV;
  protected readonly cartCount = this.cart.count;
  protected readonly phone = COMPANY_INFO.phone;
  protected readonly phoneHref = COMPANY_PHONE_HREF;

  /** Mobile menu open state, toggled by the burger button. */
  protected readonly mobileMenuOpen = signal(false);

  /** True once the page is scrolled away from the top — drives the sticky state. */
  protected readonly scrolled = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);
    // Listen outside Angular to avoid a change-detection pass per scroll event;
    // the signal write below still schedules CD only when the boolean flips.
    this.zone.runOutsideAngular(() => {
      this.updateScrolled();
      fromEvent(window, 'scroll', { passive: true })
        .pipe(takeUntilDestroyed(destroyRef))
        .subscribe(() => this.updateScrolled());
    });
  }

  /** Scrolls to a home-page section (navigating home first if needed). */
  protected goToSection(link: NavLink): void {
    if (link.sectionId) {
      void this.scroll.scrollToSection(link.path, link.sectionId);
    }
  }

  private updateScrolled(): void {
    this.scrolled.set(window.scrollY > 4);
  }
}
