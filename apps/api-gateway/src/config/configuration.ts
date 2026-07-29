// apps/api-gateway/src/config/configuration.ts
export default () => ({
  port: parseInt(process.env.API_PORT ?? '3000', 10),
  database: { url: process.env.DATABASE_URL },
  redis: { url: process.env.REDIS_URL },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'dev-secret',
    accessTtl: '15m',
    refreshTtl: '7d',
  },
  encryption: {
    masterKey: process.env.MASTER_ENCRYPTION_KEY ?? 'base64:ZGV2LW1hc3Rlci1rZXktMTYtYnl0ZXM=',
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT ?? 'http://localhost:9000',
    accessKey: process.env.S3_ACCESS_KEY ?? 'minio',
    secretKey: process.env.S3_SECRET_KEY ?? 'minio_dev',
    bucket: process.env.S3_BUCKET ?? 'mdp-assets',
  },
  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      callbackUrl: process.env.OAUTH_CALLBACK_URL ?? 'http://localhost:5173/auth/callback/github',
    },
  },
  cors: { origin: (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',') },
  internalSecret: process.env.INTERNAL_SECRET ?? 'dev-internal',
});
