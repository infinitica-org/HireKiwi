import { UnprocessableEntityException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { assertFileClean } = vi.hoisted(() => ({ assertFileClean: vi.fn() }));
vi.mock('./file-scanner.js', () => ({ assertFileClean }));

import { EVIDENCE_FILE_MAX_BYTES } from '@hirekiwi/contracts';
import {
  assertEvidenceFile,
  detectEvidenceMimeType,
  verifyUploadedEvidence,
} from './evidence-file.js';
import type { StorageService } from './storage.service.js';

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64, 0x20)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64),
]);
const EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(64)]);
const JPG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)]);

async function expect422(promise: Promise<unknown>) {
  await expect(promise).rejects.toBeInstanceOf(UnprocessableEntityException);
  await expect(promise).rejects.toMatchObject({ status: 422 });
}

describe('Th6-600 evidence file checks', () => {
  beforeEach(() => {
    assertFileClean.mockReset().mockResolvedValue(undefined);
  });

  it('detects PDF and PNG by magic bytes only', () => {
    expect(detectEvidenceMimeType(PDF)).toBe('application/pdf');
    expect(detectEvidenceMimeType(PNG)).toBe('image/png');
    expect(detectEvidenceMimeType(EXE)).toBeNull();
    expect(detectEvidenceMimeType(JPG)).toBeNull();
  });

  it('accepts a real PDF and a real PNG, and still runs the ClamAV scan', async () => {
    await expect(
      assertEvidenceFile({ buffer: PDF, fileName: 'marks.pdf', mimeType: 'application/pdf' }),
    ).resolves.toBe('application/pdf');
    await expect(
      assertEvidenceFile({ buffer: PNG, fileName: 'offer.png', mimeType: 'image/png' }),
    ).resolves.toBe('image/png');
    expect(assertFileClean).toHaveBeenCalledTimes(2);
  });

  it('rejects a renamed .exe claiming to be a PDF with 422', async () => {
    await expect422(
      assertEvidenceFile({ buffer: EXE, fileName: 'resume.pdf', mimeType: 'application/pdf' }),
    );
    expect(assertFileClean).not.toHaveBeenCalled();
  });

  it('rejects a JPG with 422', async () => {
    await expect422(
      assertEvidenceFile({ buffer: JPG, fileName: 'photo.jpg', mimeType: 'image/jpeg' }),
    );
  });

  it('rejects when bytes, extension and declared type disagree', async () => {
    await expect422(
      assertEvidenceFile({ buffer: PNG, fileName: 'scan.pdf', mimeType: 'application/pdf' }),
    );
    await expect422(
      assertEvidenceFile({ buffer: PDF, fileName: 'scan.pdf', mimeType: 'image/png' }),
    );
    await expect422(
      assertEvidenceFile({ buffer: PDF, fileName: 'scan.png', mimeType: 'application/pdf' }),
    );
  });

  it('rejects a file of 10 MB + 1 byte with 422', async () => {
    const tooBig = Buffer.concat([PDF, Buffer.alloc(EVIDENCE_FILE_MAX_BYTES + 1 - PDF.length)]);
    expect(tooBig.byteLength).toBe(EVIDENCE_FILE_MAX_BYTES + 1);
    await expect422(
      assertEvidenceFile({ buffer: tooBig, fileName: 'big.pdf', mimeType: 'application/pdf' }),
    );
  });

  it('deletes an uploaded object that fails verification', async () => {
    const storage = {
      getObjectBuffer: vi.fn().mockResolvedValue(EXE),
      deleteObject: vi.fn().mockResolvedValue(undefined),
    } as unknown as StorageService;
    await expect422(
      verifyUploadedEvidence(storage, 'project-evidence/u1/p1', {
        objectKey: 'project-evidence/u1/p1/abc-fake.pdf',
        fileName: 'fake.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: EXE.byteLength,
      }),
    );
    expect(storage.deleteObject).toHaveBeenCalledWith('project-evidence/u1/p1/abc-fake.pdf');
  });

  it('refuses object keys outside the caller namespace', async () => {
    const storage = {
      getObjectBuffer: vi.fn(),
      deleteObject: vi.fn(),
    } as unknown as StorageService;
    await expect(
      verifyUploadedEvidence(storage, 'project-evidence/u1/p1', {
        objectKey: 'project-evidence/OTHER/p1/x.pdf',
        fileName: 'x.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 10,
      }),
    ).rejects.toMatchObject({ status: 404 });
    expect(storage.getObjectBuffer).not.toHaveBeenCalled();
  });
});
