import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessor around @nestjs/config for the variables used by the app.
 * Reading happens through ConfigService so env values are centralized.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  get port(): number {
    return Number(this.config.get<string>('PORT') ?? 3001);
  }

  get databaseUrl(): string {
    return this.config.get<string>('DATABASE_URL') ?? '';
  }

  get redisUrl(): string {
    return this.config.get<string>('REDIS_URL') ?? '';
  }

  get jwtSecret(): string {
    return this.config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me';
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>('JWT_EXPIRES_IN') ?? '7d';
  }
}
