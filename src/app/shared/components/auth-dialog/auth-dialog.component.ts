/*
 * EN: Auth dialog — an nm-dialog with login / register tabs (Reactive Forms,
 *     shared input kit). On success it closes and emits `authenticated`, so a
 *     host (cart / configurator CTAs) can replay the action the user originally
 *     tried. Backed by the mock AuthService.
 * RU: Диалог авторизации — nm-dialog с вкладками вход / регистрация (Reactive
 *     Forms, общий набор полей). При успехе закрывается и эмитит `authenticated`,
 *     чтобы хост (CTA корзины / конфигуратора) повторил исходное действие
 *     пользователя. Работает на мок-сервисе AuthService.
 */
import { ChangeDetectionStrategy, Component, inject, model, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SocialLoginComponent } from '@shared/components/social-login/social-login.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { phoneValidator } from '@shared/validators/phone.validator';

type Mode = 'login' | 'register';

@Component({
  selector: 'nm-auth-dialog',
  imports: [
    ReactiveFormsModule,
    DialogComponent,
    InputComponent,
    PhoneInputComponent,
    ButtonDirective,
    SocialLoginComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-dialog.component.html',
})
export class AuthDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** Two-way open state. */
  readonly open = model<boolean>(false);
  /** Emitted after a successful login or registration. */
  readonly authenticated = output<void>();

  protected readonly mode = signal<Mode>('login');
  protected readonly submitting = signal(false);

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator()],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
  }

  /** Social login already signed the user in — close and replay the host action. */
  protected onSocialAuth(): void {
    this.open.set(false);
    this.loginForm.reset();
    this.registerForm.reset();
    this.authenticated.emit();
  }

  protected async submitLogin(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    await this.run(() => this.auth.login(this.loginForm.getRawValue()), 'auth_login_success');
  }

  protected async submitRegister(): Promise<void> {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    await this.run(
      () => this.auth.register(this.registerForm.getRawValue()),
      'auth_register_success'
    );
  }

  private async run(action: () => Promise<unknown>, successKey: string): Promise<void> {
    this.submitting.set(true);
    try {
      await action();
      this.toast.success(successKey);
      this.open.set(false);
      this.loginForm.reset();
      this.registerForm.reset();
      this.authenticated.emit();
    } catch (error) {
      const key = error instanceof Error ? error.message : 'auth_error_generic';
      this.toast.error(key);
    } finally {
      this.submitting.set(false);
    }
  }
}
