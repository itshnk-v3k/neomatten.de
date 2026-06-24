import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Allows the request only when the authenticated principal is an admin.
 * Must run after JwtAuthGuard, which populates `request.user`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { isAdmin?: boolean } | undefined;
    if (user?.isAdmin === true) {
      return true;
    }
    throw new ForbiddenException('Admin privileges required');
  }
}
