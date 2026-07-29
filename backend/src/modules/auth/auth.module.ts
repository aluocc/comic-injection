import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { AppConfig } from '../../config/app-config';
import { ConfigConfigModule } from '../../config/config.module';

/**
 * AuthModule: wires JwtModule with async config (reads JWT_SECRET / JWT_EXPIRES_IN
 * via AppConfig), registers Passport's JWT strategy, and exposes the
 * register/login/me endpoints.
 *
 * `ConfigConfigModule` is imported inside `JwtModule.registerAsync` so that
 * `AppConfig` is resolvable from the JwtModule's internal injector.
 */
@Module({
  imports: [
    ConfigConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigConfigModule],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: {
          expiresIn: config.jwtExpiresIn as StringValue,
        },
      }),
      inject: [AppConfig],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
