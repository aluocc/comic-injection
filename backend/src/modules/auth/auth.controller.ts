import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService, type JwtPayload, type PublicUser } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Auth endpoints:
 * - POST /auth/register
 * - POST /auth/login
 * - GET  /auth/me   (JWT-protected)
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
  ): Promise<{ token: string; user: PublicUser }> {
    return this.auth.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ token: string; user: PublicUser }> {
    return this.auth.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: AuthenticatedRequest): Promise<PublicUser> {
    return this.auth.getPublicUserById(req.user.sub);
  }
}
