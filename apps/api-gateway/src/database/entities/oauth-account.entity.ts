// apps/api-gateway/src/database/entities/oauth-account.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('oauth_accounts')
@Index(['provider', 'providerUserId'], { unique: true })
export class OauthAccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  provider: string;

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @ManyToOne(() => UserEntity, (u) => u.oauthAccounts, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
