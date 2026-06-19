/*
 * EN: Auth dialog — a thin nm-dialog host around the shared nm-auth-form (the
 *     same sign-in / register card the account pages use). On success it closes
 *     and emits `authenticated`, so a host (cart / configurator CTAs) can replay
 *     the action the user originally tried. Backed by the mock AuthService.
 * RU: Диалог авторизации — тонкий хост nm-dialog вокруг общей nm-auth-form (той же
 *     карточки входа / регистрации, что и страницы аккаунта). При успехе
 *     закрывается и эмитит `authenticated`, чтобы хост (CTA корзины /
 *     конфигуратора) повторил исходное действие. Работает на мок-сервисе AuthService.
 */
import { ChangeDetectionStrategy, Component, model, output, signal } from '@angular/core';
import { AuthFormComponent, type AuthMode } from '@shared/components/auth-form/auth-form.component';
import { DialogComponent } from '@shared/components/dialog/dialog.component';

@Component({
  selector: 'nm-auth-dialog',
  imports: [DialogComponent, AuthFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-dialog.component.html',
})
export class AuthDialogComponent {
  /** Two-way open state. */
  readonly open = model<boolean>(false);
  /** Emitted after a successful login or registration. */
  readonly authenticated = output<void>();

  /** Active form inside the dialog; toggled in place by the bottom switch link. */
  protected readonly mode = signal<AuthMode>('login');

  protected onSucceeded(): void {
    this.open.set(false);
    this.authenticated.emit();
  }
}
