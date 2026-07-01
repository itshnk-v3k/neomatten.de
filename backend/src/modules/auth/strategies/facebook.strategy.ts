import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile } from 'passport-facebook';
import type { OAuthProfile } from '../auth.service';

/** passport's generic verify callback (passport-facebook re-exports no typed one). */
type VerifyCallback = (error: unknown, user?: OAuthProfile | false) => void;

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(config: ConfigService) {
    super({
      // Non-empty fallbacks so the app still BOOTS when creds aren't configured;
      // real values are required for OAuth to actually work (see .env.example).
      clientID: config.get<string>('FACEBOOK_APP_ID', 'unconfigured'),
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET', 'unconfigured'),
      callbackURL: config.get<string>(
        'FACEBOOK_CALLBACK_URL',
        'http://localhost:5000/api/auth/facebook/callback',
      ),
      scope: ['email'],
      profileFields: ['id', 'emails', 'name'],
    });
  }

  /** Normalizes Facebook's profile into our OAuthProfile (attached to req.user). */
  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      // Facebook only returns email if the user granted it AND their account has one.
      done(new UnauthorizedException('Facebook account has no email'), false);
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
