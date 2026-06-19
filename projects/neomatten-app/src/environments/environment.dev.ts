/*
 * EN: Development environment — used by `ng serve` / `npm start` (mock data).
 * RU: Окружение разработки — используется `ng serve` / `npm start` (моки).
 */
import type { Environment } from './environment.model';

/** Development environment — used by `ng serve` / `npm start`. */
export const environment: Environment = {
  name: 'development',
  production: false,
  apiBaseUrl: 'http://localhost:5000',
  mediaBaseUrl: 'http://localhost:5000/media',
  features: {
    useMockData: true,
    cookieBanner: true,
    debug: true,
  },
  defaultLanguage: 'de',
  stripePublishableKey: 'pk_test_your_key_here',
};
