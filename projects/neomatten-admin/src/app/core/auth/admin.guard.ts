/*
 * Route guard for the admin shell. Redirects to /login when there is no token,
 * and verifies the principal is an admin by loading GET /api/auth/me. A
 * non-admin (or a failed /me call) is logged out and sent to /login.
 */
import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  // Use the cached profile when available, otherwise fetch it from /auth/me.
  const user = auth.currentUser() ?? (await auth.loadCurrentUser());

  if (user?.isAdmin) {
    return true;
  }

  // Authenticated but not an admin (or the token is no longer valid) → sign out.
  auth.logout();
  return router.createUrlTree(['/login']);
};
