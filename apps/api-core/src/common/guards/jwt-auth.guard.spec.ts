import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { JwtAuthGuard, type RequestUser } from './jwt-auth.guard.js';

function contextWithAuth(authorization: string | undefined): ExecutionContext {
  const request: { headers: { authorization?: string }; user?: RequestUser } = {
    headers: { authorization },
  };
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('allows public routes without a bearer token', async () => {
    const publicReflector = {
      getAllAndOverride: vi.fn(() => true),
    };
    const guard = new JwtAuthGuard({ verify: vi.fn() } as never, publicReflector as never);
    expect(await guard.canActivate(contextWithAuth(undefined))).toBe(true);
  });

  it('rejects a missing bearer token with 401', async () => {
    const privateReflector = {
      getAllAndOverride: vi.fn(() => false),
    };
    const guard = new JwtAuthGuard({ verify: vi.fn() } as never, privateReflector as never);
    await expect(guard.canActivate(contextWithAuth(undefined))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('attaches verified claims for a valid bearer token', async () => {
    const privateReflector = {
      getAllAndOverride: vi.fn(() => false),
    };
    const user: RequestUser = { sub: 'u1', role: 'STUDENT', inst: null };
    const jwt = { verify: vi.fn(() => user) };
    const ctx = contextWithAuth('Bearer access.jwt');
    const guard = new JwtAuthGuard(jwt as never, privateReflector as never);
    expect(await guard.canActivate(ctx)).toBe(true);
    expect(jwt.verify).toHaveBeenCalledWith('access.jwt');
    expect((ctx.switchToHttp().getRequest() as { user?: RequestUser }).user).toEqual(user);
  });

  it('rejects an invalid token with 401', async () => {
    const privateReflector = {
      getAllAndOverride: vi.fn(() => false),
    };
    const guard = new JwtAuthGuard(
      {
        verify: vi.fn(() => {
          throw new Error('expired');
        }),
      } as never,
      privateReflector as never,
    );
    await expect(guard.canActivate(contextWithAuth('Bearer stale'))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

describe('JwtAuthGuard session revocation (Th6-614)', () => {
  const privateReflector = { getAllAndOverride: vi.fn(() => false) };
  const user: RequestUser = { sub: 'u1', role: 'STUDENT', inst: null, fam: 'family-1' };

  function guardWith(redisGet: ReturnType<typeof vi.fn>) {
    const jwt = { verify: vi.fn(() => user) };
    return new JwtAuthGuard(jwt as never, privateReflector as never, { get: redisGet } as never);
  }

  it('rejects a token whose session was revoked, with 401 session_revoked', async () => {
    const get = vi.fn(async () => '1');
    const guard = guardWith(get);
    await expect(guard.canActivate(contextWithAuth('Bearer access.jwt'))).rejects.toMatchObject({
      response: { error: 'session_revoked', statusCode: 401 },
    });
    expect(get).toHaveBeenCalledWith('auth:revoked-family:family-1');
  });

  it('lets a token through when its session is not revoked', async () => {
    const guard = guardWith(vi.fn(async () => null));
    expect(await guard.canActivate(contextWithAuth('Bearer access.jwt'))).toBe(true);
  });

  it('lets the request through when the revocation lookup fails (Redis down)', async () => {
    const guard = guardWith(
      vi.fn(async () => {
        throw new Error('redis down');
      }),
    );
    expect(await guard.canActivate(contextWithAuth('Bearer access.jwt'))).toBe(true);
  });

  it('skips the lookup for tokens with no session claim', async () => {
    const get = vi.fn(async () => '1');
    const jwt = { verify: vi.fn(() => ({ sub: 'u1', role: 'STUDENT', inst: null })) };
    const guard = new JwtAuthGuard(jwt as never, privateReflector as never, { get } as never);
    expect(await guard.canActivate(contextWithAuth('Bearer access.jwt'))).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });
});
