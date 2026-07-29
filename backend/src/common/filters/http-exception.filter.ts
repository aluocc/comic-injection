import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../constants/error-code';

/**
 * Unified error response envelope:
 * { code: number, message: string, data: null }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: number = ErrorCode.INTERNAL_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, unknown>;
        message =
          (typeof r.message === 'string' && r.message) ||
          (Array.isArray(r.message) ? r.message.join(', ') : exception.message);
        code = typeof r.code === 'number' ? r.code : status;
      }
      if (code === ErrorCode.INTERNAL_ERROR && status < 500) {
        code = status;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(`[${code}] ${message}`, exception instanceof Error ? exception.stack : '');

    response.status(status).json({ code, message, data: null });
  }
}
