/*
 * EN: Social-login block — an "Or continue with" divider above Google + Facebook
 *     buttons. Calls the mock AuthService social-login methods, toasts on success
 *     and emits `authenticated` so the host (login/register page or auth dialog)
 *     can navigate or close. Brand marks come from simple-icons via nm-brand-icon.
 * RU: Блок входа через соцсети — разделитель «Oder weiter mit» над кнопками Google
 *     и Facebook. Вызывает мок-методы AuthService, показывает тост при успехе и
 *     эмитит `authenticated`, чтобы хост (страница входа/регистрации или диалог)
 *     выполнил переход или закрытие. Логотипы — из simple-icons через nm-brand-icon.
 */
import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { siFacebook, siGoogle } from 'simple-icons';

@Component({
  selector: 'nm-social-login',
  imports: [BrandIconComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-login.component.html',
})
export class SocialLoginComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** Emitted after a successful social login (host navigates / closes). */
  readonly authenticated = output<void>();

  protected readonly google = siGoogle;
  protected readonly facebook = siFacebook;

  /** Disables both buttons while a social login is in flight. */
  protected readonly pending = signal(false);

  protected loginWithGoogle(): void {
    void this.run(() => this.auth.loginWithGoogle());
  }

  protected loginWithFacebook(): void {
    void this.run(() => this.auth.loginWithFacebook());
  }

  private async run(action: () => Promise<unknown>): Promise<void> {
    if (this.pending()) return;
    this.pending.set(true);
    try {
      await action();
      this.toast.success('auth_login_success');
      this.authenticated.emit();
    } catch {
      this.toast.error('auth_error_generic');
    } finally {
      this.pending.set(false);
    }
  }
}
