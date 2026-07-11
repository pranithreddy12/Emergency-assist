import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  userId: string;
  role: string;
  isGuest: boolean;
}

/** Extracts the authenticated user injected by JwtStrategy. */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | AuthUser[keyof AuthUser] => {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
