// apps/api-gateway/src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(UserEntity) private users: Repository<UserEntity>) {}

  findById(id: string) {
    return this.users.findOne({ where: { id } });
  }

  async updateProfile(id: string, patch: { name?: string; avatar?: string | null }) {
    await this.users.update(id, patch);
    return this.users.findOne({ where: { id } });
  }
}
