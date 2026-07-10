import { ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Custom ThrottlerGuard for GraphQL.
 *
 * The default ThrottlerGuard is designed for REST (Express) and reads
 * `req` / `res` directly from `context.switchToHttp()`.
 * In a GraphQL context those objects live inside the GQL execution context,
 * so we override `getRequestResponse` to extract them correctly.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType() === 'http') {
      const httpCtx = context.switchToHttp();
      return {
        req: httpCtx.getRequest(),
        res: httpCtx.getResponse(),
      };
    }
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext<{ req: any; res: any }>();
    return { req: ctx.req, res: ctx.res };
  }

  protected throwThrottlingException(): Promise<void> {
    throw new HttpException(
      'Slow down! Too many requests from your device. Please wait a moment and try again.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
