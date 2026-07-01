/*
 * Token-refresh interceptor. On a 401 from a protected endpoint it runs the
 * refresh-token flow once, then retries the original request with the new
 * token. If refresh fails (or it was already a refresh/login call), it logs the
 * user out and propagates the error. Concurrent 401s share a single in-flight
 * refresh via AdminAuthService.
 */
import { type HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';

import { AdminAuthService } from '../auth/admin-auth.service';

const REFRESH_OR_LOGIN = ['/auth/refresh', '/auth/login', '/auth/register'];

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCall = REFRESH_OR_LOGIN.some(p => req.url.includes(p));
      if (error.status !== 401 || isAuthCall || !auth.isAuthenticated()) {
        return throwError(() => error);
      }

      // Attempt a single refresh, then retry the original request once.
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
