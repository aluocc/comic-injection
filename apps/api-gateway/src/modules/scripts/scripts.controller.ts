// apps/api-gateway/src/modules/scripts/scripts.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScriptsService } from './scripts.service';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/character.dto';
import { CreatePropDto, UpdatePropDto } from './dto/prop.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ScriptsController {
  constructor(private scripts: ScriptsService) {}

  @Get('projects/:id/characters')
  listCharacters(@Param('id') id: string) {
    return this.scripts.listCharacters(id);
  }
  @Post('projects/:id/characters')
  createCharacter(@Param('id') id: string, @Body() dto: CreateCharacterDto) {
    return this.scripts.createCharacter(id, dto);
  }
  @Patch('characters/:id')
  updateCharacter(@Param('id') id: string, @Body() dto: UpdateCharacterDto) {
    return this.scripts.updateCharacter(id, dto);
  }
  @Delete('characters/:id')
  async removeCharacter(@Param('id') id: string) {
    await this.scripts.removeCharacter(id);
  }

  @Get('projects/:id/props')
  listProps(@Param('id') id: string) {
    return this.scripts.listProps(id);
  }
  @Post('projects/:id/props')
  createProp(@Param('id') id: string, @Body() dto: CreatePropDto) {
    return this.scripts.createProp(id, dto);
  }
  @Patch('props/:id')
  updateProp(@Param('id') id: string, @Body() dto: UpdatePropDto) {
    return this.scripts.updateProp(id, dto);
  }
  @Delete('props/:id')
  async removeProp(@Param('id') id: string) {
    await this.scripts.removeProp(id);
  }
}
