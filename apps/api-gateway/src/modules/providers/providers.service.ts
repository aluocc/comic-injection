// apps/api-gateway/src/modules/providers/providers.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKeyEntity } from '../../database/entities/api-key.entity';
import { AesService } from '../../common/crypto/aes.service';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectRepository(ApiKeyEntity) private keys: Repository<ApiKeyEntity>,
    private aes: AesService,
  ) {}

  list(userId: string) {
    return this.keys.find({ where: { userId }, select: ['id', 'provider', 'createdAt'] });
  }

  async upsert(userId: string, provider: string, apiKey: string) {
    const encryptedKey = this.aes.encrypt(apiKey);
    const existing = await this.keys.findOne({ where: { userId, provider } });
    if (existing) {
      existing.encryptedKey = encryptedKey;
      return this.keys.save(existing);
    }
    return this.keys.save(this.keys.create({ userId, provider, encryptedKey }));
  }

  getDecryptedKey(userId: string, provider: string): Promise<string | null> {
    return this.keys.findOne({ where: { userId, provider } }).then((k) =>
      k ? this.aes.decrypt(k.encryptedKey) : null,
    );
  }
}
