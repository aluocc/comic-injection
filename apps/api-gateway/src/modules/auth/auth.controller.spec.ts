// apps/api-gateway/src/modules/auth/auth.controller.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { UserEntity } from '../../database/entities/user.entity';
import { OauthAccountEntity } from '../../database/entities/oauth-account.entity';
import { AuthModule } from './auth.module';
import configuration from '../../config/configuration';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgres://mdp:mdp_dev@localhost:5432/mdp_test';
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          url: 'postgres://mdp:mdp_dev@localhost:5432/mdp_test',
          entities: [UserEntity, OauthAccountEntity],
          synchronize: true,
        }),
        AuthModule,
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('registers a user then logs in', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'u1@example.com', password: 'password123', name: 'U1' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'u1@example.com', password: 'password123' })
      .expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('rejects duplicate registration', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'u1@example.com', password: 'password123', name: 'U1' })
      .expect(409);
  });
});
