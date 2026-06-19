/*
 * EN: User + auth domain models / DTOs — the wire contracts for the future
 *     .NET/C#/PostgreSQL + Swagger auth endpoints. `UserDTO` is the account
 *     profile; `AuthTokenDTO` is the JWT pair returned by login/register/refresh.
 *     `firstOrderDiscount` drives the 10% welcome discount (set on registration,
 *     cleared after the first order).
 * RU: Доменные модели/DTO пользователя и авторизации — контракты для будущих
 *     эндпоинтов .NET/C#/PostgreSQL + Swagger. `UserDTO` — профиль аккаунта;
 *     `AuthTokenDTO` — пара JWT, возвращаемая login/register/refresh.
 *     `firstOrderDiscount` управляет скидкой 10% на первый заказ (ставится при
 *     регистрации, снимается после первого заказа).
 */

/** Account profile. Maps to a future `users` table. */
export interface UserDTO {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address?: string;
  /** ISO timestamp. */
  readonly createdAt: string;
  /** True until the user's first order completes (drives the 10% welcome discount). */
  readonly firstOrderDiscount: boolean;
}

/** JWT pair from login / register / refresh. `expiresIn` is seconds. */
export interface AuthTokenDTO {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
}

/** Request body for POST /auth/login. */
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

/** Request body for POST /auth/register. */
export interface RegisterRequest {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}

/** Combined auth response (user + tokens) persisted client-side as the session. */
export interface AuthSession {
  readonly user: UserDTO;
  readonly token: AuthTokenDTO;
}

/** Request body for PATCH /users/:id — editable account profile fields. */
export interface UpdateProfileRequest {
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address?: string;
}

/** Request body for POST /auth/change-password (while signed in). */
export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
}

/** Request body for POST /auth/forgot — starts a password reset (mock emails a link). */
export interface PasswordResetRequestDTO {
  readonly email: string;
}

/**
 * Request body for POST /auth/reset — completes a password reset with the token
 * from the reset email. Confirmation of `newPassword` is validated client-side.
 */
export interface PasswordResetDTO {
  readonly token: string;
  readonly newPassword: string;
}
