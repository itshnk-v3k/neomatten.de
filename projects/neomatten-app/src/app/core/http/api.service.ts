/*
 * EN: Thin typed HTTP facade over HttpClient. Feature services call
 *     `api.get<T>('/orders')` etc. with relative paths; the
 *     `apiBaseUrlInterceptor` resolves them against `environment.apiBaseUrl`
 *     per environment, and the auth/refresh interceptors attach tokens. This is
 *     the single seam every backend call flows through.
 * RU: Тонкая типизированная обёртка над HttpClient. Сервисы вызывают
 *     `api.get<T>('/orders')` и т.п. с относительными путями; перехватчик
 *     `apiBaseUrlInterceptor` разрешает их относительно `environment.apiBaseUrl`,
 *     а перехватчики авторизации/обновления токена добавляют токены. Это единый
 *     стык, через который проходят все вызовы бэкенда.
 */
import { HttpClient, type HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import type { Observable } from 'rxjs';

/** Optional query params for a request. */
type Params = HttpParams | Record<string, string | number | boolean>;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  /**
   * Builds an absolute media (image/CDN) URL from a relative path, resolved
   * against `environment.mediaBaseUrl`. Absolute URLs are returned untouched.
   * The single seam for admin-managed image URLs (used by MediaService).
   */
  mediaUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path;
    }
    const base = environment.mediaBaseUrl.replace(/\/$/, '');
    const rel = path.startsWith('/') ? path : `/${path}`;
    return `${base}${rel}`;
  }

  get<T>(path: string, params?: Params): Observable<T> {
    return this.http.get<T>(path, { params });
  }

  post<T>(path: string, body?: unknown): Observable<T> {
    return this.http.post<T>(path, body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<T> {
    return this.http.put<T>(path, body ?? {});
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(path);
  }
}
