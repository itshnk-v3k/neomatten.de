/*
 * EN: Account login page. Reactive form (email + password + remember-me) backed
 *     by the mock AuthService; links to register and forgot-password. Invalid
 *     submit marks all touched + toasts; success toasts and navigates to the
 *     account dashboard (or the `redirect` query param when present).
 * RU: Страница входа. Reactive-форма (e-mail + пароль + «запомнить меня») на
 *     мок-сервисе AuthService; ссылки на регистрацию и восстановление пароля.
 *     Невалидная отправка помечает поля и показывает тост; успех — тост и переход
 *     к панели аккаунта (или к query-параметру `redirect`, если задан).
 */
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { LucideShieldAlert } from '@lucide/angular';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { SocialLoginComponent } from '@shared/components/social-login/social-login.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { interval } from 'rxjs';

@Component({
  selector: 'nm-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbComponent,
    InputComponent,
    CheckboxComponent,
    ButtonDirective,
    SocialLoginComponent,
    TranslatePipe,
    LucideShieldAlert,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [true],
  });

  constructor() {
    // Tick the lockout countdown while locked; the view auto-reverts to the form
    // once getLockoutState() reports the window has expired. On the locked→unlocked
    // transition, reassure the user with a success toast.
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

  protected async submit(): Promise<void> {
    if (this.locked()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login({ email, password });
      this.auth.clearFailedAttempts();
      this.remainingLockoutMs.set(0);
      this.toast.success('auth_login_success');
      const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/account';
      void this.router.navigateByUrl(redirect);
    } catch (error) {
      this.auth.recordFailedAttempt();
      this.remainingLockoutMs.set(this.auth.getLockoutState().remainingMs);
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }
}
