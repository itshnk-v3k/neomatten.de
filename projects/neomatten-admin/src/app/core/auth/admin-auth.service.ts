/*
 * Admin authentication service. Talks to the NestJS JWT endpoints
 * (POST /api/auth/login, /refresh, GET /api/auth/me), keeps the access +
 * refresh tokens in memory and localStorage (key `na_admin_token`), and exposes
 * the session as signals (currentUser, isAuthenticated). On logout it clears
 * everything and redirects to /login.
 */
import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { UserDTO } from 'neomatten-shared';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../environments/environment';

/** localStorage key holding the persisted token pair. */
const TOKEN_STORAGE_KEY = 'na_admin_token';

/** Response of POST /auth/login and /auth/register. */
interface AuthResponse {
  readonly user: UserDTO;
  readonly accessToken: string;
  readonly refreshToken: string;
}

/** Response of POST /auth/refresh. */
interface RefreshResponse {
  readonly accessToken: string;
}

/** Persisted token pair shape. */
interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly base = environment.apiBaseUrl;

  // Token pair lives in memory (signals) and is mirrored to localStorage.
  private readonly accessTokenSignal = signal<string | null>(null);
  private readonly refreshTokenSignal = signal<string | null>(null);
  private readonly currentUserSignal = signal<UserDTO | null>(null);

  /** Current access token (read synchronously by the auth interceptor). */
  readonly accessToken = this.accessTokenSignal.asReadonly();
  /** The signed-in admin profile, or null when not loaded / signed out. */
  readonly currentUser = this.currentUserSignal.asReadonly();
  /** True when an access token is present. */
  readonly isAuthenticated = computed(() => this.accessTokenSignal() !== null);

  /** In-flight refresh shared across concurrent 401s. */
  private refreshInFlight: Promise<string | null> | null = null;

  constructor() {
    this.restoreTokens();
  }

  /** Signs in with email + password; stores tokens and the returned user. */
  async login(email: string, password: string): Promise<UserDTO> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.base}/auth/login`, { email, password }),
    );
    this.setTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    this.currentUserSignal.set(res.user);
    return res.user;
  }

  /**
   * Loads the current user from GET /auth/me using the stored access token.
   * Returns the user (and caches it in the signal) or null if the call fails.
   */
  async loadCurrentUser(): Promise<UserDTO | null> {
    if (!this.accessTokenSignal()) {
      return null;
    }
    try {
      const user = await firstValueFrom(this.http.get<UserDTO>(`${this.base}/auth/me`));
      this.currentUserSignal.set(user);
      return user;
    } catch {
      return null;
    }
  }

  /**
   * Exchanges the refresh token for a fresh access token. Concurrent callers
   * share a single in-flight request. Returns the new access token or null.
   */
  refresh(): Promise<string | null> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refreshToken = this.refreshTokenSignal();
    if (!refreshToken) {
      return Promise.resolve(null);
    }

    this.refreshInFlight = firstValueFrom(
      this.http.post<RefreshResponse>(`${this.base}/auth/refresh`, { refreshToken }),
    )
      .then(res => {
        this.accessTokenSignal.set(res.accessToken);
        this.persistTokens();
        return res.accessToken;
      })
      .catch(() => null)
      .finally(() => {
        this.refreshInFlight = null;
      });

    return this.refreshInFlight;
  }

  /** Clears the session (memory + storage) and redirects to the login page. */
  logout(): void {
    this.accessTokenSignal.set(null);
    this.refreshTokenSignal.set(null);
    this.currentUserSignal.set(null);
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
    void this.router.navigate(['/login']);
  }

  private setTokens(tokens: TokenPair): void {
    this.accessTokenSignal.set(tokens.accessToken);
    this.refreshTokenSignal.set(tokens.refreshToken);
    this.persistTokens();
  }

  private persistTokens(): void {
    const access = this.accessTokenSignal();
    const refresh = this.refreshTokenSignal();
    if (!access || !refresh) {
      return;
    }
    try {
      localStorage.setItem(
        TOKEN_STORAGE_KEY,
        JSON.stringify({ accessToken: access, refreshToken: refresh } satisfies TokenPair),
      );
    } catch {
      // ignore storage errors
    }
  }

  private restoreTokens(): void {
    try {
      const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) {
        return;
      }
      const tokens = JSON.parse(raw) as TokenPair;
      this.accessTokenSignal.set(tokens.accessToken ?? null);
      this.refreshTokenSignal.set(tokens.refreshToken ?? null);
    } catch {
      // ignore storage errors
    }
  }
}
