import { describe, expect, it } from 'vitest';

import { canAddResume, normalizeResumeFiles } from '@/lib/resume-list';

const sampleFile = {
  fileName: 'cv.pdf',
  objectKey: 'resumes/u1/cv.pdf',
  mimeType: 'application/pdf',
  fileSizeBytes: 1024,
  uploadedAt: '2026-09-12T10:00:00.000Z',
};

describe('resume-list', () => {
  it('normalizes legacy single resume responses', () => {
    expect(normalizeResumeFiles({ resumeFile: sampleFile, resumeFiles: [] })).toEqual([sampleFile]);
  });

  it('prefers resumeFiles when present', () => {
    expect(
      normalizeResumeFiles({
        resumeFile: null,
        resumeFiles: [sampleFile, { ...sampleFile, fileName: 'old.pdf' }],
      }),
    ).toHaveLength(2);
  });

  it('enforces single resume restriction on the client', () => {
    expect(canAddResume([])).toBe(true);
    expect(canAddResume([sampleFile])).toBe(false);
  });
});
