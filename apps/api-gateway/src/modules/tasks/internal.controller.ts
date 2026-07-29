// apps/api-gateway/src/modules/tasks/internal.controller.ts
import { Body, Controller, Param, Patch, Headers, UnauthorizedException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ConfigService } from '@nestjs/config';

@Controller('internal/tasks')
export class InternalTasksController {
  constructor(private tasks: TasksService, private config: ConfigService) {}

  @Patch(':id')
  async report(
    @Param('id') id: string,
    @Body() body: { status: string; output?: any; error?: string },
    @Headers('x-internal-secret') secret: string,
  ) {
    const expected = this.config.get<string>('internalSecret') ?? 'dev-internal';
    if (secret !== expected) throw new UnauthorizedException();
    return this.tasks.report(id, body.status, body);
  }
}
