import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createDocumentUploadUrl, attachDocument } = vi.hoisted(() => ({
  createDocumentUploadUrl: vi.fn(),
  attachDocument: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: { projects: { createDocumentUploadUrl, attachDocument }, users: {} },
}));

import { uploadProjectEvidence, validateEvidenceFile } from './evidence-upload';

const fetchMock = vi.fn();

describe('Th6-600 project evidence upload', () => {
  beforeEach(() => {
    createDocumentUploadUrl.mockReset().mockResolvedValue({
      uploadUrl: 'https://storage.test/put?sig=1',
      objectKey: 'project-evidence/u1/p1/abc-report.pdf',
      expiresInSeconds: 900,
    });
    attachDocument.mockReset().mockResolvedValue({ id: 'd1', fileName: 'report.pdf' });
    fetchMock.mockReset().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
  });

  it('requests a presigned URL, PUTs the file, then attaches the object key', async () => {
    const file = new File(['%PDF-1.7 test'], 'report.pdf', { type: 'application/pdf' });
    const doc = await uploadProjectEvidence('p1', file);

    expect(createDocumentUploadUrl).toHaveBeenCalledWith('p1', {
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: file.size,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://storage.test/put?sig=1',
      expect.objectContaining({ method: 'PUT', body: file }),
    );
    expect(attachDocument).toHaveBeenCalledWith('p1', {
      objectKey: 'project-evidence/u1/p1/abc-report.pdf',
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: file.size,
    });
    expect(doc).toEqual({ id: 'd1', fileName: 'report.pdf' });
  });

  it('refuses JPG and files over 10 MB before uploading', async () => {
    expect(validateEvidenceFile({ name: 'photo.jpg', size: 100 })).toMatch(/PDF and PNG/);
    expect(validateEvidenceFile({ name: 'big.pdf', size: 10 * 1024 * 1024 + 1 })).toMatch(/10 MB/);
    await expect(
      uploadProjectEvidence('p1', new File(['x'], 'photo.jpg', { type: 'image/jpeg' })),
    ).rejects.toThrow(/PDF and PNG/);
    expect(createDocumentUploadUrl).not.toHaveBeenCalled();
  });
});
