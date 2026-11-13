import { Injectable, CanActivate, ExecutionContext, SetMetadata, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../domain/entities/user-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token JWT faltante o inválido.');
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;

      if (!requiredRoles || requiredRoles.length === 0) return true;
      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException(`Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`);
      }
      return true;
    } catch (err) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException('Token expirado o inválido.');
    }
  }
}