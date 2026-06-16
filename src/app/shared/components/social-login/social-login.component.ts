/*
 * EN: Social-login block — an "Or continue with" divider above Google + Facebook
 *     buttons. Real OAuth needs a backend + provider credentials, so until that
 *     lands the buttons only surface an informational toast (no mock user is
 *     created and the user is NOT logged in). The Facebook mark keeps its single
 *     brand blue via nm-brand-icon; Google uses its official 4-colour glyph
 *     inlined in the template.
 * RU: Блок входа через соцсети — разделитель «Oder weiter mit» над кнопками Google
 *     и Facebook. Реальный OAuth требует бэкенда и учётных данных провайдера,
 *     поэтому до этого кнопки лишь показывают информационный тост (мок-пользователь
 *     не создаётся, вход не выполняется). Логотип Facebook — фирменный синий через
 *     nm-brand-icon; Google — официальный 4-цветный глиф прямо в шаблоне.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { BrandIconComponent } from '@shared/components/brand-icon/brand-icon.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { siFacebook } from 'simple-icons';

@Component({
  selector: 'nm-social-login',
  imports: [BrandIconComponent, ButtonDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './social-login.component.html',
})
export class SocialLoginComponent {
  private readonly toast = inject(ToastService);

  protected readonly facebook = siFacebook;

  protected loginWithGoogle(): void {
    this.toast.info('auth_social_coming_soon');
  }

  protected loginWithFacebook(): void {
    this.toast.info('auth_social_coming_soon');
  }
}
