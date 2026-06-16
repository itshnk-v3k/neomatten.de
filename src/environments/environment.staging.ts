/*
 * EN: Staging environment — production-like build pointed at the staging API.
 * RU: Стейджинг-окружение — сборка как в продакшене, нацеленная на staging-API.
 */
import type { Environment } from './environment.model';

/**
 * Staging environment — production-like build pointed at the staging backend.
 * Update `apiBaseUrl` once the .NET backend is deployed to staging.
 */
export const environment: Environment = {
  name: 'staging',
  production: false,
  apiBaseUrl: 'https://api-staging.neomatten.de',
  mediaBaseUrl: 'https://cdn.neomatten.de',
  features: {
    useMockData: true,
    cookieBanner: true,
    debug: true,
  },
  defaultLanguage: 'de',
  stripePublishableKey: 'pk_test_your_key_here',
};
