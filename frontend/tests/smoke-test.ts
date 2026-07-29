/**
 * Smoke Test — 多语种学习平台核心 API 链路验证
 *
 * 使用 Node.js 原生 fetch（Node 18+）直接调用后端 API，验证：
 *   1. 注册 → 获取 JWT
 *   2. 登录 → 获取 JWT
 *   3. 获取语言列表
 *   4. 获取课程树
 *   5. 获取词汇列表
 *   6. 提交词汇复习评分
 *   7. 获取仪表盘数据
 *
 * 运行方式（需先启动后端服务）：
 *   npx tsx frontend/tests/smoke-test.ts
 *   # 或
 *   node --import tsx frontend/tests/smoke-test.ts
 *
 * 环境变量：
 *   API_BASE_URL — 后端地址（默认 http://localhost:3001）
 */

import assert from 'node:assert/strict';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3001';

// ── Helpers ────────────────────────────────────────────────────

interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

let passCount = 0;
let failCount = 0;

/** A simple test runner that counts pass/fail and throws on first failure. */
async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    passCount++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failCount++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${(err as Error).message}`);
    throw err; // stop on first failure
  }
}

/** Assert that an API response has code=0 (success). */
function assertSuccess<T>(res: ApiResponse<T>, label: string): T {
  assert.equal(res.code, 0, `${label}: expected code=0, got code=${res.code} (${res.message})`);
  return res.data;
}

/** Fetch wrapper that sends JSON and parses the unified envelope. */
async function apiCall<T = unknown>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: ApiResponse<T> }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = (await res.json()) as ApiResponse<T>;
  return { status: res.status, body: json };
}

// ── Test data ─────────────────────────────────────────────────

const timestamp = Date.now();
const email = `smoke-${timestamp}@test.com`;
const password = 'Password123';
const nickname = `SmokeTester`;

// ── Main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\n🚀 Smoke Test — ${API_BASE_URL}\n`);

  let token = '';
  let userId = '';

  // ── 1. Health check ─────────────────────────────────────────
  console.log('▸ 健康检查');
  await test('GET /health returns 200', async () => {
    const { status, body } = await apiCall<{ status: string }>('GET', '/health');
    assert.equal(status, 200);
    assertSuccess(body, 'GET /health');
    assert.equal(body.data.status, 'ok');
  });

  // ── 2. Register ─────────────────────────────────────────────
  console.log('▸ 注册');
  await test('POST /auth/register — success', async () => {
    const { status, body } = await apiCall<{ token: string; user: { id: string; email: string } }>(
      'POST',
      '/auth/register',
      { email, password, nickname },
    );
    assert.equal(status, 201);
    const data = assertSuccess(body, 'POST /auth/register');
    assert.ok(data.token, 'token should be present');
    assert.equal(data.user.email, email);
    token = data.token;
    userId = data.user.id;
  });

  // ── 3. Login ────────────────────────────────────────────────
  console.log('▸ 登录');
  await test('POST /auth/login — success', async () => {
    const { status, body } = await apiCall<{ token: string; user: { id: string } }>(
      'POST',
      '/auth/login',
      { account: email, password },
    );
    assert.equal(status, 201);
    const data = assertSuccess(body, 'POST /auth/login');
    assert.ok(data.token, 'token should be present');
    assert.equal(data.user.id, userId);
    // Use the login token for subsequent calls
    token = data.token;
  });

  // ── 4. Auth/me ──────────────────────────────────────────────
  console.log('▸ 当前用户');
  await test('GET /auth/me — returns user info', async () => {
    const { status, body } = await apiCall<{ id: string; email: string }>(
      'GET',
      '/auth/me',
      undefined,
      token,
    );
    assert.equal(status, 200);
    const data = assertSuccess(body, 'GET /auth/me');
    assert.equal(data.id, userId);
    assert.equal(data.email, email);
  });

  // ── 5. Courses — list languages ─────────────────────────────
  console.log('▸ 课程');
  await test('GET /courses/languages — returns language list', async () => {
    const { status, body } = await apiCall<Array<{ code: string; name: string }>>(
      'GET',
      '/courses/languages',
    );
    assert.equal(status, 200);
    const languages = assertSuccess(body, 'GET /courses/languages');
    assert.ok(Array.isArray(languages), 'languages should be an array');
    assert.ok(languages.length > 0, 'should have at least one language');
  });

  // ── 6. Courses — get tree ───────────────────────────────────
  let firstLessonId = '';
  await test('GET /courses/languages/english/tree — returns tree', async () => {
    const { status, body } = await apiCall<{
      code: string;
      levels: Array<{
        units: Array<{
          lessons: Array<{ id: string; title: string; type: string }>;
        }>;
      }>;
    }>('GET', '/courses/languages/english/tree', undefined, token);

    // Tree might 404 if english doesn't exist in the DB
    if (status === 404) {
      console.log('    (skipped — english language not seeded)');
      return;
    }

    assert.equal(status, 200);
    const tree = assertSuccess(body, 'GET /courses/languages/english/tree');
    assert.equal(tree.code, 'english');

    // Try to find the first lesson
    for (const level of tree.levels ?? []) {
      for (const unit of level.units ?? []) {
        for (const lesson of unit.lessons ?? []) {
          firstLessonId = lesson.id;
          break;
        }
      }
    }
  });

  // ── 7. Vocabulary ───────────────────────────────────────────
  console.log('▸ 词汇');
  await test('GET /vocabulary/lesson/:lessonId — returns vocab list', async () => {
    if (!firstLessonId) {
      console.log('    (skipped — no lesson available)');
      return;
    }
    const { status, body } = await apiCall<Array<{ id: string; word: string }>>(
      'GET',
      `/vocabulary/lesson/${firstLessonId}`,
    );
    assert.equal(status, 200);
    const vocab = assertSuccess(body, 'GET /vocabulary/lesson');
    assert.ok(Array.isArray(vocab), 'vocab should be an array');
  });

  // ── 8. Submit vocabulary review ──────────────────────────────
  await test('POST /vocabulary/:id/review — submit review grade', async () => {
    if (!firstLessonId) {
      console.log('    (skipped — no lesson available)');
      return;
    }

    // First get the vocabulary list to find a vocab ID
    const vocabRes = await apiCall<Array<{ id: string }>>(
      'GET',
      `/vocabulary/lesson/${firstLessonId}`,
    );
    const vocabList = vocabRes.body.data;
    if (!vocabList || vocabList.length === 0) {
      console.log('    (skipped — no vocabulary in lesson)');
      return;
    }

    const vocabId = vocabList[0].id;
    const { status, body } = await apiCall<{ id: string; srsRepetitions: number }>(
      'POST',
      `/vocabulary/${vocabId}/review`,
      { grade: 'GOOD' },
      token,
    );
    assert.equal(status, 201);
    assertSuccess(body, 'POST /vocabulary/:id/review');
  });

  // ── 9. Grammar ──────────────────────────────────────────────
  console.log('▸ 语法');
  await test('GET /grammar/lesson/:lessonId — returns questions', async () => {
    if (!firstLessonId) {
      console.log('    (skipped — no lesson available)');
      return;
    }
    const { status, body } = await apiCall<Array<{ id: string; question: string }>>(
      'GET',
      `/grammar/lesson/${firstLessonId}`,
    );
    assert.equal(status, 200);
    const questions = assertSuccess(body, 'GET /grammar/lesson');
    assert.ok(Array.isArray(questions), 'questions should be an array');

    // Verify answer field is NOT exposed
    if (questions.length > 0) {
      assert.equal(
        (questions[0] as Record<string, unknown>).answer,
        undefined,
        'answer must not be exposed in list endpoint',
      );
    }
  });

  // ── 10. Progress — complete a lesson ────────────────────────
  console.log('▸ 进度');
  await test('POST /progress/lesson/:id/complete — marks lesson complete', async () => {
    if (!firstLessonId) {
      console.log('    (skipped — no lesson available)');
      return;
    }
    const { status, body } = await apiCall<{
      lessonProgress: { status: string };
      streak: { count: number; lastDate: string };
    }>(
      'POST',
      `/progress/lesson/${firstLessonId}/complete`,
      { accuracy: 0.9, timeSpent: 300 },
      token,
    );
    assert.equal(status, 201);
    const data = assertSuccess(body, 'POST /progress/lesson/:id/complete');
    assert.equal(data.lessonProgress.status, 'COMPLETED');
    assert.ok(data.streak.count >= 1, 'streak should be at least 1');
  });

  // ── 11. Dashboard ───────────────────────────────────────────
  await test('GET /progress/dashboard — returns dashboard data', async () => {
    const { status, body } = await apiCall<{
      streak: { count: number };
      totalCompletedLessons: number;
      totalStudySeconds: number;
      languages: unknown[];
      dailyTimes: unknown[];
    }>('GET', '/progress/dashboard', undefined, token);
    assert.equal(status, 200);
    const data = assertSuccess(body, 'GET /progress/dashboard');
    assert.ok(typeof data.streak.count === 'number');
    assert.ok(typeof data.totalCompletedLessons === 'number');
    assert.ok(Array.isArray(data.dailyTimes));
    assert.equal(data.dailyTimes.length, 7, 'dailyTimes should have 7 buckets');
  });

  // ── 12. Community ────────────────────────────────────────────
  console.log('▸ 社区');
  await test('GET /community/circles — returns circle list', async () => {
    const { status, body } = await apiCall<Array<{ languageCode: string }>>(
      'GET',
      '/community/circles',
    );
    assert.equal(status, 200);
    const circles = assertSuccess(body, 'GET /community/circles');
    assert.ok(Array.isArray(circles));
  });

  // ── 13. Auth guard ───────────────────────────────────────────
  console.log('▸ 鉴权验证');
  await test('GET /auth/me without token → 401', async () => {
    const { status, body } = await apiCall('GET', '/auth/me');
    assert.equal(status, 401);
    assert.notEqual(body.code, 0, 'should not be success');
    assert.equal(body.data, null);
  });

  await test('POST /progress/lesson/:id/complete without token → 401', async () => {
    const { status } = await apiCall(
      'POST',
      `/progress/lesson/${firstLessonId || 'any'}/complete`,
      { accuracy: 0.5, timeSpent: 60 },
    );
    assert.equal(status, 401);
  });

  // ── Summary ─────────────────────────────────────────────────
  console.log(`\n✅ ${passCount} passed, ${failCount} failed\n`);
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n💥 Smoke test failed:', err);
  console.log(`\n✅ ${passCount} passed, ${failCount} failed\n`);
  process.exit(1);
});
