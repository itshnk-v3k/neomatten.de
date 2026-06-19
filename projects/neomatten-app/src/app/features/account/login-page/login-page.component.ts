/*
 * EN: Account login page — breadcrumb + the shared nm-auth-form in login mode.
 *     On success it navigates to the account dashboard (or the `redirect` query
 *     param when present); the form itself owns validation, lockout and the
 *     mock AuthService call.
 * RU: Страница входа — крошки + общая nm-auth-form в режиме входа. При успехе
 *     переходит к панели аккаунта (или к query-параметру `redirect`, если задан);
 *     валидация, блокировка и вызов мок-сервиса AuthService — внутри формы.
 */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthFormComponent } from '@shared/components/auth-form/auth-form.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'nm-login-page',
  imports: [BreadcrumbComponent, AuthFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected onSucceeded(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/account';
    void this.router.navigateByUrl(redirect);
  }
}
