import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Inject, Injectable, Logger, Optional, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import { RedisService } from '../../platform/redis/redis.service.js';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { revokedFamilyKey } from './session-revocation.js';

export interface RequestUser {
  readonly sub: string;
  readonly role: string;
  readonly inst: string | null;
  readonly companyId?: string | null;
  /** Session (refresh-token family) this access token belongs to. */
  readonly fam?: string;
  readonly isDelegated?: boolean;
  readonly actorId?: string;
  readonly actorRole?: string;
  readonly ticketId?: string;
  readonly supportSessionId?: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(Reflector) private readonly reflector: Reflector,
    @Optional() @Inject(RedisService) private readonly redis?: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: RequestUser }>();
    const header = request.headers.authorization;
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        error: 'unauthorized',
        message: 'Missing bearer token.',
        statusCode: 401,
      });
    }

    try {
      const decoded = this.jwt.verify<RequestUser>(header.slice('Bearer '.length));
      if (decoded.isDelegated) {
        if (!decoded.supportSessionId) {
          throw new UnauthorizedException({
            error: 'unauthorized',
            message: 'Delegated session token is invalid.',
            statusCode: 401,
          });
        }
        if (this.redis) {
          const sessionExists = await this.redis.get(`support_session:${decoded.supportSessionId}`);
          if (!sessionExists) {
            throw new UnauthorizedException({
              error: 'unauthorized',
              message: 'Delegated session has expired or been revoked.',
              statusCode: 401,
            });
          }
        }
      }
      if (decoded.fam && (await this.isSessionRevoked(decoded.fam))) {
        throw new UnauthorizedException({
          error: 'session_revoked',
          message: 'This session has ended. Sign in again.',
          statusCode: 401,
        });
      }
      request.user = decoded;
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException({
        error: 'token_expired',
        message: 'Access token is invalid or expired.',
        statusCode: 401,
      });
    }
  }

  /**
   * True when the session behind this access token was revoked (logout, refresh-token reuse,
   * admin revoke). A Redis outage must not lock everyone out, so a failed lookup lets the
   * request through: the signed token is still valid, and it expires on its own.
   */
  private async isSessionRevoked(familyId: string): Promise<boolean> {
    if (!this.redis) return false;
    try {
      return (await this.redis.get(revokedFamilyKey(familyId))) !== null;
    } catch (error) {
      this.logger.warn(`Session revocation lookup failed: ${String(error)}`);
      return false;
    }
  }
}
