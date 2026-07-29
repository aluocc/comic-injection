import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ListeningController } from './listening.controller';
import { ListeningService } from './listening.service';

/**
 * ListeningModule: listening practice endpoints.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`, so it does not need to be re-provided
 * here.
 */
@Module({
  imports: [PassportModule],
  controllers: [ListeningController],
  providers: [ListeningService],
})
export class ListeningModule {}
