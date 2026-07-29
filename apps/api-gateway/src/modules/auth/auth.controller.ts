import { Body, Controller, Post, UseGuards, Res, Get, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from '../../database/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private config: ConfigService,
  ) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.auth.login(dto.username, dto.password);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  refresh(@CurrentUser() user: UserEntity) {
    return this.auth.issueTokens(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: UserEntity) {
    return { id: user.id, username: user.username, name: user.name, avatar: user.avatar };
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  github() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const profile = req.user as any;
    const tokens = await this.auth.oauthLogin(
      'github',
      String(profile.id),
      profile.displayName || profile.username || 'github-user',
      profile.photos?.[0]?.value,
    );
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'lax' });
    const origins = this.config.get<string[]>('cors.origin') ?? ['http://localhost:5173'];
    return res.redirect(`${origins[0]}/auth/callback?token=${tokens.accessToken}`);
  }
}
