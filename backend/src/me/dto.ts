import { IsObject } from 'class-validator';

export class TasteProfileDto {
  // { cuisines?, price_bands?, vibes?, occasions? } - shape owned by the app.
  @IsObject()
  onboarding!: Record<string, unknown>;
}
