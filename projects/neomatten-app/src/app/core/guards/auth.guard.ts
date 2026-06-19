/*
 * EN: Route guards for the account area. `authGuard` blocks the protected
 *     account dashboard for signed-out users (redirect → /account/login).
 *     `guestGuard` keeps signed-in users off the login/register pages
 *     (redirect → /account). Both read AuthService's signal.
 * RU: Гварды маршрутов раздела аккаунта. `authGuard` закрывает защищённую
 *     панель аккаунта для гостей (редирект → /account/login). `guestGuard` не
 *     пускает вошедших на страницы входа/регистрации (редирект → /account).
 *     Оба читают сигнал AuthService.
 */
import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/account/login']);
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/account']) : true;
};
