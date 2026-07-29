// apps/api-gateway/src/modules/scripts/scripts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CharacterEntity } from '../../database/entities/character.entity';
import { PropEntity } from '../../database/entities/prop.entity';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/character.dto';
import { CreatePropDto, UpdatePropDto } from './dto/prop.dto';

@Injectable()
export class ScriptsService {
  constructor(
    @InjectRepository(CharacterEntity) private characters: Repository<CharacterEntity>,
    @InjectRepository(PropEntity) private props: Repository<PropEntity>,
  ) {}

  listCharacters(projectId: string) {
    return this.characters.find({ where: { projectId } });
  }
  createCharacter(projectId: string, dto: CreateCharacterDto) {
    return this.characters.save(this.characters.create({
      projectId, name: dto.name, description: dto.description ?? '',
      aliases: dto.aliases ?? [],
    }));
  }
  async updateCharacter(id: string, dto: UpdateCharacterDto) {
    await this.characters.update(id, dto);
    const c = await this.characters.findOne({ where: { id } });
    if (!c) throw new NotFoundException();
    return c;
  }
  async removeCharacter(id: string) {
    await this.characters.delete(id);
  }

  listProps(projectId: string) {
    return this.props.find({ where: { projectId } });
  }
  createProp(projectId: string, dto: CreatePropDto) {
    return this.props.save(this.props.create({
      projectId, name: dto.name, description: dto.description ?? '',
    }));
  }
  async updateProp(id: string, dto: UpdatePropDto) {
    await this.props.update(id, dto);
    const p = await this.props.findOne({ where: { id } });
    if (!p) throw new NotFoundException();
    return p;
  }
  async removeProp(id: string) {
    await this.props.delete(id);
  }
}
