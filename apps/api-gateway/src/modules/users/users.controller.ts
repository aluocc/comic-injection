// apps/api-gateway/src/modules/users/users.controller.ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UserEntity } from '../../database/entities/user.entity';

class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(40) name?: string;
  @IsOptional() @IsString() avatar?: string | null;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: UserEntity) {
    return { id: user.id, username: user.username, name: user.name, avatar: user.avatar };
  }

  @Patch('me')
  update(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
