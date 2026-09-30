import { describe, expect, it, vi } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/guards/roles.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { RateLimitAdminController } from './rate-limit-admin.controller.js';

const mockUser: RequestUser = {
  sub: '99999999-9999-4999-8999-999999999999',
  email: 'admin@smart.local',
  role: 'SUPER_ADMIN',
};

const instId = '11111111-1111-4111-8111-111111111111';

describe('RateLimitAdminController', () => {
  it('is protected by SUPER_ADMIN role', () => {
    const reflector = new Reflector();
    const roles = reflector.get<string[]>(ROLES_KEY, RateLimitAdminController);
    expect(roles).toEqual(['SUPER_ADMIN']);
  });

  it('lists policies and extracts overrides for institution', async () => {
    const redis = {
      get: vi.fn(async (key: string) => {
        if (key === `rl:override:${instId}:role.student`) {
          return JSON.stringify({
            institutionId: instId,
            policyKey: 'role.student',
            limit: 300,
            burst: 50,
            windowSeconds: 60,
            reason: 'Placement festival',
            updatedBy: mockUser.sub,
            updatedAt: '2026-09-30T10:00:00.000Z',
          });
        }
        return null;
      }),
    };
    const auditPublisher = { record: vi.fn() };
    const controller = new RateLimitAdminController(redis as never, auditPublisher as never);

    const res = await controller.listPolicies(instId);
    expect(res.policies.length).toBeGreaterThan(0);
    const studentPolicy = res.policies.find((p) => p.key === 'role.student');
    expect(studentPolicy).toBeDefined();
    expect(studentPolicy?.activeOverride).toEqual(
      expect.objectContaining({
        institutionId: instId,
        policyKey: 'role.student',
        limit: 300,
      }),
    );
    expect(res.overrides).toHaveLength(1);
  });

  it('sets rate-limit override and writes audit log', async () => {
    const redis = { set: vi.fn(async () => 'OK') };
    const auditPublisher = { record: vi.fn().mockResolvedValue(undefined) };
    const controller = new RateLimitAdminController(redis as never, auditPublisher as never);

    const override = await controller.setOverride(mockUser, instId, 'role.student', {
      limit: 500,
      burst: 100,
      windowSeconds: 60,
      reason: 'Special exam schedule',
    });

    expect(override.limit).toBe(500);
    expect(override.burst).toBe(100);
    expect(override.institutionId).toBe(instId);
    expect(override.policyKey).toBe('role.student');
    expect(redis.set).toHaveBeenCalledWith(
      `rl:override:${instId}:role.student`,
      expect.stringContaining('"limit":500'),
    );
    expect(auditPublisher.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'rate_limit.override_set',
        actorId: mockUser.sub,
        resourceId: `${instId}:role.student`,
        reasonCode: 'Special exam schedule',
      }),
    );
  });

  it('deletes rate-limit override and writes audit log', async () => {
    const redis = { del: vi.fn(async () => 1) };
    const auditPublisher = { record: vi.fn().mockResolvedValue(undefined) };
    const controller = new RateLimitAdminController(redis as never, auditPublisher as never);

    const res = await controller.deleteOverride(mockUser, instId, 'role.student');
    expect(res).toEqual({ success: true });
    expect(redis.del).toHaveBeenCalledWith(`rl:override:${instId}:role.student`);
    expect(auditPublisher.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'rate_limit.override_deleted',
        actorId: mockUser.sub,
        resourceId: `${instId}:role.student`,
      }),
    );
  });
});
