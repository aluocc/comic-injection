import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NovelToScriptService } from './novel-to-script.service';
import { ConvertDto } from './dto/convert.dto';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('novel-to-script')
@UseGuards(JwtAuthGuard)
export class NovelToScriptController {
  constructor(private service: NovelToScriptService) {}

  @Post('convert')
  convert(@CurrentUser() user: UserEntity, @Body() dto: ConvertDto) {
    return this.service.convert(user.id, dto);
  }
}
