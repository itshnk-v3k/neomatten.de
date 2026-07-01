import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type Profile,
  type VerifyCallback,
} from 'passport-google-oauth20';
import type { OAuthProfile } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    super({
      // Non-empty fallbacks so the app still BOOTS when creds aren't configured;
      // real values are required for OAuth to actually work (see .env.example).
      clientID: config.get<string>('GOOGLE_CLIENT_ID', 'unconfigured'),
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET', 'unconfigured'),
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:5000/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  /** Normalizes Google's profile into our OAuthProfile (attached to req.user). */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new UnauthorizedException('Google account has no email'), false);
      return;
    }
    const normalized: OAuthProfile = {
      email,
      firstName: profile.name?.givenName ?? '',
      lastName: profile.name?.familyName ?? '',
      providerId: profile.id,
    };
    done(null, normalized);
  }
}
