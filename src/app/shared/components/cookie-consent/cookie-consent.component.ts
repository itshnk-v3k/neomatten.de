/*
 * EN: Cookie-consent bar. On first visit (no stored choice) a fixed bottom bar
 *     offers Accept / Decline; the choice is persisted to localStorage so the bar
 *     never shows again. Mounted globally in the ShellComponent.
 * RU: Полоса согласия на cookie. При первом визите (нет сохранённого выбора)
 *     внизу появляется фиксированная полоса с кнопками «Принять» / «Отклонить»;
 *     выбор сохраняется в localStorage, чтобы полоса больше не показывалась.
 *     Монтируется глобально в ShellComponent.
 */
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
  /** Shown only until the visitor makes (and persists) a choice. */
  protected readonly visible = signal<boolean>(this.readConsent() === null);

  protected accept(): void {
    this.persist('accepted');
    // TODO(backend): consent = 'accepted' → initialize analytics / tracking.
  }

  protected decline(): void {
    this.persist('declined');
    // TODO(backend): consent = 'declined' → skip analytics, drop non-essential cookies.
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
