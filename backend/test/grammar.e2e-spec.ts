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
 * Grammar e2e — exercises GET /grammar/lesson/:lessonId and
 * POST /grammar/:questionId/check.
 *
 * The list endpoint must NOT include `answer` or `explanation` so clients
 * cannot peek at the solution. The check endpoint grades the submitted answer
 * case-insensitively and records the attempt.
 */
describe('Grammar (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let prismaMock: ReturnType<typeof createMockPrismaService>;

  // ── Mock data ──────────────────────────────────────────────
  const mockQuestions = [
    {
      id: 'gq-1',
      lessonId: 'lesson-1',
      languageCode: 'english',
      type: 'MULTIPLE_CHOICE',
      question: 'Choose the correct article: ___ apple',
      options: ['a', 'an', 'the'],
      answer: 'an',
      explanation: 'Use "an" before a vowel sound.',
      createdAt: new Date(),
    },
    {
      id: 'gq-2',
      lessonId: 'lesson-1',
      languageCode: 'english',
      type: 'FILL_BLANK',
      question: 'She ___ (go) to school every day.',
      options: null,
      answer: 'goes',
      explanation: 'Third person singular present tense.',
      createdAt: new Date(),
    },
  ];

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
  // GET /grammar/lesson/:lessonId
  // ---------------------------------------------------------------

  it('GET /grammar/lesson/:lessonId — returns questions WITHOUT answer', async () => {
    prismaMock.grammarQuestion.findMany.mockResolvedValue(mockQuestions);

    const res = await request(app.getHttpServer())
      .get('/grammar/lesson/lesson-1')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data).toHaveLength(2);

    const q = res.body.data[0];
    expect(q.id).toBe('gq-1');
    expect(q.type).toBe('MULTIPLE_CHOICE');
    expect(q.question).toBe('Choose the correct article: ___ apple');
    expect(q.options).toEqual(['a', 'an', 'the']);

    // CRITICAL: answer and explanation must NOT be exposed to the client
    expect(q.answer).toBeUndefined();
    expect(q.explanation).toBeUndefined();
  });

  it('GET /grammar/lesson/:lessonId — empty list for new lesson', async () => {
    prismaMock.grammarQuestion.findMany.mockResolvedValue([]);

    const res = await request(app.getHttpServer())
      .get('/grammar/lesson/empty-lesson')
      .expect(200);

    expect(res.body.code).toBe(0);
    expect(res.body.data).toEqual([]);
  });

  // ---------------------------------------------------------------
  // POST /grammar/:questionId/check
  // ---------------------------------------------------------------

  it('POST /grammar/:questionId/check — correct answer (JWT)', async () => {
    prismaMock.grammarQuestion.findUnique.mockResolvedValue(mockQuestions[0]);
    prismaMock.userGrammarAttempt.create.mockResolvedValue({
      id: 'attempt-1',
      userId: 'user-1',
      questionId: 'gq-1',
      userAnswer: 'an',
      isCorrect: true,
      attemptedAt: new Date(),
    });

    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .post('/grammar/gq-1/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAnswer: 'an' })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.data.isCorrect).toBe(true);
    expect(res.body.data.correctAnswer).toBe('an');
    expect(res.body.data.explanation).toBe('Use "an" before a vowel sound.');

    // Verify the attempt was persisted
    expect(prismaMock.userGrammarAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          questionId: 'gq-1',
          userAnswer: 'an',
          isCorrect: true,
        }),
      }),
    );
  });

  it('POST /grammar/:questionId/check — wrong answer (JWT)', async () => {
    prismaMock.grammarQuestion.findUnique.mockResolvedValue(mockQuestions[0]);
    prismaMock.userGrammarAttempt.create.mockResolvedValue({});

    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .post('/grammar/gq-1/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAnswer: 'a' })
      .expect(201);

    expect(res.body.code).toBe(0);
    expect(res.body.data.isCorrect).toBe(false);
    expect(res.body.data.correctAnswer).toBe('an');
  });

  it('POST /grammar/:questionId/check — case-insensitive matching', async () => {
    prismaMock.grammarQuestion.findUnique.mockResolvedValue(mockQuestions[1]);
    prismaMock.userGrammarAttempt.create.mockResolvedValue({});

    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .post('/grammar/gq-2/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAnswer: '  GOES  ' }) // leading/trailing spaces + uppercase
      .expect(201);

    expect(res.body.data.isCorrect).toBe(true);
  });

  it('POST /grammar/:questionId/check — without JWT → 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/grammar/gq-1/check')
      .send({ userAnswer: 'an' })
      .expect(401);

    expect(res.body.data).toBeNull();
  });

  it('POST /grammar/:questionId/check — nonexistent question → 404', async () => {
    prismaMock.grammarQuestion.findUnique.mockResolvedValue(null);

    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .post('/grammar/nonexistent/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAnswer: 'an' })
      .expect(404);

    expect(res.body.code).toBe(1004); // ErrorCode.NOT_FOUND
    expect(res.body.data).toBeNull();
  });

  it('POST /grammar/:questionId/check — empty userAnswer → 400', async () => {
    const token = await jwtService.signAsync({ sub: 'user-1', email: 't@e.com' });

    const res = await request(app.getHttpServer())
      .post('/grammar/gq-1/check')
      .set('Authorization', `Bearer ${token}`)
      .send({ userAnswer: '' })
      .expect(400);

    expect(res.body.data).toBeNull();
  });
});
