/*
 * EN: Shared auth form — a single source of truth for the sign-in / register
 *     card used by both the account pages (/account/login, /account/register)
 *     and the auth dialog. Owns the Reactive Forms, the brute-force lockout
 *     countdown and submission against the mock AuthService. `mode` selects which
 *     form renders; `linkMode` selects how the bottom switch link behaves —
 *     `route` (navigate between pages) or `toggle` (flip mode in place, dialog).
 *     On success it emits `succeeded` so the host can navigate or close; `dismiss`
 *     fires when an in-form navigation link is followed (so a host dialog closes).
 * RU: Общая форма авторизации — единый источник карточки входа / регистрации для
 *     страниц аккаунта (/account/login, /account/register) и диалога авторизации.
 *     Содержит Reactive Forms, отсчёт блокировки от перебора и отправку через мок
 *     AuthService. `mode` выбирает форму; `linkMode` — поведение нижней ссылки:
 *     `route` (переход между страницами) или `toggle` (смена режима на месте,
 *     диалог). При успехе эмитит `succeeded` (хост переходит/закрывает); `dismiss`
 *     срабатывает при переходе по ссылке внутри формы (чтобы диалог-хост закрылся).
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PasswordResetRequestDTO } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { LucideShieldAlert } from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SocialLoginComponent } from '@shared/components/social-login/social-login.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { matchFieldsValidator } from '@shared/validators/custom-validators';
import { phoneValidator } from '@shared/validators/phone.validator';
import { interval } from 'rxjs';

export type AuthMode = 'login' | 'register' | 'forgot';

@Component({
  selector: 'nm-auth-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    InputComponent,
    PhoneInputComponent,
    CheckboxComponent,
    ButtonDirective,
    SocialLoginComponent,
    TranslatePipe,
    LucideShieldAlert,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-form.component.html',
})
export class AuthFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  /** Active form (login / register / forgot). Two-way so a dialog host can react to in-place toggles. */
  readonly mode = model<AuthMode>('login');
  /**
   * Bottom switch link and the "forgot password" link: `route` navigates between
   * the account pages, `toggle` flips mode in place (used by the auth dialog).
   */
  readonly linkMode = input<'route' | 'toggle'>('route');
  /** Emitted after a successful login / register; carries the mode that ran. */
  readonly succeeded = output<AuthMode>();
  /** Emitted when an in-form navigation link is followed (host dialog closes). */
  readonly dismiss = output<void>();

  protected readonly submitting = signal(false);

  /** Forgot-password reset link has been sent (shows the success state). */
  protected readonly forgotSent = signal(false);

  /** Card title key for the active mode. */
  protected readonly titleKey = computed(() => {
    switch (this.mode()) {
      case 'register':
        return 'action_register';
      case 'forgot':
        return 'auth_forgot_title';
      default:
        return 'auth_login_tab';
    }
  });

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

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  protected readonly registerForm = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', phoneValidator()],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
      dataConsent: [false, Validators.requiredTrue],
    },
    { validators: matchFieldsValidator('password', 'confirmPassword') }
  );

  protected readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor() {
    // Tick the lockout countdown while locked; the login form reverts once the
    // window expires. On the locked→unlocked transition, reassure with a toast.
    interval(1000)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const wasLocked = this.remainingLockoutMs() > 0;
        const remaining = this.auth.getLockoutState().remainingMs;
        this.remainingLockoutMs.set(remaining);
        if (wasLocked && remaining <= 0) {
          this.toast.success('auth_lockout_expired');
        }
      });
  }

  /** Whether to show the data-consent error inline (unchecked + interacted). */
  protected get showDataConsentError(): boolean {
    const control = this.registerForm.controls.dataConsent;
    return control.invalid && (control.touched || control.dirty);
  }

  /** Whether to show the password-mismatch error inline under the confirm field. */
  protected get showMismatch(): boolean {
    return (
      this.registerForm.hasError('mismatch') &&
      (this.registerForm.controls.confirmPassword.touched ||
        this.registerForm.controls.confirmPassword.dirty)
    );
  }

  protected setMode(mode: AuthMode): void {
    // Leaving the forgot view clears its form and success state, so reopening it starts fresh.
    if (mode !== 'forgot') {
      this.forgotForm.reset();
      this.forgotSent.set(false);
    }
    this.mode.set(mode);
  }

  protected async submitLogin(): Promise<void> {
    if (this.locked()) {
      return;
    }
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const { email, password } = this.loginForm.getRawValue();
      await this.auth.login({ email, password });
      this.auth.clearFailedAttempts();
      this.remainingLockoutMs.set(0);
      this.toast.success('auth_login_success');
      this.reset();
      this.succeeded.emit('login');
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
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const { name, email, phone, password } = this.registerForm.getRawValue();
      await this.auth.register({ name, email, phone, password });
      this.toast.success('auth_register_success');
      this.reset();
      this.succeeded.emit('register');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }

  /**
   * Mock password reset (mirrors the forgot-password page): always resolves so
   * account existence isn't revealed, then shows the success state in place.
   * TODO(backend): POST /auth/forgot.
   */
  protected async submitForgot(): Promise<void> {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const body: PasswordResetRequestDTO = { email: this.forgotForm.getRawValue().email };
      await this.auth.requestPasswordReset(body);
      this.forgotSent.set(true);
    } catch {
      this.toast.error('auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }

  private reset(): void {
    this.loginForm.reset();
    this.registerForm.reset();
    this.forgotForm.reset();
  }
}
