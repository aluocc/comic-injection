import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './config/app-config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Global validation pipe for DTOs.
  // The unified response interceptor + exception filter are registered via DI
  // (APP_INTERCEPTOR / APP_FILTER in AppModule) so they apply globally.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS: allow the Next.js frontend (default :3000) to call the API.
  // In production, restrict `origin` to the deployed frontend URL(s).
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Task 6: serve uploaded speaking audio (and any other uploads) under
  // /uploads/. `__dirname` is `dist/` at runtime, so `dist/../uploads` points
  // at the project-root `backend/uploads/` folder — the same path the multer
  // diskStorage in SpeakingController writes to.
  const uploadsRoot = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsRoot)) {
    mkdirSync(uploadsRoot, { recursive: true });
  }
  // Also ensure the speaking subfolder exists at boot so the first upload
  // request does not hit a missing directory.
  const speakingDir = join(uploadsRoot, 'speaking');
  if (!existsSync(speakingDir)) {
    mkdirSync(speakingDir, { recursive: true });
  }
  app.useStaticAssets(uploadsRoot, { prefix: '/uploads/' });

  const config = app.get(AppConfig);
  await app.listen(config.port);
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${config.port}`);
}
bootstrap();
