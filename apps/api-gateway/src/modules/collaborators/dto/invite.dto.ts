// apps/api-gateway/src/modules/collaborators/dto/invite.dto.ts
import { IsEmail, IsIn } from 'class-validator';

export class InviteDto {
  @IsEmail() email: string;
  @IsIn(['editor', 'viewer']) role: 'editor' | 'viewer';
}
