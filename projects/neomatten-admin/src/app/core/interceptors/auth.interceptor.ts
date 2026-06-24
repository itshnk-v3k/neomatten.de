/*
 * Auth interceptor. Attaches the current access token as a Bearer header to
 * backend (`/api`) requests, except the public auth endpoints (login/refresh).
 * Reads the token synchronously from AdminAuthService (a signal), so there is
 * no DI cycle at construction time.
 */
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AdminAuthService } from '../auth/admin-auth.service';

/** Endpoint suffixes that must NOT carry a Bearer token. */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isApi = req.url.startsWith('/api') || req.url.includes('/api/');
  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p));
  if (!isApi || isPublic) {
    return next(req);
  }

  const token = inject(AdminAuthService).accessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
