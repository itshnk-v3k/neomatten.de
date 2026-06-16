/*
 * EN: Account registration page. Reactive form — name, email, password +
 *     confirm (cross-field match validator), phone (nm-phone-input) and a
 *     required terms checkbox. On success registers via the mock AuthService
 *     (sets firstOrderDiscount), toasts and navigates to the account dashboard.
 * RU: Страница регистрации. Reactive-форма — имя, e-mail, пароль + подтверждение
 *     (кросс-валидатор совпадения), телефон (nm-phone-input) и обязательный чекбокс
 *     условий. При успехе регистрирует через мок AuthService (ставит
 *     firstOrderDiscount), показывает тост и переходит к панели аккаунта.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { CheckboxComponent } from '@shared/components/checkbox/checkbox.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SocialLoginComponent } from '@shared/components/social-login/social-login.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { matchFieldsValidator } from '@shared/validators/custom-validators';
import { phoneValidator } from '@shared/validators/phone.validator';

@Component({
  selector: 'nm-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    BreadcrumbComponent,
    InputComponent,
    PhoneInputComponent,
    CheckboxComponent,
    ButtonDirective,
    SocialLoginComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  protected readonly form = this.fb.nonNullable.group(
    {
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', phoneValidator()],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
    },
    { validators: matchFieldsValidator('password', 'confirmPassword') }
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
      const { name, email, phone, password } = this.form.getRawValue();
      await this.auth.register({ name, email, phone, password });
      this.toast.success('auth_register_success');
      void this.router.navigateByUrl('/account');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }
}
