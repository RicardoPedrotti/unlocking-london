import { Body, Controller, HttpCode, NotImplementedException, Post } from '@nestjs/common';
import { DirectusService } from '../directus/directus.service';
import { AppleDto, LoginDto, LogoutDto, RefreshDto } from './dto';

// Thin proxy to Directus /auth/*. Directus returns { access_token, refresh_token, expires }.
@Controller('auth')
export class AuthController {
  constructor(private readonly directus: DirectusService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.directus.authPost('/auth/login', { email: dto.email, password: dto.password });
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.directus.authPost('/auth/refresh', { refresh_token: dto.refresh_token, mode: 'json' });
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: LogoutDto): Promise<void> {
    await this.directus.authPost('/auth/logout', { refresh_token: dto.refresh_token, mode: 'json' });
  }

  @Post('apple')
  apple(@Body() _dto: AppleDto) {
    // EXTENSION POINT: Sign in with Apple.
    // When Directus has an Apple identity flow, implement here:
    //   1. Verify `identityToken` (JWT) against Apple's public keys
    //      (fetch https://appleid.apple.com/auth/keys, check aud = app bundle id,
    //       iss = https://appleid.apple.com, exp not passed, nonce if used).
    //   2. Find-or-create the Directus user by the Apple `sub` (or verified email);
    //      on first login persist `fullName` (Apple only sends it once).
    //   3. Issue a Directus session for that user (e.g. via the users/register +
    //      login, or a server-side session endpoint) and
    //   4. Return the SAME shape as /auth/login: { access_token, refresh_token, expires }.
    // Response shape is fixed so the app wires in once and never changes.
    throw new NotImplementedException('Sign in with Apple is not enabled yet.');
  }
}
