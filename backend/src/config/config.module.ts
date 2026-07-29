import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfig } from './app-config';

/**
 * Global config module: loads the .env file and exposes ConfigService + AppConfig.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.example'],
      ignoreEnvFile: false,
    }),
  ],
  providers: [AppConfig],
  exports: [ConfigModule, AppConfig],
})
export class ConfigConfigModule {}
