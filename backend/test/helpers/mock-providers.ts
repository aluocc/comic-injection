/**
 * Shared mock factories for e2e tests.
 *
 * The real PrismaService / RedisService try to connect to PostgreSQL / Redis
 * on init. In the sandbox (and CI without infrastructure) those connections
 * fail, so we replace both providers with in-memory jest mocks that return
 * deterministic data. Each test file can override individual mock return
 * values via `mockResolvedValue` / `mockResolvedValueOnce`.
 *
 * `AchievementService` implements `OnModuleInit` and calls
 * `prisma.badge.findUnique` / `prisma.badge.create` during bootstrap for every
 * badge rule. The mock below returns `null` from `badge.findUnique` and a stub
 * row from `badge.create` so app.init() does not throw.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * A single Prisma delegate (e.g. `prisma.user`, `prisma.lesson`) — a bag of
 * jest mock functions mirroring the real PrismaClient query methods.
 */
export interface MockPrismaDelegate {
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  findMany: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
  aggregate: jest.Mock;
  groupBy: jest.Mock;
}

/**
 * A mock PrismaService. Any model name (user, language, lesson, badge,
 * grammarQuestion, …) maps to a `MockPrismaDelegate`. The index signature
 * means TypeScript allows access to any property without enumerating every
 * Prisma model upfront.
 */
export type MockPrismaService = { [key: string]: MockPrismaDelegate };

function fn(): jest.Mock {
  return jest.fn();
}

/**
 * A mock ioredis client. All methods return promises resolving to sensible
 * defaults (null / 0 / 'OK'). Tests can override individual return values.
 */
export function createMockRedisClient() {
  return {
    get: fn().mockResolvedValue(null),
    set: fn().mockResolvedValue('OK'),
    del: fn().mockResolvedValue(1),
    zincrby: fn().mockResolvedValue('1'),
    ttl: fn().mockResolvedValue(-1),
    expire: fn().mockResolvedValue(1),
    zrevrange: fn().mockResolvedValue([]),
    zscore: fn().mockResolvedValue(null),
    zrevrank: fn().mockResolvedValue(null),
    quit: fn().mockResolvedValue('OK'),
  };
}

/**
 * A mock RedisService. `getClient()` returns the shared mock client so that
 * ProgressService and AchievementService can call redis methods without a live
 * connection.
 */
export function createMockRedisService() {
  const client = createMockRedisClient();
  return {
    getClient: () => client,
    /** Direct access to the mock client for test configuration. */
    __client: client,
  };
}

/**
 * A mock PrismaService. Returns a Proxy whose every property access yields an
 * object full of jest.fn() promises. This means `prisma.user.findUnique(...)`,
 * `prisma.badge.create(...)`, etc. all work without explicit setup — they
 * resolve to `undefined` by default. Tests override specific methods via
 * `prismaMock.user.findUnique.mockResolvedValue(...)`.
 *
 * We use a Proxy rather than a static object so that any model name (user,
 * language, lesson, badge, grammarQuestion, …) is automatically available
 * without us having to enumerate every Prisma delegate.
 */
export function createMockPrismaService(): MockPrismaService {
  const cache = new Map<string, MockPrismaDelegate>();
  const proxy = new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (!cache.has(prop)) {
          cache.set(prop, {
            findUnique: fn(),
            findFirst: fn(),
            findMany: fn(),
            create: fn(),
            update: fn(),
            upsert: fn(),
            delete: fn(),
            deleteMany: fn(),
            count: fn(),
            aggregate: fn(),
            groupBy: fn(),
          });
        }
        return cache.get(prop);
      },
    },
  );
  return proxy as unknown as MockPrismaService;
}
