/*
 * Admin header — burger (mobile drawer toggle), the current page title, and the
 * signed-in admin's email with a logout button. The title is derived from the
 * active route; the email comes from AdminAuthService.
 */
import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { LucideLogOut, LucideMenu } from '@lucide/angular';
import { filter, map } from 'rxjs';

import { AdminAuthService } from '../../core/auth/admin-auth.service';
import { AdminI18nService } from '../../core/i18n/admin-i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { pageTitleKeyFor } from '../navigation';

@Component({
  selector: 'na-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideMenu, LucideLogOut, LanguageSwitcherComponent, TranslatePipe],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(AdminI18nService);

  /** Emitted when the burger is tapped (opens the mobile sidebar drawer). */
  readonly toggleSidebar = output<void>();

  /** Signed-in admin's email, or empty while the profile loads. */
  readonly email = computed(() => this.auth.currentUser()?.email ?? '');

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  /** Page title derived from the active route (reactive to the UI language). */
  readonly title = computed(() => this.i18n.t(pageTitleKeyFor(this.currentUrl())));

  logout(): void {
    this.auth.logout();
  }
}
