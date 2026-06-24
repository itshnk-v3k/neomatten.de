/*
 * Type contract for the admin app's environment configuration files. Every
 * concrete `environment.*.ts` must satisfy this interface so adding a new
 * environment (or config value) is type-checked across the whole app.
 */
export interface Environment {
  /** Human-readable environment name (shown in diagnostics / debug UI). */
  readonly name: 'development' | 'production';

  /** Angular production build flag. */
  readonly production: boolean;

  /**
   * Base URL for all backend HTTP calls. Relative request paths are resolved
   * against it. In dev this is `/api` and the dev-server proxy (proxy.conf.json)
   * forwards `/api` to the NestJS backend on localhost:5000; in prod the admin
   * app is served from the same origin as the API.
   */
  readonly apiBaseUrl: string;
}
