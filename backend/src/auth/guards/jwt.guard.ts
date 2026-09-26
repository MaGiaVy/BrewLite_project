import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(err: any, user: any): TUser {
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException({
          statusCode: 401,
          message: 'Unauthorized - No token provided',
          error: 'UNAUTHORIZED',
        })
      );
    }
    return user;
  }
}

// Alias hỗ trợ cả 2 cách đặt tên (JwtGuard / JwtAuthGuard)
export const JwtAuthGuard = JwtGuard;
