import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export interface CurrentUserData {
  userId: string;
  email: string;
  username?: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext<{ req: { user: CurrentUserData } }>().req.user;

    return data ? user?.[data] : user;
  },
);
