import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { UserRole } from '@smart/contracts';
import { authzDeniedTotal } from '@smart/observability';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { PERMISSIONS_KEY, roleHasPermission, type Permission } from './permissions.js';
import { ROLES_KEY } from './roles.decorator.js';
import type { RequestUser } from './jwt-auth.guard.js';

function forbidden(): ForbiddenException {
  return new ForbiddenException({
    error: 'forbidden',
    message: 'You do not have permission to perform this action.',
    statusCode: 403,
  });
}

/**
 * Enforces `@Roles(...)` and `@RequirePermission(...)` (S6-VV-99). When a route
 * carries both, the caller must satisfy both.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length && !requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: RequestUser }>();
    const role = request.user?.role as UserRole | undefined;
    // S6-VV-126: count every refusal by route template (bounded), so probing shows up as a spike.
    const deny = (): ForbiddenException => {
      authzDeniedTotal.inc({ route: request.routeOptions?.url ?? 'unknown', role: role ?? 'none' });
      return forbidden();
    };
    if (!role) throw deny();
    if (requiredRoles?.length && !requiredRoles.includes(role)) throw deny();
    if (
      requiredPermissions?.length &&
      !requiredPermissions.every((permission) => roleHasPermission(role, permission))
    ) {
      throw deny();
    }
    return true;
  }
}
