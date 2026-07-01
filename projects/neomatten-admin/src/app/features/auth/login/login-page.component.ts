/*
 * Admin login page. A branded, centered card with a standalone reactive form
 * (email + password). On submit it calls AdminAuthService.login(); a 401 shows
 * an inline error, and success navigates to /dashboard.
 */
import { type HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideLoaderCircle } from '@lucide/angular';

import { AdminAuthService } from '../../../core/auth/admin-auth.service';
import { AdminI18nService } from '../../../core/i18n/admin-i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';

@Component({
  selector: 'na-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, LucideLoaderCircle, LucideEye, LucideEyeOff, TranslatePipe],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(AdminI18nService);

  /** True while the login request is in flight (disables the submit button). */
  readonly loading = signal(false);
  /** Inline error message shown under the form, or null when there is none. */
  readonly errorMessage = signal<string | null>(null);
  /** Toggles the password field between masked and plain text. */
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.loading()) {
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();

    try {
      await this.auth.login(email, password);
      await this.router.navigate(['/dashboard']);
    } catch (error) {
      this.errorMessage.set(this.toMessage(error as HttpErrorResponse));
    } finally {
      this.loading.set(false);
    }
  }

  private toMessage(error: HttpErrorResponse): string {
    if (error?.status === 401) {
      return this.i18n.t('login.errorInvalidCredentials');
    }
    if (error?.status === 0) {
      return this.i18n.t('login.errorServerUnreachable');
    }
    return this.i18n.t('login.errorGeneric');
  }
}
