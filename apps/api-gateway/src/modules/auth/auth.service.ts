import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserEntity } from '../../database/entities/user.entity';
import { OauthAccountEntity } from '../../database/entities/oauth-account.entity';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private users: Repository<UserEntity>,
    @InjectRepository(OauthAccountEntity) private oauthRepo: Repository<OauthAccountEntity>,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findOne({ where: { username: dto.username } });
    if (exists) throw new ConflictException('username already taken');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.save(
      this.users.create({ username: dto.username, passwordHash, name: dto.username }),
    );
    return this.issueTokens(user);
  }

  async validateUser(username: string, password: string): Promise<UserEntity> {
    const user = await this.users.findOne({ where: { username } });
    if (!user || !user.passwordHash) throw new UnauthorizedException('invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('invalid credentials');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    return this.issueTokens(user);
  }

  issueTokens(user: UserEntity) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });
    return { accessToken, refreshToken };
  }

  async oauthLogin(provider: string, providerUserId: string, name: string, avatar?: string) {
    const existing = await this.users
      .createQueryBuilder('u')
      .innerJoin('u.oauthAccounts', 'o', 'o.provider = :p AND o.providerUserId = :pid', {
        p: provider, pid: providerUserId,
      })
      .getOne();

    if (existing) return this.issueTokens(existing);

    // OAuth 用户用 provider+id 作为唯一用户名
    const username = `${provider}_${providerUserId}`;
    let user = await this.users.findOne({ where: { username } });
    if (!user) {
      user = await this.users.save(
        this.users.create({ username, passwordHash: null, name, avatar: avatar ?? null }),
      );
    }
    return this.linkOauthAndIssue(user, provider, providerUserId);
  }

  private async linkOauthAndIssue(user: UserEntity, provider: string, providerUserId: string) {
    await this.oauthRepo.save(this.oauthRepo.create({ userId: user.id, provider, providerUserId }));
    return this.issueTokens(user);
  }
}
