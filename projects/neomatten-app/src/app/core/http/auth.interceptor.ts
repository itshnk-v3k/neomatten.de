/*
 * EN: Auth interceptor. Attaches the current access token as a Bearer header to
 *     every backend request, except public endpoints (login/register/refresh)
 *     and local asset/mock requests. Reads the token synchronously from
 *     AuthService (a signal), so there is no DI cycle at construction time.
 * RU: Перехватчик авторизации. Добавляет текущий access-токен как заголовок
 *     Bearer ко всем запросам бэкенда, кроме публичных эндпоинтов
 *     (login/register/refresh) и локальных запросов к ассетам/мокам. Читает
 *     токен синхронно из AuthService (сигнал), поэтому цикла DI при создании нет.
 */
import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

/** Endpoint suffixes that must NOT carry a Bearer token. */
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const isPublic = PUBLIC_PATHS.some(p => req.url.includes(p));
  const isLocalAsset = req.url.startsWith('/assets/') || req.url.startsWith('assets/');
  if (isPublic || isLocalAsset) {
    return next(req);
  }

  const token = inject(AuthService).accessToken();
  if (!token) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
