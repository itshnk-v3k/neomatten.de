/*
 * EN: Mock authentication service. Login / register / logout backed by
 *     localStorage (no real security), exposing the session, user and
 *     authenticated state as signals. Registration sets `firstOrderDiscount`
 *     (the 10% welcome discount); OrderService clears it after the first order.
 *     Each method documents the exact HTTP call that replaces its mock when the
 *     .NET/PostgreSQL backend lands.
 * RU: Мок-сервис авторизации. Login / register / logout на localStorage (без
 *     реальной безопасности), сессия/пользователь/состояние авторизации — сигналы.
 *     Регистрация ставит `firstOrderDiscount` (скидка 10% на первый заказ);
 *     OrderService снимает её после первого заказа. Каждый метод описывает точный
 *     HTTP-вызов, заменяющий мок при появлении бэкенда .NET/PostgreSQL.
 */
import { computed, inject, Injectable, signal } from '@angular/core';
import { ApiService } from '@core/http/api.service';
import type {
  AuthSession,
  AuthTokenDTO,
  ChangePasswordRequest,
  LoginRequest,
  PasswordResetDTO,
  PasswordResetRequestDTO,
  RegisterRequest,
  UpdateProfileRequest,
  UserDTO,
} from '@core/models/user.model';
import { EmailService } from '@core/services/email.service';

const SESSION_STORAGE_KEY = 'neomatten_auth';
/** localStorage key holding the mock user registry (email → {user,password}). */
const USERS_STORAGE_KEY = 'neomatten_users';

interface StoredUser {
  readonly user: UserDTO;
  readonly password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Reserved for the real backend; unused by the mock but kept so the swap is local.
  private readonly api = inject(ApiService);
  private readonly email = inject(EmailService);

  private readonly sessionSignal = signal<AuthSession | null>(this.restore());

  /** Current session (user + tokens) or null when signed out. */
  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed<UserDTO | null>(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
  readonly accessToken = computed<string | null>(
    () => this.sessionSignal()?.token.accessToken ?? null
  );

  private readonly loadingSignal = signal(true);
  /** True while the session/profile loads; flips false after a short delay (mock). */
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {
    // Mock loading delay so skeleton states are visible during development.
    // TODO(backend): drive `loading` from the session/profile request lifecycle.
    setTimeout(() => this.loadingSignal.set(false), 600);
  }

  /**
   * Signs in.
   * TODO(backend): replace with `this.api.post<AuthSession>('/auth/login', body)`.
   */
  async login(body: LoginRequest): Promise<AuthSession> {
    const stored = this.users().find(u => u.user.email.toLowerCase() === body.email.toLowerCase());
    if (!stored || stored.password !== body.password) {
      throw new Error('auth_error_invalid_credentials');
    }
    const session: AuthSession = { user: stored.user, token: this.mockToken() };
    this.setSession(session);
    return session;
  }

  /**
   * Registers a new account (and signs in). Sets `firstOrderDiscount: true`.
   * TODO(backend): replace with `this.api.post<AuthSession>('/auth/register', body)`.
   */
  async register(body: RegisterRequest): Promise<AuthSession> {
    const exists = this.users().some(u => u.user.email.toLowerCase() === body.email.toLowerCase());
    if (exists) {
      throw new Error('auth_error_email_taken');
    }
    const user: UserDTO = {
      id: this.mockId(),
      name: body.name,
      email: body.email,
      phone: body.phone,
      createdAt: new Date().toISOString(),
      firstOrderDiscount: true,
    };
    this.saveUsers([...this.users(), { user, password: body.password }]);
    const session: AuthSession = { user, token: this.mockToken() };
    this.setSession(session);
    return session;
  }

  // Social login (Google/Facebook) is intentionally NOT mocked here: real OAuth
  // needs a backend + provider credentials, so the SocialLoginComponent only
  // surfaces an informational toast for now (no session is created).
  // TODO(backend): add `loginWithGoogle()/loginWithFacebook()` that exchange the
  // OAuth code server-side, then `this.api.post<AuthSession>('/auth/social/:provider', …)`.

  // --- Login brute-force protection (client-side) ---------------------------
  // Frontend-only guard against rapid repeated failed logins. Real rate limiting
  // belongs on the backend; this prevents request spam to the future API and
  // gives the user immediate feedback. State lives in localStorage so it survives
  // reloads within the lockout window.
  private readonly LOGIN_MAX_ATTEMPTS = 5;
  private readonly LOGIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes
  private readonly LOCKOUT_KEY = 'neomatten_login_lockout';

  /** Current lockout status: whether locked, how long remains, and the attempt count. */
  getLockoutState(): { locked: boolean; remainingMs: number; attempts: number } {
    const raw = localStorage.getItem(this.LOCKOUT_KEY);
    if (!raw) return { locked: false, remainingMs: 0, attempts: 0 };
    try {
      const data = JSON.parse(raw) as { attempts: number; lockedUntil: number };
      const remaining = data.lockedUntil - Date.now();
      if (remaining <= 0) {
        // Lock expired but failed attempts are kept until a success clears them,
        // so the next failure (if still wrong) re-locks immediately.
        return { locked: false, remainingMs: 0, attempts: data.attempts };
      }
      return { locked: true, remainingMs: remaining, attempts: data.attempts };
    } catch {
      return { locked: false, remainingMs: 0, attempts: 0 };
    }
  }

  /** Records one failed login; locks the account once the attempt cap is reached. */
  recordFailedAttempt(): void {
    const state = this.getLockoutState();
    const attempts = state.attempts + 1;
    const lockedUntil =
      attempts >= this.LOGIN_MAX_ATTEMPTS ? Date.now() + this.LOGIN_LOCKOUT_MS : 0;
    try {
      localStorage.setItem(this.LOCKOUT_KEY, JSON.stringify({ attempts, lockedUntil }));
    } catch {
      // ignore storage errors
    }
  }

  /** Clears the failed-attempt counter / lockout (call after a successful login). */
  clearFailedAttempts(): void {
    try {
      localStorage.removeItem(this.LOCKOUT_KEY);
    } catch {
      // ignore storage errors
    }
  }

  // TODO(admin): POST /api/auth/clear-lockout/:userId — admin resets a lockout
  // from the admin panel once the backend owns rate limiting.

  /**
   * Refreshes the access token.
   * TODO(backend): replace with `this.api.post<AuthTokenDTO>('/auth/refresh', { refreshToken })`.
   * Returns the new access token, or null if refresh is impossible.
   */
  async refresh(): Promise<string | null> {
    const current = this.sessionSignal();
    if (!current) return null;
    const token = this.mockToken();
    this.setSession({ ...current, token });
    return token.accessToken;
  }

  /**
   * Signs out.
   * TODO(backend): also `this.api.post('/auth/logout', {})` to revoke the refresh token.
   */
  logout(): void {
    this.sessionSignal.set(null);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }

  /** Clears the welcome discount after the user's first completed order. */
  clearFirstOrderDiscount(): void {
    const current = this.sessionSignal();
    if (!current?.user.firstOrderDiscount) return;
    const user: UserDTO = { ...current.user, firstOrderDiscount: false };
    this.setSession({ ...current, user });
    this.saveUsers(this.users().map(u => (u.user.id === user.id ? { ...u, user } : u)));
  }

  /**
   * Updates the signed-in user's profile (name / email / phone / address) in the
   * session and the mock registry. Rejects if the new email belongs to another
   * account.
   * TODO(backend): replace with `this.api.patch<UserDTO>(`/users/${id}`, body)`.
   */
  async updateProfile(body: UpdateProfileRequest): Promise<UserDTO> {
    const current = this.sessionSignal();
    if (!current) throw new Error('auth_error_generic');
    const taken = this.users().some(
      u => u.user.id !== current.user.id && u.user.email.toLowerCase() === body.email.toLowerCase()
    );
    if (taken) throw new Error('auth_error_email_taken');
    const user: UserDTO = {
      ...current.user,
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
    };
    this.setSession({ ...current, user });
    this.saveUsers(this.users().map(u => (u.user.id === user.id ? { ...u, user } : u)));
    return user;
  }

  /**
   * Changes the signed-in user's password after verifying the current one.
   * TODO(backend): replace with `this.api.post('/auth/change-password', body)`.
   */
  async changePassword(body: ChangePasswordRequest): Promise<void> {
    const current = this.sessionSignal();
    if (!current) throw new Error('auth_error_generic');
    const stored = this.users().find(u => u.user.id === current.user.id);
    if (!stored || stored.password !== body.currentPassword) {
      throw new Error('auth_error_wrong_password');
    }
    this.saveUsers(
      this.users().map(u =>
        u.user.id === current.user.id ? { ...u, password: body.newPassword } : u
      )
    );
  }

  /**
   * Deletes the signed-in account from the mock registry and signs out.
   * TODO(backend): replace with `this.api.delete(`/users/${id}`)`.
   */
  async deleteAccount(): Promise<void> {
    const current = this.sessionSignal();
    if (!current) return;
    this.saveUsers(this.users().filter(u => u.user.id !== current.user.id));
    this.logout();
  }

  /**
   * Starts a password reset: emails a (mock) reset link via EmailService. Always
   * resolves regardless of whether the email is registered, so the UI never
   * reveals which addresses have accounts.
   * TODO(backend): replace with `this.api.post('/auth/forgot', body)` — the
   * backend mints the token and sends the mail; the client only fires the call.
   */
  async requestPasswordReset(body: PasswordResetRequestDTO): Promise<void> {
    const token = `reset.${btoa(this.mockId())}`;
    await this.email.sendPasswordReset(body.email, token);
  }

  /**
   * Completes a password reset using the token from the reset email.
   * TODO(backend): replace with `this.api.post('/auth/reset', body)`.
   */
  async resetPassword(body: PasswordResetDTO): Promise<void> {
    // Mock: no token store client-side — the real backend validates the token
    // and persists the new password. Resolve so the success state can render.
    void body;
    return Promise.resolve();
  }

  private setSession(session: AuthSession): void {
    this.sessionSignal.set(session);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors
    }
  }

  private restore(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  }

  private users(): StoredUser[] {
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredUser[]) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: StoredUser[]): void {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch {
      // ignore storage errors
    }
  }

  /** Mock JWT pair (opaque base64 strings, 1h expiry). Real tokens come from the backend. */
  private mockToken(): AuthTokenDTO {
    return {
      accessToken: `mock.${btoa(this.mockId())}`,
      refreshToken: `mockr.${btoa(this.mockId())}`,
      expiresIn: 3600,
    };
  }

  private mockId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}
