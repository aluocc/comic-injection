// apps/api-gateway/src/modules/tasks/tasks.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('workflows/:id/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Get()
  list(@Param('id') id: string) {
    return this.tasks.listByWorkflow(id);
  }

  @Post()
  create(
    @CurrentUser() user: UserEntity,
    @Param('id') id: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(user.id, id, dto);
  }
}
