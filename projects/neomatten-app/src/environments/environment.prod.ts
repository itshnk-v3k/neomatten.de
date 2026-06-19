/*
 * EN: Production environment — optimized build against the production API.
 * RU: Продакшен-окружение — оптимизированная сборка с продакшен-API.
 */
import type { Environment } from './environment.model';

/**
 * Production environment.
 * Update `apiBaseUrl` once the .NET backend is deployed to production, and flip
 * `useMockData` to `false` when real endpoints are available.
 */
export const environment: Environment = {
  name: 'production',
  production: true,
  apiBaseUrl: 'https://api.neomatten.de',
  mediaBaseUrl: 'https://cdn.neomatten.de',
  features: {
    useMockData: true,
    cookieBanner: true,
    debug: false,
  },
  defaultLanguage: 'de',
  stripePublishableKey: 'pk_live_your_key_here',
};
