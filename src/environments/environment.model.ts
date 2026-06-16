/*
 * EN: Type contract for environment configuration files (API base URL, feature
 *     flags, default language) — the seam to the future backend.
 * RU: Типовой контракт для файлов окружения (базовый URL API, фичефлаги, язык
 *     по умолчанию) — стык с будущим бэкендом.
 */

/**
 * Shape of an environment configuration.
 *
 * Every concrete `environment.*.ts` file must satisfy this interface, so that
 * adding a new environment (or a new config value) is type-checked across the
 * whole app. Environment-specific values (API base URL, feature flags, etc.)
 * are the seam between this frontend and the future .NET/C#/PostgreSQL backend.
 */
export interface Environment {
  /** Human-readable environment name (shown in diagnostics / debug UI). */
  readonly name: 'development' | 'staging' | 'production';

  /** Angular production build flag (enables prod-only optimizations/logging). */
  readonly production: boolean;

  /**
   * Base URL for all backend HTTP calls. Prepended to relative request URLs by
   * the `apiBaseUrlInterceptor`. Empty string means "same origin / mock data".
   */
  readonly apiBaseUrl: string;

  /**
   * Base URL for admin-managed media (images/CDN). Used by `ApiService.mediaUrl()`
   * and `MediaService` to build full asset URLs. Points at the backend's media
   * endpoint in dev and the CDN in staging/prod.
   */
  readonly mediaBaseUrl: string;

  /** Per-environment feature flags. Add flags here as features are gated. */
  readonly features: {
    /** Serve catalog/configurator data from local mock JSON instead of HTTP. */
    readonly useMockData: boolean;
    /** Show the cookie-consent banner. */
    readonly cookieBanner: boolean;
    /** Enable verbose console diagnostics. */
    readonly debug: boolean;
  };

  /** Default UI language before the user makes a choice. */
  readonly defaultLanguage: 'de' | 'en';

  /**
   * Stripe publishable key for Stripe.js. Use a `pk_test_*` key in dev/staging
   * and a `pk_live_*` key in prod. Safe to ship to the client (publishable).
   * TODO(backend): the secret key + checkout-session creation live server-side.
   */
  readonly stripePublishableKey: string;
}
