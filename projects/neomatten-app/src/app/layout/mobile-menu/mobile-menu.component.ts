/*
 * EN: Mobile navigation menu. Wraps the shared Sheet (slide-in drawer) and shows
 *     a brand header, the primary nav links, an account section (login/register
 *     or My Account + greeting), a cart link with a live badge, and the language
 *     switcher. Auth state + cart count come from AuthService / CartService.
 *     Closes on link click.
 * RU: Мобильное меню навигации. Оборачивает общий Sheet (выезжающая панель) и
 *     показывает шапку бренда, основные ссылки, секцию аккаунта (вход/регистрация
 *     или «Мой аккаунт» + приветствие), ссылку корзины с живым бейджем и
 *     переключатель языка. Состояние авторизации и счётчик корзины — из
 *     AuthService / CartService. Закрывается по клику.
 */
import { isPlatformBrowser, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  model,
  PLATFORM_ID,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CartService } from '@core/services/cart.service';
import { ScrollService } from '@core/services/scroll.service';
import { LucideShoppingCart, LucideUser } from '@lucide/angular';
import { LanguageSwitcherComponent } from '@shared/components/language-switcher/language-switcher.component';
import { SheetComponent } from '@shared/components/sheet/sheet.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { fromEvent, map } from 'rxjs';

import { type NavLink, PRIMARY_NAV } from '../navigation';

/** At/above this width the mobile menu auto-closes (matches Tailwind `lg`). */
const DESKTOP_BREAKPOINT = 1024;

@Component({
  selector: 'nm-mobile-menu',
  imports: [
    NgOptimizedImage,
    RouterLink,
    RouterLinkActive,
    SheetComponent,
    LanguageSwitcherComponent,
    TranslatePipe,
    LucideUser,
    LucideShoppingCart,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobile-menu.component.html',
  styleUrl: './mobile-menu.component.scss',
})
export class MobileMenuComponent {
  private readonly scroll = inject(ScrollService);
  private readonly auth = inject(AuthService);
  private readonly cart = inject(CartService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Two-way open state (controlled by the header burger button). */
  readonly open = model<boolean>(false);

  protected readonly links = PRIMARY_NAV;
  protected readonly user = this.auth.user;
  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly cartCount = this.cart.count;

  /** True once the viewport reaches the desktop breakpoint; drives auto-close. */
  private readonly isDesktop = this.isBrowser
    ? toSignal(
        fromEvent(window, 'resize').pipe(
          takeUntilDestroyed(),
          map(() => window.innerWidth >= DESKTOP_BREAKPOINT)
        ),
        { initialValue: window.innerWidth >= DESKTOP_BREAKPOINT }
      )
    : undefined;

  constructor() {
    // Auto-close when the viewport grows past the desktop breakpoint (the burger
    // is hidden at lg, so an open menu would otherwise be stranded).
    effect(() => {
      if (this.isDesktop?.() && this.open()) {
        this.open.set(false);
      }
    });
  }

  protected close(): void {
    this.open.set(false);
  }

  /** Closes the menu, then scrolls to a home-page section (no hash in the URL). */
  protected goToSection(link: NavLink): void {
    this.close();
    if (link.sectionId) {
      void this.scroll.scrollToSection(link.path, link.sectionId);
    }
  }
}
