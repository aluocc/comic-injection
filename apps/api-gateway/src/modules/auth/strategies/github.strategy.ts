// apps/api-gateway/src/modules/auth/strategies/github.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.get<string>('oauth.github.clientId') ?? '',
      clientSecret: config.get<string>('oauth.github.clientSecret') ?? '',
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(_accessToken: string, _refresh: string, profile: any, done: any) {
    done(null, profile);
  }
}
