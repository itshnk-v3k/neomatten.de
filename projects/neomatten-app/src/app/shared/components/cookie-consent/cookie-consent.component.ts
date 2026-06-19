/*
 * EN: Cookie-consent bar. On first visit (no stored choice) a fixed bottom bar
 *     offers Accept / Decline; the choice is persisted to localStorage so the bar
 *     never shows again. Mounted globally in the ShellComponent.
 * RU: Полоса согласия на cookie. При первом визите (нет сохранённого выбора)
 *     внизу появляется фиксированная полоса с кнопками «Принять» / «Отклонить»;
 *     выбор сохраняется в localStorage, чтобы полоса больше не показывалась.
 *     Монтируется глобально в ShellComponent.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '@core/services/analytics.service';
import { LucideCookie } from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';

const COOKIE_CONSENT_KEY = 'neomatten_cookie_consent';

@Component({
  selector: 'nm-cookie-consent',
  imports: [RouterLink, ButtonDirective, TranslatePipe, LucideCookie],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cookie-consent.component.html',
})
export class CookieConsentComponent {
  private readonly analytics = inject(AnalyticsService);

  /** Shown only until the visitor makes (and persists) a choice. */
  protected readonly visible = signal<boolean>(this.readConsent() === null);

  protected accept(): void {
    this.persist('accepted');
    // Grant GA4 consent and send the initial page view.
    this.analytics.onConsentAccepted();
  }

  protected decline(): void {
    this.persist('declined');
    // Keep GA4 in denied mode; no analytics/non-essential cookies.
    this.analytics.onConsentDeclined();
  }

  private persist(choice: 'accepted' | 'declined'): void {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    } catch {
      // ignore storage errors
    }
    this.visible.set(false);
  }

  private readConsent(): string | null {
    try {
      return localStorage.getItem(COOKIE_CONSENT_KEY);
    } catch {
      return null;
    }
  }
}
