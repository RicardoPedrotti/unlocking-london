import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DirectusModule } from './directus/directus.module';
import { PlacesModule } from './places/places.module';
import { TaxonomyModule } from './taxonomy/taxonomy.module';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { AssetsModule } from './assets/assets.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DirectusModule,
    PlacesModule,
    TaxonomyModule,
    AuthModule,
    MeModule,
    AssetsModule,
    HealthModule,
  ],
})
export class AppModule {}
