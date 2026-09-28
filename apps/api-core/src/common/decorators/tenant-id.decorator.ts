import { createParamDecorator, ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { RequestUser } from '../guards/jwt-auth.guard.js';

/**
 * The caller's institution id (the `inst` claim), for institution-scoped handlers. Throws 403 when
 * the caller has none, SUPER_ADMIN included: a missing id must never reach a query, where
 * `{ institutionId: undefined }` would match every tenant. Replaces the `requireInstitutionId()`
 * helper that was copied into each TPO / placement controller.
 */
export function resolveTenantId(user: RequestUser | undefined): string {
  if (!user?.inst) {
    throw new ForbiddenException({
      error: 'forbidden',
      message: 'This action requires an institution-scoped account.',
      statusCode: 403,
    });
  }
  return user.inst;
}

export const TenantId = createParamDecorator((_data: unknown, context: ExecutionContext): string =>
  resolveTenantId(
    context.switchToHttp().getRequest<FastifyRequest & { user?: RequestUser }>().user,
  ),
);

/**
 * S6-VV-153 (#619): for routes shared by SUPER_ADMIN and institution staff. `null` means
 * platform-wide and is only ever returned for SUPER_ADMIN; anyone else gets their own institution
 * (or 403 without one). The handler must filter by it whenever it is not null.
 */
export function resolveTenantScope(user: RequestUser | undefined): string | null {
  if (user?.role === 'SUPER_ADMIN') return null;
  return resolveTenantId(user);
}

export const TenantScope = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null =>
    resolveTenantScope(
      context.switchToHttp().getRequest<FastifyRequest & { user?: RequestUser }>().user,
    ),
);
