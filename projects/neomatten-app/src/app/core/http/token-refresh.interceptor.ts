/*
 * EN: Token-refresh interceptor. On a 401 from a protected endpoint it asks
 *     AuthService to run the refresh-token flow, then retries the original
 *     request once with the new token. If refresh fails (or it was already a
 *     refresh/login call), it logs the user out and propagates the error.
 *     Concurrent 401s share a single in-flight refresh via AuthService.
 * RU: Перехватчик обновления токена. При 401 от защищённого эндпоинта просит
 *     AuthService выполнить обновление токена, затем один раз повторяет исходный
 *     запрос с новым токеном. Если обновление не удалось (или это был сам
 *     refresh/login), выходит из аккаунта и пробрасывает ошибку. Параллельные
 *     401 разделяют один процесс обновления через AuthService.
 */
import { type HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { catchError, from, switchMap, throwError } from 'rxjs';

const REFRESH_OR_LOGIN = ['/auth/refresh', '/auth/login', '/auth/register', '/auth/exchange'];

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = REFRESH_OR_LOGIN.some(p => req.url.includes(p));
      if (error.status !== 401 || isAuthCall || !auth.isAuthenticated()) {
        return throwError(() => error);
      }

      // Attempt a single refresh, then retry the original request with the new token.
      return from(auth.refresh()).pipe(
        switchMap(token => {
          if (!token) {
            auth.logout();
            return throwError(() => error);
          }
          return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
        }),
        catchError(() => {
          auth.logout();
          return throwError(() => error);
        })
      );
    })
  );
};
