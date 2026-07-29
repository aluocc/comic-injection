import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

/**
 * CommunityModule: circles, posts, comments and likes.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` is registered
 * globally by `AuthModule`, and `PrismaService` is `@Global` via
 * `PrismaModule`, so neither needs to be re-provided here.
 */
@Module({
  imports: [PassportModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
