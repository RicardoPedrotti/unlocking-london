import { Body, Controller, Get, Headers, Put, UseGuards } from '@nestjs/common';
import { BearerGuard } from '../common/bearer.guard';
import { DirectusService } from '../directus/directus.service';
import { TasteProfileDto } from './dto';

// All calls forward the app user's Bearer so Directus enforces per-user authz.
@Controller('me')
@UseGuards(BearerGuard)
export class MeController {
  constructor(private readonly directus: DirectusService) {}

  @Get()
  me(@Headers('authorization') auth: string) {
    return this.directus.withUserToken(auth, (c) =>
      c.get('/users/me', { query: { fields: 'id,email,first_name' } }),
    );
  }

  @Get('taste-profile')
  getTasteProfile(@Headers('authorization') auth: string) {
    return this.directus.withUserToken(auth, async (c) => {
      // Read permission is scoped to the current user, so limit=1 = own profile.
      const rows = await c.get('/items/taste_profiles', { query: { fields: '*', limit: 1 } });
      return rows?.[0] ?? null;
    });
  }

  @Put('taste-profile')
  putTasteProfile(@Headers('authorization') auth: string, @Body() dto: TasteProfileDto) {
    return this.directus.withUserToken(auth, async (c) => {
      const body = { onboarding: dto.onboarding, updated_at: new Date().toISOString() };
      const existing = await c.get('/items/taste_profiles', { query: { fields: 'id', limit: 1 } });
      const current = existing?.[0];
      if (current) return c.patch(`/items/taste_profiles/${current.id}`, body);
      // On create Directus sets `user` from the App User preset ($CURRENT_USER).
      return c.post('/items/taste_profiles', body);
    });
  }
}
