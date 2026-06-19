/*
 * EN: Account registration page — breadcrumb + the shared nm-auth-form in
 *     register mode. On success it navigates to the account dashboard; the form
 *     itself owns validation (incl. password match + terms) and the mock
 *     AuthService call.
 * RU: Страница регистрации — крошки + общая nm-auth-form в режиме регистрации.
 *     При успехе переходит к панели аккаунта; валидация (включая совпадение
 *     паролей и условия) и вызов мок-сервиса AuthService — внутри формы.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFormComponent } from '@shared/components/auth-form/auth-form.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'nm-register-page',
  imports: [BreadcrumbComponent, AuthFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
})
export class RegisterPageComponent {
  private readonly router = inject(Router);

  protected onSucceeded(): void {
    void this.router.navigateByUrl('/account');
  }
}
