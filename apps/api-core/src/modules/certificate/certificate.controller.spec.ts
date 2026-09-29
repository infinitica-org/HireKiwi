import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateController } from './certificate.controller.js';
import type { CertificateService } from './certificate.service.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';

describe('CertificateController', () => {
  let controller: CertificateController;
  let mockService: Partial<CertificateService>;

  const mockUser: RequestUser = {
    sub: 'student-1111',
    email: 'student@example.com',
    role: 'STUDENT',
  };

  beforeEach(() => {
    mockService = {
      getMeta: vi.fn().mockReturnValue({ module: 'certificate', status: 'active' }),
      getStudentCertificates: vi.fn().mockResolvedValue([]),
      updateVisibility: vi.fn().mockResolvedValue({} as any),
      getPdfDownloadUrl: vi
        .fn()
        .mockResolvedValue({ url: 'https://pdf-url', expiresInSeconds: 900 }),
      getPublicVerification: vi.fn().mockResolvedValue({} as any),
    };

    controller = new CertificateController(mockService as CertificateService);
  });

  it('meta() returns metadata', () => {
    expect(controller.meta()).toEqual({ module: 'certificate', status: 'active' });
  });

  it('mine() retrieves authenticated student certificates', async () => {
    await controller.mine(mockUser);
    expect(mockService.getStudentCertificates).toHaveBeenCalledWith('student-1111');
  });

  it('setVisibility() calls updateVisibility with user sub', async () => {
    await controller.setVisibility(mockUser, 'cert-1', { isPublic: true });
    expect(mockService.updateVisibility).toHaveBeenCalledWith('cert-1', 'student-1111', true);
  });

  it('getPdf() retrieves signed PDF download URL', async () => {
    const result = await controller.getPdf(mockUser, 'cert-1');
    expect(mockService.getPdfDownloadUrl).toHaveBeenCalledWith('cert-1', 'student-1111');
    expect(result).toEqual({ url: 'https://pdf-url', expiresInSeconds: 900 });
  });

  it('verify() retrieves public verification DTO', async () => {
    await controller.verify('cert-1', 'sig123');
    expect(mockService.getPublicVerification).toHaveBeenCalledWith('cert-1', 'sig123');
  });
});
