import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

/**
 * CourseModule: exposes public read-only course tree endpoints.
 *
 * `PassportModule` is imported so the `OptionalJwtGuard` (which extends
 * `AuthGuard('jwt')`) can be instantiated. The `JwtStrategy` itself is
 * registered globally by `AuthModule`, so it does not need to be re-provided
 * here.
 */
@Module({
  imports: [PassportModule],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
