import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { GrammarController } from './grammar.controller';
import { GrammarService } from './grammar.service';

/**
 * GrammarModule: grammar practice endpoints.
 *
 * `PassportModule` is imported so the `JwtAuthGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`, so it does not need to be re-provided
 * here.
 */
@Module({
  imports: [PassportModule],
  controllers: [GrammarController],
  providers: [GrammarService],
})
export class GrammarModule {}
