/*
 * EN: Application-wide providers — router (input binding, view transitions,
 *     scroll restoration), HttpClient with the API base-URL interceptor, zone
 *     change detection, and async animations.
 * RU: Общие провайдеры приложения — роутер (привязка входов, переходы
 *     представлений, восстановление прокрутки), HttpClient с перехватчиком
 *     базового URL API, zone-обнаружение изменений и асинхронные анимации.
 */
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { apiBaseUrlInterceptor } from '@core/http/api-base-url.interceptor';
import { authInterceptor } from '@core/http/auth.interceptor';
import { tokenRefreshInterceptor } from '@core/http/token-refresh.interceptor';
import { TranslationService } from '@core/i18n/translation.service';
import { SchemaService } from '@core/services/schema.service';
import { SeoService } from '@core/services/seo.service';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' })
    ),
    // Order: resolve base URL → attach Bearer token → handle 401/refresh (closest to backend).
    provideHttpClient(
      withFetch(),
      withInterceptors([apiBaseUrlInterceptor, authInterceptor, tokenRefreshInterceptor])
    ),
    provideAnimationsAsync(),
    // Load the initial language dictionary before the app renders.
    provideAppInitializer(() => inject(TranslationService).init()),
    // Start syncing per-route SEO metadata (title, description, Open Graph tags).
    provideAppInitializer(() => inject(SeoService).init()),
    // Inject JSON-LD structured data (Organization/WebSite + per-page schema).
    provideAppInitializer(() => inject(SchemaService).init()),
  ],
};
