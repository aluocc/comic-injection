import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT auth guard. Apply with `@UseGuards(JwtAuthGuard)` to require a valid
 * `Authorization: Bearer <token>` header. Returns 401 when missing/invalid.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
