import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { OAuthProfile, OAuthProviderName } from './auth.service';
import { AuthService } from './auth.service';
import { ExchangeDto } from './dto/exchange.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

/** Principal attached to the request by JwtStrategy.validate(). */
interface AuthenticatedUser {
  userId: string;
  email: string;
  isAdmin: boolean;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account and receive access + refresh tokens.',
  })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({
    summary:
      'Log in with email + password and receive access + refresh tokens.',
  })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({
    summary: 'Exchange a valid refresh token for a new access token.',
  })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the currently authenticated user.' })
  me(@Req() req: Request) {
    const user = req.user as AuthenticatedUser;
    return this.authService.profile(user.userId);
  }

  // --- OAuth (Google / Facebook) --------------------------------------------

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Start Google OAuth (redirects to the consent screen).',
  })
  googleAuth(): void {
    // Passport redirects to Google; this handler body is never reached.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: 'Google OAuth callback → redirect to the frontend with a code.',
  })
  googleCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.handleOAuthCallback(req, res, 'google');
  }

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Start Facebook OAuth (redirects to the consent screen).',
  })
  facebookAuth(): void {
    // Passport redirects to Facebook; this handler body is never reached.
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  @ApiOperation({
    summary: 'Facebook OAuth callback → redirect to the frontend with a code.',
  })
  facebookCallback(@Req() req: Request, @Res() res: Response): Promise<void> {
    return this.handleOAuthCallback(req, res, 'facebook');
  }

  @Post('exchange')
  @ApiOperation({
    summary:
      'Swap a one-time OAuth code for access + refresh tokens (single use).',
  })
  exchange(@Body() dto: ExchangeDto) {
    return this.authService.exchangeOAuthCode(dto.code);
  }

  /**
   * Shared OAuth callback: resolve/link the user, mint a one-time exchange code,
   * and redirect to the frontend with ONLY that code in the URL (never tokens).
   */
  private async handleOAuthCallback(
    req: Request,
    res: Response,
    provider: OAuthProviderName,
  ): Promise<void> {
    const profile = req.user as OAuthProfile;
    const authResponse = await this.authService.validateOAuthLogin(
      profile,
      provider,
    );
    const code = this.authService.issueOAuthExchangeCode(authResponse);
    const frontend = this.config
      .get<string>('FRONTEND_URL', 'http://localhost:4200')
      .replace(/\/$/, '');
    res.redirect(`${frontend}/auth/callback?code=${encodeURIComponent(code)}`);
  }
}
