import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './auth.service';

/**
 * Passport JWT strategy.
 * Pulls the token from `Authorization: Bearer <token>` and validates it
 * against JWT_SECRET. The decoded payload is exposed as `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>('JWT_SECRET') ?? 'dev-secret-change-me';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // The returned object becomes `request.user`.
    return { sub: payload.sub, email: payload.email };
  }
}
