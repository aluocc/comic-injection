import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { RedisService } from './../src/redis/redis.service';
import {
  createMockPrismaService,
  createMockRedisService,
} from './helpers/mock-providers';

/**
 * Progress e2e — exercises POST /progress/lesson/:lessonId/complete and
 * validates the three streak rules:
 *   1. lastDate === today     → count stays the same (no double-increment)
 *   2. lastDate === yesterday → count + 1
 *   3. lastDate is older/absent → count resets to 1
 *
 * Both PrismaService and RedisService are mocked so no DB/Redis connection is
 * needed. The JWT is real (signed by JwtService) so the JwtAuthGuard is
 * exercised end-to-end.
 */

// ── Date helpers (must match ProgressService's server-local logic) ──────
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatDateString(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayString(): string {
  return formatDateString(new Date());
}

function yesterdayString(): string {
  return formatDateString(new Date(Date.now() - ONE_DAY_MS));
}

function olderString(): string {
  return formatDateString(new Date(Date.now() - 5 * ONE_DAY_MS));
}

describe('Progress (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;
  let redisMock: ReturnType<typeof createMockRedisService>;
  let token: string;

  // ── Mock data ──────────────────────────────────────────────
  const mockLesson = { id: 'lesson-1' };

  const mockProgressRow = {
    id: 'ulp-1',
    userId: 'user-1',
    lessonId: 'lesson-1',
    status: 'COMPLETED',
    accuracy: 0.85,
    timeSpent: 300,
    completedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prismaMock = createMockPrismaService();
    redisMock = createMockRedisService();

    // AchievementService.onModuleInit badge seeding defaults
    prismaMock.badge.findUnique.mockResolvedValue(null);
    prismaMock.badge.create.mockResolvedValue({ id: 'b1', code: 'x', name: 'x', description: '', icon: '', category: '' });

    // Default Prisma mocks for the complete endpoint
    prismaMock.lesson.findUnique.mockResolvedValue(mockLesson);
    prismaMock.userLessonProgress.upsert.mockResolvedValue(mockProgressRow);

    // Default Redis: no existing streak
    const client = redisMock.getClient();
    client.get.mockResolvedValue(null);
    client.set.mockResolvedValue('OK');
    // Leaderboard update mocks (called by AchievementService.updateLeaderboard)
    client.zincrby.mockResolvedValue('1');
    client.ttl.mockResolvedValue(-1);
    client.expire.mockResolvedValue(1);

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
    token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  // ---------------------------------------------------------------
  // POST /progress/lesson/:lessonId/complete
  // ---------------------------------------------------------------

  it('POST /progress/lesson/:id/complete — updates progress and returns COMPLETED', async () => {
    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 0.85, timeSpent: 300 })
      .expect(201);

    expect(res.body.code).toBe(0);

    const { lessonProgress, streak } = res.body.data;
    expect(lessonProgress.status).toBe('COMPLETED');
    expect(lessonProgress.accuracy).toBe(0.85);
    expect(lessonProgress.timeSpent).toBe(300);
    expect(lessonProgress.lessonId).toBe('lesson-1');

    // Streak should be 1 (no prior streak in Redis)
    expect(streak.count).toBe(1);
    expect(streak.lastDate).toBe(todayString());

    // Verify upsert was called with the right data
    expect(prismaMock.userLessonProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_lessonId: { userId: 'user-1', lessonId: 'lesson-1' } },
        update: expect.objectContaining({
          status: 'COMPLETED',
          accuracy: 0.85,
          timeSpent: 300,
        }),
      }),
    );
  });

  it('POST /progress/lesson/:id/complete — without JWT → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .send({ accuracy: 0.5, timeSpent: 60 })
      .expect(401);

    expect(res.body.data).toBeNull();
  });

  it('POST /progress/lesson/:id/complete — nonexistent lesson → 404', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/nonexistent/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 0.5, timeSpent: 60 })
      .expect(404);

    expect(res.body.code).toBe(1004);
    expect(res.body.data).toBeNull();
  });

  // ---------------------------------------------------------------
  // Streak logic: three rules
  // ---------------------------------------------------------------

  it('streak rule — lastDate is today → count NOT incremented', async () => {
    const client = redisMock.getClient();
    // Simulate: user already completed a lesson today, count=3
    client.get.mockResolvedValue(
      JSON.stringify({ count: 3, lastDate: todayString() }),
    );

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 1, timeSpent: 120 })
      .expect(201);

    const { streak } = res.body.data;
    expect(streak.count).toBe(3); // unchanged
    expect(streak.lastDate).toBe(todayString());

    // Verify the new streak was persisted to Redis
    expect(client.set).toHaveBeenCalledWith(
      'streak:user-1',
      JSON.stringify({ count: 3, lastDate: todayString() }),
    );
  });

  it('streak rule — lastDate is yesterday → count + 1', async () => {
    const client = redisMock.getClient();
    // Simulate: user completed a lesson yesterday, count=3
    client.get.mockResolvedValue(
      JSON.stringify({ count: 3, lastDate: yesterdayString() }),
    );

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 1, timeSpent: 120 })
      .expect(201);

    const { streak } = res.body.data;
    expect(streak.count).toBe(4); // incremented
    expect(streak.lastDate).toBe(todayString());
  });

  it('streak rule — lastDate is older → count reset to 1', async () => {
    const client = redisMock.getClient();
    // Simulate: user had a streak 5 days ago, count=10
    client.get.mockResolvedValue(
      JSON.stringify({ count: 10, lastDate: olderString() }),
    );

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 1, timeSpent: 120 })
      .expect(201);

    const { streak } = res.body.data;
    expect(streak.count).toBe(1); // reset
    expect(streak.lastDate).toBe(todayString());
  });

  it('streak rule — no prior streak (null) → count = 1', async () => {
    const client = redisMock.getClient();
    client.get.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 1, timeSpent: 120 })
      .expect(201);

    const { streak } = res.body.data;
    expect(streak.count).toBe(1);
    expect(streak.lastDate).toBe(todayString());
  });

  it('streak rule — corrupted Redis value → count = 1 (graceful fallback)', async () => {
    const client = redisMock.getClient();
    client.get.mockResolvedValue('not-valid-json');

    const res = await request(app.getHttpServer())
      .post('/progress/lesson/lesson-1/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({ accuracy: 1, timeSpent: 120 })
      .expect(201);

    const { streak } = res.body.data;
    expect(streak.count).toBe(1);
    expect(streak.lastDate).toBe(todayString());
  });

  // ---------------------------------------------------------------
  // GET /progress/dashboard
  // ---------------------------------------------------------------

  it('GET /progress/dashboard — returns aggregated dashboard', async () => {
    const client = redisMock.getClient();
    // Existing streak in Redis
    client.get.mockResolvedValue(
      JSON.stringify({ count: 5, lastDate: todayString() }),
    );

    // Progress rows
    prismaMock.userLessonProgress.findMany.mockResolvedValue([
      mockProgressRow,
    ]);

    // Language tree with one lesson
    prismaMock.language.findMany.mockResolvedValue([
      {
        id: 'lang-en',
        code: 'english',
        name: '英语',
        levels: [
          {
            id: 'level-a1',
            units: [
              {
                id: 'unit-1',
                lessons: [{ id: 'lesson-1' }],
              },
            ],
          },
        ],
      },
    ]);

    // Recent lesson context
    prismaMock.lesson.findMany.mockResolvedValue([
      {
        id: 'lesson-1',
        title: 'Hello',
        unit: {
          id: 'unit-1',
          level: {
            id: 'level-a1',
            language: { id: 'lang-en', code: 'english', name: '英语' },
          },
        },
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/progress/dashboard')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    const data = res.body.data;

    expect(data.streak.count).toBe(5);
    expect(data.totalCompletedLessons).toBe(1);
    expect(data.totalStudySeconds).toBe(300);
    expect(data.languages).toHaveLength(1);
    expect(data.languages[0]).toMatchObject({
      languageCode: 'english',
      languageName: '英语',
      totalLessons: 1,
      completedLessons: 1,
    });
    // dailyTimes should be a 7-element array
    expect(data.dailyTimes).toHaveLength(7);
    // recentLessons should have at most 5 entries
    expect(data.recentLessons.length).toBeLessThanOrEqual(5);
  });

  it('GET /progress/dashboard — without JWT → 401', async () => {
    const res = await request(app.getHttpServer())
      .get('/progress/dashboard')
      .expect(401);

    expect(res.body.data).toBeNull();
  });
});
