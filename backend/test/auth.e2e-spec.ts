import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { RedisService } from './../src/redis/redis.service';
import {
  createMockPrismaService,
  createMockRedisService,
} from './helpers/mock-providers';

/**
 * Auth e2e — exercises POST /auth/register, POST /auth/login, GET /auth/me.
 *
 * PrismaService and RedisService are replaced with in-memory jest mocks so the
 * test runs without PostgreSQL / Redis. bcrypt hashing is real (only ~100 ms
 * per test) and JwtModule is real so that token signing/verification is
 * exercised end-to-end.
 *
 * Responses are wrapped by the global TransformInterceptor into
 * { code: 0, message: 'success', data } and errors by HttpExceptionFilter into
 * { code, message, data: null }.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let redisMock: ReturnType<typeof createMockRedisService>;

  // A pre-hashed password so the login test can verify bcrypt.compare without
  // re-hashing on every run.
  const PASSWORD = 'Password123';
  let passwordHash: string;

  // The mock user row returned by prisma.user.findUnique / findFirst.
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    phone: null,
    passwordHash: '', // set in beforeAll
    nickname: 'Tester',
    avatar: null,
    targetLanguage: null,
    currentLevel: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 10);
    mockUser.passwordHash = passwordHash;
  });

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    redisMock = createMockRedisService();

    // Default: badge seeding finds nothing → creates stubs (no-op mock).
    prismaMock.badge.findUnique.mockResolvedValue(null);
    prismaMock.badge.create.mockResolvedValue({
      id: 'badge-1',
      code: 'stub',
      name: 'stub',
      description: '',
      icon: '',
      category: '',
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(RedisService)
      .useValue(redisMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  // ---------------------------------------------------------------
  // POST /auth/register
  // ---------------------------------------------------------------

  it('POST /auth/register — success (201 + token + user)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null); // email not taken
    prismaMock.user.create.mockResolvedValue(mockUser);

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: PASSWORD,
        nickname: 'Tester',
      })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.message).toBe('success');
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({
      id: 'user-1',
      email: 'test@example.com',
      nickname: 'Tester',
    });
    // Password hash must never leak into the response.
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('POST /auth/register — duplicate email → 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-user' });

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: PASSWORD,
        nickname: 'Tester',
      })
      .expect(409);

    expect(res.body.code).toBe(1001); // ErrorCode.VALIDATION_FAILED
    expect(res.body.data).toBeNull();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('POST /auth/register — invalid DTO → 400', async () => {
    // password too short and missing nickname
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'bad@example.com', password: 'short', nickname: '' })
      .expect(400);

    expect(res.body.data).toBeNull();
  });

  // ---------------------------------------------------------------
  // POST /auth/login
  // ---------------------------------------------------------------

  it('POST /auth/login — success (201 + token + user)', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ account: 'test@example.com', password: PASSWORD })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.id).toBe('user-1');
  });

  it('POST /auth/login — wrong password → 401', async () => {
    prismaMock.user.findFirst.mockResolvedValue(mockUser);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ account: 'test@example.com', password: 'WrongPass456' })
      .expect(401);

    expect(res.body.code).toBe(1002); // ErrorCode.UNAUTHORIZED
    expect(res.body.data).toBeNull();
  });

  it('POST /auth/login — unknown user → 401', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ account: 'nobody@example.com', password: PASSWORD })
      .expect(401);

    expect(res.body.code).toBe(1002);
    expect(res.body.data).toBeNull();
  });

  // ---------------------------------------------------------------
  // GET /auth/me
  // ---------------------------------------------------------------

  it('GET /auth/me — with valid JWT → 200 + user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const token = await jwtService.signAsync({ sub: 'user-1', email: 'test@example.com' });

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.id).toBe('user-1');
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('GET /auth/me — without JWT → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .expect(401);

    expect(res.body.data).toBeNull();
  });

  it('GET /auth/me — with invalid JWT → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);

    expect(res.body.data).toBeNull();
  });
});
