import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * Like JwtAuthGuard, but does NOT reject unauthenticated requests.
 * If a valid JWT is present, `req.user` is populated as usual.
 * If no JWT (or an invalid one) is provided, `req.user` remains undefined
 * and the request continues normally.
 *
 * Use this on public endpoints where you still want to know WHO is calling
 * (e.g. to let owners see their own private content).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<{ req: Request }>().req;
  }

  /**
   * Override canActivate so that authentication failures are swallowed
   * instead of throwing 401.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Attempt normal JWT validation
      await super.canActivate(context);
    } catch {
      // Swallow error – user simply stays unauthenticated
    }
    return true;
  }

  /**
   * Passport calls handleRequest after validation.  The default throws on
   * error; we override to return null instead so the request proceeds.
   */
  handleRequest<TUser = any>(_err: any, user: TUser): TUser | null {
    return user || null;
  }
}
