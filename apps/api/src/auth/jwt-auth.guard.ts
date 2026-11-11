import { createHmac, timingSafeEqual } from 'node:crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

interface JwtPayload {
  userId?: number;
  email?: string;
  role?: string;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined>; user?: JwtPayload }>();
    const authorization = request.headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length)
      : '';
    const payload = this.verify(token);

    request.user = payload;
    return true;
  }

  private verify(token: string): JwtPayload {
    const secret = process.env.JWT_SECRET;
    const parts = token.split('.');
    if (!secret || parts.length !== 3) throw new UnauthorizedException('Thiếu hoặc sai JWT.');

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    const actual = Buffer.from(encodedSignature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Thiếu hoặc sai JWT.');
    }

    try {
      const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8')) as { alg?: string; typ?: string };
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as JwtPayload;
      if (header.alg !== 'HS256' || header.typ !== 'JWT' || typeof payload.userId !== 'number') {
        throw new UnauthorizedException('JWT không hợp lệ.');
      }
      if (payload.exp !== undefined && payload.exp <= Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('JWT đã hết hạn.');
      }
      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('JWT không hợp lệ.');
    }
  }
}
