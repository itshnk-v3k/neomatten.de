/*
 * EN: Default (fallback) environment, mirroring development. Swapped per build
 *     via fileReplacements in angular.json.
 * RU: Окружение по умолчанию (как development). Подменяется при сборке через
 *     fileReplacements в angular.json.
 */
import type { Environment } from './environment.model';

/**
 * Default (fallback) environment.
 *
 * The Angular builder replaces this file via `fileReplacements` in
 * angular.json for each build configuration (development / staging /
 * production). It mirrors the development config so unit tests and any
 * un-replaced context get sensible local defaults.
 */
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
