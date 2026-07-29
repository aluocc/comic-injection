import { Controller, Get } from '@nestjs/common';

/**
 * Health check endpoint: GET /health
 * Returns { status: 'ok' } which is wrapped by TransformInterceptor into
 * { code: 0, message: 'success', data: { status: 'ok' } }.
 */
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}
