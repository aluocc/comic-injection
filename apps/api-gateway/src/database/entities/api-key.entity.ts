// apps/api-gateway/src/database/entities/api-key.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('api_keys')
@Index(['userId', 'provider'], { unique: true })
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @Column()
  provider: string;

  @Column({ name: 'encrypted_key' })
  encryptedKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
