/*
 * EN: Social-login block — an "Or continue with" divider above Google + Facebook
 *     buttons. Each button does a full-page redirect to the backend OAuth start
 *     endpoint (GET /api/auth/google | /facebook); the backend runs the provider
 *     handshake and redirects back to /auth/callback with a one-time code (see
 *     AuthCallbackPageComponent). The Facebook mark keeps its single brand blue
 *     via nm-brand-icon; Google uses its official 4-colour glyph inlined below.
 * RU: Блок входа через соцсети — разделитель «Oder weiter mit» над кнопками Google
 *     и Facebook. Каждая кнопка делает полностраничный редирект на бэкенд-эндпоинт
 *     OAuth (GET /api/auth/google | /facebook); бэкенд выполняет обмен с провайдером
 *     и возвращает на /auth/callback с одноразовым кодом (см. AuthCallbackPageComponent).
 *     Логотип Facebook — фирменный синий через nm-brand-icon; Google — 4-цветный глиф.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { environment } from '@env/environment';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { siFacebook } from 'simple-icons';

@Component({
  selector: 'nm-social-login',
  imports: [BrandIconComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-login.component.html',
})
export class SocialLoginComponent {
  protected readonly facebook = siFacebook;

  /** Backend origin (e.g. http://localhost:5000); OAuth routes live under /api. */
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, '');

  protected loginWithGoogle(): void {
    this.startOAuth('google');
  }

  protected loginWithFacebook(): void {
    this.startOAuth('facebook');
  }

  /** Full-page redirect to the backend OAuth start endpoint. */
  private startOAuth(provider: 'google' | 'facebook'): void {
    window.location.href = `${this.apiBase}/api/auth/${provider}`;
  }
}
