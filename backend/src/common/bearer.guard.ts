import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// Lightweight guard: just requires a Bearer header to be present. Directus does
// the real per-user authz once we forward the token (YAGNI - no Passport).
@Injectable()
export class BearerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const auth = req.headers['authorization'];
    if (!auth || !/^Bearer\s+.+/i.test(auth)) {
      throw new UnauthorizedException('Missing or malformed Authorization Bearer token');
    }
    return true;
  }
}
