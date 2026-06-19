/*
 * EN: Change-password page (/account/password, authGuard). Reactive form —
 *     current password, new password (min 6) + confirm (cross-field match
 *     validator). Invalid submit marks all touched + toasts; success changes the
 *     password via the mock AuthService and toasts. TODO(backend):
 *     POST /auth/change-password.
 * RU: Страница смены пароля (/account/password, authGuard). Reactive-форма —
 *     текущий пароль, новый пароль (мин. 6) + подтверждение (кросс-валидатор
 *     совпадения). Невалидная отправка помечает поля и показывает тост; успех
 *     меняет пароль через мок AuthService и показывает тост. TODO(backend):
 *     POST /auth/change-password.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { ChangePasswordRequest } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { InputComponent } from '@shared/components/input/input.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { matchFieldsValidator } from '@shared/validators/custom-validators';

@Component({
  selector: 'nm-account-password-page',
  imports: [ReactiveFormsModule, InputComponent, ButtonDirective, SkeletonComponent, TranslatePipe],
  // Fill the account content column so the card's lg:max-w-[80%] is meaningful.
  host: { '[style.display]': '"flex"', '[style.width]': '"100%"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './password-page.component.html',
  styleUrl: './password-page.component.scss',
})
export class PasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchFieldsValidator('newPassword', 'confirmPassword') }
  );

  /** Whether to show the password-mismatch error inline under the confirm field. */
  protected get showMismatch(): boolean {
    return (
      this.form.hasError('mismatch') &&
      (this.form.controls.confirmPassword.touched || this.form.controls.confirmPassword.dirty)
    );
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const { currentPassword, newPassword } = this.form.getRawValue();
      const body: ChangePasswordRequest = { currentPassword, newPassword };
      await this.auth.changePassword(body);
      this.toast.success('account_password_saved');
      void this.router.navigateByUrl('/account');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }
}
