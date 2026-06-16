/*
 * EN: Forgot-password page. A single email field; on submit it fires a mock
 *     password-reset (AuthService → EmailService sends a reset link) and shows a
 *     success state. Always succeeds so account existence isn't revealed.
 *     TODO(backend): POST /auth/forgot.
 * RU: Страница восстановления пароля. Одно поле e-mail; по отправке запускает
 *     мок-сброс пароля (AuthService → EmailService отправляет ссылку) и
 *     показывает состояние успеха. Всегда успешно, чтобы не раскрывать наличие
 *     аккаунта. TODO(backend): POST /auth/forgot.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PasswordResetRequestDTO } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { InputComponent } from '@shared/components/input/input.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';

@Component({
  selector: 'nm-forgot-password-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbComponent,
    InputComponent,
    ButtonDirective,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  protected readonly sent = signal(false);
  protected readonly submitting = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const body: PasswordResetRequestDTO = { email: this.form.getRawValue().email };
      await this.auth.requestPasswordReset(body);
      this.sent.set(true);
    } catch {
      this.toast.error('auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }
}
