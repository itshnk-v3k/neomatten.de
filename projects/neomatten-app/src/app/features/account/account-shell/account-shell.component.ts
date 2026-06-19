/*
 * EN: Account area shell. Layout wrapper for all authenticated /account child
 *     routes (orders, profile, password). Renders a breadcrumb plus navigation
 *     and a <router-outlet>: a sticky left sidebar (~240px) on lg+, a horizontal
 *     scrollable tab bar below lg. Sign-out lives on the profile page, not here.
 * RU: Оболочка раздела аккаунта. Лейаут-обёртка для всех защищённых дочерних
 *     маршрутов /account (заказы, профиль, пароль). Показывает крошки, навигацию
 *     и <router-outlet>: закреплённый левый сайдбар (~240px) на lg+, горизонтальную
 *     прокручиваемую панель вкладок ниже lg. Выход — на странице профиля, не здесь.
 */
import { isPlatformBrowser } from '@angular/common';
import type { AfterViewInit, ElementRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  PLATFORM_ID,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideLock, LucidePackage, LucideUser } from '@lucide/angular';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { filter } from 'rxjs';

interface AccountNavItem {
  readonly key: string;
  readonly path: string;
  readonly icon: 'orders' | 'profile' | 'password';
  /** Orders (/account) matches exactly so it isn't active on child routes. */
  readonly exact: boolean;
}

@Component({
  selector: 'nm-account-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    BreadcrumbComponent,
    TranslatePipe,
    LucidePackage,
    LucideUser,
    LucideLock,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './account-shell.component.html',
  styleUrl: './account-shell.component.scss',
})
export class AccountShellComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Mobile tab bar container + its tab anchors, for scroll-active-into-view. */
  private readonly tabBar = viewChild<ElementRef<HTMLElement>>('mobileTabBar');
  private readonly tabs = viewChildren<ElementRef<HTMLElement>>('mobileTab');

  protected readonly navItems: readonly AccountNavItem[] = [
    { key: 'account_nav_orders', path: '/account', icon: 'orders', exact: true },
    { key: 'account_nav_profile', path: '/account/profile', icon: 'profile', exact: false },
    { key: 'account_nav_password', path: '/account/password', icon: 'password', exact: false },
  ];

  constructor() {
    // Keep the active tab visible in the scrollable mobile bar on every route change.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => this.scrollActiveIntoView());
  }

  ngAfterViewInit(): void {
    this.scrollActiveIntoView();
  }

  /** Smoothly scrolls the active mobile tab into the visible part of the bar. */
  private scrollActiveIntoView(): void {
    if (!this.isBrowser) {
      return;
    }
    requestAnimationFrame(() => {
      const activeTab = this.tabs().find(tab =>
        tab.nativeElement.classList.contains('is-active-tab')
      );
      const container = this.tabBar()?.nativeElement;
      if (!activeTab || !container) {
        return;
      }
      container.scrollTo({ left: activeTab.nativeElement.offsetLeft - 20, behavior: 'smooth' });
    });
  }
}
