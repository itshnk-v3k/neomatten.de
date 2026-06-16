/*
 * EN: Profile-edit page (/account/profile, authGuard). Reactive form prefilled
 *     from the signed-in user — name, email, phone (nm-phone-input) and address.
 *     Invalid submit marks all touched + toasts; success saves via the mock
 *     AuthService (localStorage) and toasts. TODO(backend): PATCH /users/:id.
 * RU: Страница редактирования профиля (/account/profile, authGuard). Reactive-
 *     форма, заполненная из вошедшего пользователя — имя, e-mail, телефон
 *     (nm-phone-input) и адрес. Невалидная отправка помечает поля и показывает
 *     тост; успех сохраняет через мок AuthService (localStorage) и показывает
 *     тост. TODO(backend): PATCH /users/:id.
 */
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import type { UpdateProfileRequest } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';
import { LucideAlertTriangle, LucideLogOut } from '@lucide/angular';
import { ButtonDirective } from '@shared/components/button/button.directive';
import { DialogComponent } from '@shared/components/dialog/dialog.component';
import { InputComponent } from '@shared/components/input/input.component';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { SkeletonComponent } from '@shared/components/skeleton/skeleton.component';
import { TranslatePipe } from '@shared/pipes/translate.pipe';
import { ToastService } from '@shared/services/toast.service';
import { createAsyncAction } from '@shared/utils/async-action.util';
import { phoneValidator } from '@shared/validators/phone.validator';

@Component({
  selector: 'nm-account-profile-page',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    PhoneInputComponent,
    ButtonDirective,
    DialogComponent,
    SkeletonComponent,
    TranslatePipe,
    LucideAlertTriangle,
    LucideLogOut,
  ],
  // Host fills the account content column and centers its card.
  host: { '[style.display]': '"flex"', '[style.width]': '"100%"' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
})
export class ProfilePageComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly submitting = signal(false);

  /** Delete-account confirmation dialog state. */
  protected readonly deleteOpen = signal(false);
  protected readonly deleting = signal(false);

  /** Sign-out confirmation dialog state. */
  protected readonly logoutOpen = signal(false);

  /** Signs out after the user confirms (guarded against a rapid double-click). */
  protected readonly logoutAction = createAsyncAction(
    () => {
      this.logoutOpen.set(false);
      this.auth.logout();
      void this.router.navigateByUrl('/');
    },
    { minDurationMs: 500 }
  );

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', phoneValidator()],
    address: [''],
  });

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address ?? '',
      });
    }
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.error('form_error_required_fields');
      return;
    }
    this.submitting.set(true);
    try {
      const { name, email, phone, address } = this.form.getRawValue();
      const body: UpdateProfileRequest = {
        name,
        email,
        phone,
        address: address.trim() || undefined,
      };
      await this.auth.updateProfile(body);
      this.toast.success('account_profile_saved');
      void this.router.navigateByUrl('/account');
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'auth_error_generic');
    } finally {
      this.submitting.set(false);
    }
  }

  /** Deletes the account after confirmation, then returns to the home page. */
  protected async confirmDelete(): Promise<void> {
    this.deleting.set(true);
    try {
      await this.auth.deleteAccount();
      this.toast.success('account_delete_success');
      this.deleteOpen.set(false);
      void this.router.navigateByUrl('/');
    } catch {
      this.toast.error('auth_error_generic');
    } finally {
      this.deleting.set(false);
    }
  }
}
