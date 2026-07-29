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
 * Course e2e — exercises GET /courses/languages and
 * GET /courses/languages/:code/tree.
 *
 * PrismaService is mocked to return deterministic language/level/unit/lesson
 * data so we can assert the tree shape without a database.
 */
describe('Course (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  // ── Mock data ──────────────────────────────────────────────
  const languages = [
    { id: 'lang-en', code: 'english', name: '英语', icon: '🇬🇧' },
    { id: 'lang-ja', code: 'japanese', name: '日语', icon: '🇯🇵' },
  ];

  // A nested tree for `english` with one level → one unit → one lesson.
  const englishTree = {
    id: 'lang-en',
    code: 'english',
    name: '英语',
    icon: '🇬🇧',
    levels: [
      {
        id: 'level-a1',
        languageId: 'lang-en',
        code: 'A1',
        name: '入门',
        order: 1,
        units: [
          {
            id: 'unit-1',
            levelId: 'level-a1',
            title: '第一单元',
            description: '基础问候',
            order: 1,
            lessons: [
              {
                id: 'lesson-1',
                unitId: 'unit-1',
                title: 'Hello',
                description: '问候语',
                order: 1,
                type: 'vocabulary',
                duration: 10,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            ],
          },
        ],
      },
    ],
  };

  const lessonDetail = {
    id: 'lesson-1',
    unitId: 'unit-1',
    title: 'Hello',
    description: '问候语',
    order: 1,
    type: 'vocabulary',
    duration: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    unit: {
      id: 'unit-1',
      levelId: 'level-a1',
      title: '第一单元',
      description: '基础问候',
      order: 1,
      level: {
        id: 'level-a1',
        languageId: 'lang-en',
        code: 'A1',
        name: '入门',
        order: 1,
      },
    },
  };

  beforeEach(async () => {
    prismaMock = createMockPrismaService();

    // AchievementService.onModuleInit badge seeding defaults
    prismaMock.badge.findUnique.mockResolvedValue(null);
    prismaMock.badge.create.mockResolvedValue({ id: 'b1', code: 'x', name: 'x', description: '', icon: '', category: '' });

    const redisMock = createMockRedisService();

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
  // GET /courses/languages
  // ---------------------------------------------------------------

  it('GET /courses/languages — returns language list', async () => {
    prismaMock.language.findMany.mockResolvedValue(languages);

    const res = await request(app.getHttpServer())
      .get('/courses/languages')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0]).toMatchObject({
      id: 'lang-en',
      code: 'english',
      name: '英语',
      icon: '🇬🇧',
    });
  });

  it('GET /courses/languages — empty list when no data', async () => {
    prismaMock.language.findMany.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get('/courses/languages')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  // ---------------------------------------------------------------
  // GET /courses/languages/:code/tree
  // ---------------------------------------------------------------

  it('GET /courses/languages/english/tree — returns full tree (anonymous)', async () => {
    prismaMock.language.findUnique.mockResolvedValue(englishTree);
    // userLessonProgress.findMany should NOT be called without a JWT
    prismaMock.userLessonProgress.findMany.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get('/courses/languages/english/tree')
      .expect(200);

    expect(res.body.code).toBe(0);
    const tree = res.body.data;
    expect(tree.code).toBe('english');
    expect(tree.name).toBe('英语');
    expect(tree.levels).toHaveLength(1);

    const level = tree.levels[0];
    expect(level.code).toBe('A1');
    expect(level.units).toHaveLength(1);

    const unit = level.units[0];
    expect(unit.title).toBe('第一单元');
    expect(unit.lessons).toHaveLength(1);

    const lesson = unit.lessons[0];
    expect(lesson.title).toBe('Hello');
    expect(lesson.type).toBe('vocabulary');
    // Anonymous request → no userProgress attached
    expect(lesson.userProgress).toBeNull();
  });

  it('GET /courses/languages/:code/tree — attaches userProgress with JWT', async () => {
    prismaMock.language.findUnique.mockResolvedValue(englishTree);
    prismaMock.userLessonProgress.findMany.mockResolvedValue([
      {
        id: 'ulp-1',
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'COMPLETED',
        accuracy: 0.9,
        timeSpent: 300,
        completedAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .get('/courses/languages/english/tree')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.code).toBe(0);
    const lesson = res.body.data.levels[0].units[0].lessons[0];
    expect(lesson.userProgress).not.toBeNull();
    expect(lesson.userProgress.status).toBe('COMPLETED');
    expect(lesson.userProgress.accuracy).toBe(0.9);
  });

  it('GET /courses/languages/unknown/tree — 404', async () => {
    prismaMock.language.findUnique.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .get('/courses/languages/unknown/tree')
      .expect(404);

    expect(res.body.code).toBe(1004); // ErrorCode.NOT_FOUND
    expect(res.body.data).toBeNull();
  });

  // ---------------------------------------------------------------
  // GET /courses/lessons/:lessonId
  // ---------------------------------------------------------------

  it('GET /courses/lessons/:lessonId — returns lesson detail', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(lessonDetail);

    const res = await request(app.getHttpServer())
      .get('/courses/lessons/lesson-1')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data.id).toBe('lesson-1');
    expect(res.body.data.title).toBe('Hello');
    expect(res.body.data.unit.title).toBe('第一单元');
    expect(res.body.data.level.code).toBe('A1');
  });

  it('GET /courses/lessons/:lessonId — 404 when not found', async () => {
    prismaMock.lesson.findUnique.mockResolvedValue(null);

    const res = await request(app.getHttpServer())
      .get('/courses/lessons/nonexistent')
      .expect(404);

    expect(res.body.code).toBe(1004);
    expect(res.body.data).toBeNull();
  });
});
