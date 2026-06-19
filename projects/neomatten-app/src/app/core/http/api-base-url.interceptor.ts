/*
 * EN: HTTP interceptor that prepends the environment API base URL to relative
 *     request URLs, so feature services stay environment-agnostic.
 * RU: HTTP-перехватчик, добавляющий базовый URL API из окружения к
 *     относительным запросам, чтобы сервисы не зависели от окружения.
 */
import type { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '@env/environment';

/**
 * Prepends the environment's API base URL to relative request URLs.
 *
 * Requests to absolute URLs (`http(s)://…`) and to local assets (`/assets/…`,
 * used for mock JSON) are passed through untouched. This keeps feature services
 * free of environment knowledge: they call `http.get('/api/vehicles/brands')`
 * and this interceptor resolves it against the right backend per environment.
 */
export const apiBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const isAbsolute = /^https?:\/\//i.test(req.url);
  const isLocalAsset = req.url.startsWith('/assets/') || req.url.startsWith('assets/');

  if (isAbsolute || isLocalAsset || !environment.apiBaseUrl) {
    return next(req);
  }

  const base = environment.apiBaseUrl.replace(/\/$/, '');
  const path = req.url.startsWith('/') ? req.url : `/${req.url}`;
  return next(req.clone({ url: `${base}${path}` }));
};
