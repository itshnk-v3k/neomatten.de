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
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LucideShieldAlert } from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SocialLoginComponent } from '@shared/components/social-login/social-login.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { phoneValidator } from '@shared/validators/phone.validator';
import { interval } from 'rxjs';

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
    LucideShieldAlert,
    RouterLink,
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

  /** Remaining brute-force lockout in ms (0 = not locked); ticks every second. */
  protected readonly remainingLockoutMs = signal(this.auth.getLockoutState().remainingMs);
  protected readonly locked = computed(() => this.remainingLockoutMs() > 0);
  /** mm:ss countdown shown in the lockout UI. */
  protected readonly lockoutCountdown = computed(() => {
    const ms = this.remainingLockoutMs();
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  });

  constructor() {
    // Tick the lockout countdown while locked; the login tab reverts to the form
    // once getLockoutState() reports the window has expired.
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.remainingLockoutMs.set(this.auth.getLockoutState().remainingMs));
  }

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

  protected async submitLogin(): Promise<void> {
    if (this.locked()) {
      return;
    }
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    try {
      await this.auth.login(this.loginForm.getRawValue());
      this.auth.clearFailedAttempts();
      this.remainingLockoutMs.set(0);
      this.toast.success('auth_login_success');
      this.open.set(false);
      this.loginForm.reset();
      this.registerForm.reset();
      this.authenticated.emit();
    } catch (error) {
      this.auth.recordFailedAttempt();
      this.remainingLockoutMs.set(this.auth.getLockoutState().remainingMs);
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
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
