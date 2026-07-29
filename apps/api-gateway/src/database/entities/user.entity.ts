// apps/api-gateway/src/database/entities/user.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  Index, OneToMany,
} from 'typeorm';
import { OauthAccountEntity } from './oauth-account.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'password_hash', nullable: true })
  passwordHash: string | null;

  @Column({ default: '' })
  name: string;

  @Column({ nullable: true })
  avatar: string | null;

  @Column({ type: 'varchar', default: 'user' })
  role: 'admin' | 'user';

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OauthAccountEntity, (o) => o.user)
  oauthAccounts: OauthAccountEntity[];
}
