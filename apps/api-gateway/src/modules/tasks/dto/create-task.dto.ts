// apps/api-gateway/src/modules/tasks/dto/create-task.dto.ts
import { IsString, IsObject } from 'class-validator';

export class CreateTaskDto {
  @IsString() nodeId: string;
  @IsString() provider: string;
  @IsString() kind: string;
  @IsObject() params: Record<string, unknown>;
}
