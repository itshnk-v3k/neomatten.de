import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Protects routes with the passport-jwt strategy. On success, the decoded
 * principal ({ userId, email, isAdmin }) is attached to `request.user`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
