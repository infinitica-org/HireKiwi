import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Job, Queue } from 'bullmq';
import { PdfGenerationProcessor } from '../../platform/queue/async-job.processor.js';
import type { PrismaService } from '../../platform/prisma/prisma.service.js';
import type { StorageService } from '../../platform/storage/storage.service.js';

describe('PdfGenerationProcessor', () => {
  let processor: PdfGenerationProcessor;
  let mockDlq: Partial<Queue>;
  let mockPrisma: any;
  let mockStorage: Partial<StorageService>;

  beforeEach(() => {
    mockDlq = {
      add: vi.fn().mockResolvedValue({} as any),
    };

    mockPrisma = {
      certificate: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
      },
    };

    mockStorage = {
      putObjectBuffer: vi.fn().mockResolvedValue(undefined),
      getSignedDownloadUrl: vi.fn().mockResolvedValue('https://storage.hirekiwi.local/signed-pdf'),
    };

    processor = new PdfGenerationProcessor(
      mockDlq as Queue,
      mockPrisma as PrismaService,
      mockStorage as StorageService,
    );
  });

  it('13. PDF processor generates and uploads certificate PDF', async () => {
    const certId = 'cert-1111-2222';
    mockPrisma.certificate.findUnique.mockResolvedValue({
      id: certId,
      userId: 'student-1',
      trackId: 'track-1',
      highestLevelCleared: 2,
      headlineTier: 'GOLD',
      tierTrail: { L1: 'GOLD', L2: 'GOLD' },
      signature: 'abc123sig',
      status: 'ISSUED',
      issuedAt: new Date('2026-09-29T12:00:00Z'),
      user: { name: 'Aarav Sharma', email: 'aarav@example.com' },
      track: { title: 'Fullstack Engineering', code: 'TECH_FULLSTACK' },
    });

    const mockJob = {
      id: 'job-1',
      data: { certificateId: certId },
    } as Job<{ certificateId: string }>;

    await processor.process(mockJob);

    expect(mockPrisma.certificate.findUnique).toHaveBeenCalledWith({
      where: { id: certId },
      include: { user: true, track: true },
    });

    expect(mockStorage.putObjectBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        objectKey: `certificates/pdf/${certId}.pdf`,
        contentType: 'application/pdf',
      }),
    );

    expect(mockPrisma.certificate.update).toHaveBeenCalledWith({
      where: { id: certId },
      data: { pdfKey: `certificates/pdf/${certId}.pdf` },
    });
  });

  it('14. PDF retry is idempotent: re-executing overwrites buffer cleanly', async () => {
    const certId = 'cert-retry-test';
    mockPrisma.certificate.findUnique.mockResolvedValue({
      id: certId,
      userId: 'student-1',
      trackId: 'track-1',
      highestLevelCleared: 1,
      headlineTier: 'SILVER',
      tierTrail: { L1: 'SILVER' },
      signature: 'retry-sig',
      pdfKey: `certificates/pdf/${certId}.pdf`,
      status: 'ISSUED',
      issuedAt: new Date('2026-09-29T12:00:00Z'),
      user: { name: 'Aarav Sharma' },
      track: { title: 'Fullstack' },
    });

    const mockJob = {
      id: 'job-retry-1',
      data: { certificateId: certId },
    } as Job<{ certificateId: string }>;

    // Run first time
    await processor.process(mockJob);
    // Run second time (retry)
    await processor.process(mockJob);

    expect(mockStorage.putObjectBuffer).toHaveBeenCalledTimes(2);
    expect(mockPrisma.certificate.update).toHaveBeenCalledTimes(2);
  });
});
