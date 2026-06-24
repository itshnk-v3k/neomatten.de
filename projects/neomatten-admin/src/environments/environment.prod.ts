/*
 * Production environment. The admin SPA is served from the same origin as the
 * API, so backend calls stay on the relative `/api` path.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  name: 'production',
  production: true,
  apiBaseUrl: '/api',
};
