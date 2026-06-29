import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Shape of the signed JWT payload (both access + refresh tokens). */
interface JwtPayload {
  sub: string;
  email: string;
  isAdmin: boolean;
}

/** User record with the password hash stripped — safe to return to clients. */
type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Hash the password, create the user, and return it (sans hash) with fresh tokens. */
  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
    });
    return this.buildAuthResponse(user);
  }

  /** Verify credentials and return the user (sans hash) with fresh tokens. */
  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.buildAuthResponse(user);
  }

  /** Verify a refresh token and issue a new access token (refresh token unchanged). */
  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>(
          'JWT_REFRESH_SECRET',
          'change-me-refresh',
        ),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenPayload: JwtPayload = {
      sub: payload.sub,
      email: payload.email,
      isAdmin: payload.isAdmin,
    };
    return {
      accessToken: this.signAccessToken(tokenPayload),
    };
  }

  /** Look up the current user by id and return it without the password hash. */
  async profile(userId: string) {
    const user = await this.users.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return this.toSafeUser(user);
  }

  /** Build the standard auth response: safe user + access/refresh tokens. */
  private buildAuthResponse(user: User) {
    return {
      user: this.toSafeUser(user),
      ...this.generateTokens(user),
    };
  }

  /** Issue both an access token and a refresh token for the given user. */
  private generateTokens(user: User) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    return {
      accessToken: this.signAccessToken(payload),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.get<string>(
          'JWT_REFRESH_SECRET',
          'change-me-refresh',
        ),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as JwtSignOptions['expiresIn'],
      }),
    };
  }

  private signAccessToken(payload: JwtPayload) {
    return this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET', 'change-me-in-production'),
      expiresIn: this.config.get<string>(
        'JWT_EXPIRES_IN',
        '15m',
      ) as JwtSignOptions['expiresIn'],
    });
  }

  private toSafeUser(user: User): SafeUser {
    const { passwordHash, ...safe } = user;
    void passwordHash;
    return safe;
  }
}
