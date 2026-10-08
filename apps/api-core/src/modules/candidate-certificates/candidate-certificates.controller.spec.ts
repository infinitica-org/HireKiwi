import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CandidateCertificatesController } from './candidate-certificates.controller.js';
import type { CandidateCertificatesService } from './candidate-certificates.service.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';

describe('CandidateCertificatesController', () => {
  let controller: CandidateCertificatesController;
  let mockService: Partial<CandidateCertificatesService>;

  const mockUser: RequestUser = {
    sub: '00000000-0000-4000-8000-000000000001',
    email: 'student@example.com',
    role: 'STUDENT',
  };

  beforeEach(() => {
    mockService = {
      listMine: vi.fn().mockResolvedValue({ certificates: [] }),
      getDeclaration: vi.fn().mockResolvedValue({ hasNoCertifications: null }),
      setDeclaration: vi.fn().mockResolvedValue({ hasNoCertifications: true }),
      getOwned: vi.fn().mockResolvedValue({} as any),
    };

    controller = new CandidateCertificatesController(mockService as CandidateCertificatesService);
  });

  it('delegates getDeclaration to service with user sub', async () => {
    const res = await controller.getDeclaration(mockUser);
    expect(mockService.getDeclaration).toHaveBeenCalledWith(mockUser.sub);
    expect(res).toEqual({ hasNoCertifications: null });
  });

  it('delegates setDeclaration to service with user sub and parsed body', async () => {
    const res = await controller.setDeclaration(mockUser, { hasNoCertifications: true });
    expect(mockService.setDeclaration).toHaveBeenCalledWith(mockUser.sub, true);
    expect(res).toEqual({ hasNoCertifications: true });
  });

  it('declares getDeclaration before getOne to prevent Fastify route shadowing', () => {
    // Inspect method declaration order on the class prototype
    const methods = Object.getOwnPropertyNames(CandidateCertificatesController.prototype);
    const declarationIndex = methods.indexOf('getDeclaration');
    const getOneIndex = methods.indexOf('getOne');
    expect(declarationIndex).toBeGreaterThan(-1);
    expect(getOneIndex).toBeGreaterThan(-1);
    expect(declarationIndex).toBeLessThan(getOneIndex);
  });
});
