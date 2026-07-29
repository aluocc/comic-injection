import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * OptionalJwtGuard: behaves like JwtAuthGuard when a valid Bearer token is
 * present, but does NOT reject the request when the token is missing or
 * invalid. Instead, `request.user` is left falsy and the handler runs as an
 * anonymous request.
 *
 * Used by the course endpoints so they stay publicly accessible while still
 * being able to attach `userProgress` for authenticated users (Task 8).
 *
 * Implementation note: we only override `handleRequest` so that it never
 * throws — the canonical NestJS pattern for an "optional" auth guard. The
 * strategy is still invoked, so when a valid token is supplied `request.user`
 * is populated as usual.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(_err: any, user: any): any {
    // Never throw on missing/invalid credentials — just return whatever we
    // got (possibly undefined/false). canActivate will resolve to true.
    return user;
  }
}
