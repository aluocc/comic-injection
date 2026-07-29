import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfig } from '../../config/app-config';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-code';

/**
 * Public projection of a User returned by register/login/me.
 */
export interface PublicUser {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  targetLanguage: string | null;
  currentLevel: string | null;
}

/**
 * JWT payload embedded inside the access token.
 */
export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: AppConfig,
  ) {}

  /**
   * Register a new user with email + password.
   * Throws 409 (code 1001 - VALIDATION_FAILED per task spec) when email is taken.
   */
  async register(input: {
    email: string;
    password: string;
    nickname: string;
  }): Promise<{ token: string; user: PublicUser }> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'email already registered',
      });
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const created = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        nickname: input.nickname.trim(),
      },
    });

    this.logger.log(`Registered user ${created.id} (${created.email})`);
    return this.issueAuthResponse(created);
  }

  /**
   * Login with account (email or phone) + password.
   * Throws 401 (code 1002 - UNAUTHORIZED) on bad credentials.
   */
  async login(input: {
    account: string;
    password: string;
  }): Promise<{ token: string; user: PublicUser }> {
    const account = input.account.trim();
    const isEmail = account.includes('@');
    const normalizedAccount = isEmail ? account.toLowerCase() : account;

    const user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: normalizedAccount }
        : { phone: normalizedAccount },
    });
    if (!user) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'invalid credentials',
      });
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'invalid credentials',
      });
    }

    this.logger.log(`User ${user.id} logged in`);
    return this.issueAuthResponse(user);
  }

  /**
   * Lookup a user by id (used by /auth/me).
   * Throws 404 if the user no longer exists.
   */
  async getPublicUserById(id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'user not found',
      });
    }
    return this.toPublic(user);
  }

  private async issueAuthResponse(
    user: User,
  ): Promise<{ token: string; user: PublicUser }> {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    const token = await this.jwt.signAsync(payload, {
      secret: this.config.jwtSecret,
      expiresIn: this.config.jwtExpiresIn as StringValue,
    });
    return { token, user: this.toPublic(user) };
  }

  private toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      targetLanguage: user.targetLanguage,
      currentLevel: user.currentLevel,
    };
  }
}
