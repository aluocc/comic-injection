// apps/api-gateway/src/modules/workflows/workflows.controller.ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  constructor(private workflows: WorkflowsService) {}

  @Get()
  list(@CurrentUser() user: UserEntity) {
    return this.workflows.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: UserEntity, @Body() dto: CreateWorkflowDto) {
    return this.workflows.create(user.id, dto);
  }

  @Get(':id')
  async get(@CurrentUser() user: UserEntity, @Param('id') id: string) {
    return this.workflows.findOne(id, user.id);
  }
}
