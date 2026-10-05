import { describe, expect, it } from 'vitest';
import {
  CandidateOnboardingSkillSchema,
  StoredCandidateOnboardingSkillSchema,
} from './candidate-onboarding.dto.js';
import { CreateCandidateEducationDocumentSchema } from './candidate-profile.dto.js';
import { EVIDENCE_FILE_MAX_BYTES, EvidenceUploadUrlRequestSchema } from './evidence-file.dto.js';
import { CreateWorkExperienceDocumentSchema } from './work-experience.dto.js';

describe('Th6-600 evidence file DTOs', () => {
  const ok = { fileName: 'marks.pdf', mimeType: 'application/pdf', fileSizeBytes: 1024 };

  it('accepts PDF and PNG up to 10 MB', () => {
    expect(EvidenceUploadUrlRequestSchema.safeParse(ok).success).toBe(true);
    expect(
      EvidenceUploadUrlRequestSchema.safeParse({
        fileName: 'offer.png',
        mimeType: 'image/png',
        fileSizeBytes: EVIDENCE_FILE_MAX_BYTES,
      }).success,
    ).toBe(true);
  });

  it('rejects JPG', () => {
    expect(
      EvidenceUploadUrlRequestSchema.safeParse({
        fileName: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 1024,
      }).success,
    ).toBe(false);
  });

  it('rejects 10 MB + 1 byte', () => {
    expect(
      EvidenceUploadUrlRequestSchema.safeParse({
        ...ok,
        fileSizeBytes: EVIDENCE_FILE_MAX_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it('rejects an extension that does not match the type', () => {
    expect(EvidenceUploadUrlRequestSchema.safeParse({ ...ok, fileName: 'setup.exe' }).success).toBe(
      false,
    );
    expect(EvidenceUploadUrlRequestSchema.safeParse({ ...ok, mimeType: 'image/png' }).success).toBe(
      false,
    );
  });

  it('education and experience attach payloads reject inline data URIs and JPG', () => {
    const base = {
      fileUrl: 'education-proofs/u1/e1/abc-marks.pdf',
      fileName: 'marks.pdf',
      fileSizeBytes: 1024,
      mimeType: 'application/pdf',
    };
    expect(
      CreateCandidateEducationDocumentSchema.safeParse({ ...base, documentType: 'MARKSHEET' })
        .success,
    ).toBe(true);
    expect(
      CreateCandidateEducationDocumentSchema.safeParse({
        ...base,
        documentType: 'MARKSHEET',
        fileUrl: 'data:application/pdf;base64,JVBERi0=',
      }).success,
    ).toBe(false);
    expect(
      CreateWorkExperienceDocumentSchema.safeParse({
        ...base,
        documentType: 'OFFER_LETTER',
        fileName: 'offer.jpg',
        mimeType: 'image/jpeg',
      }).success,
    ).toBe(false);
  });
});

describe('Th6-600 onboarding skills', () => {
  it('accepts a catalog technical skill with no proficiency', () => {
    expect(
      CandidateOnboardingSkillSchema.safeParse({
        type: 'technical',
        code: 'REACT_FRONTEND',
        name: 'React',
      }).success,
    ).toBe(true);
  });

  it('rejects a free-text technical skill (no catalog code)', () => {
    expect(
      CandidateOnboardingSkillSchema.safeParse({ type: 'technical', name: 'My cool skill' })
        .success,
    ).toBe(false);
  });

  it('rejects a self-rated technical skill', () => {
    expect(
      CandidateOnboardingSkillSchema.safeParse({
        type: 'technical',
        code: 'REACT_FRONTEND',
        name: 'React',
        proficiency: 'ADVANCED',
      }).success,
    ).toBe(false);
  });

  it('keeps spoken languages with their level', () => {
    expect(
      CandidateOnboardingSkillSchema.safeParse({
        type: 'language',
        name: 'Tamil',
        proficiency: 'Fluent',
      }).success,
    ).toBe(true);
  });

  it('still reads legacy stored free-text skills (nothing is deleted)', () => {
    expect(
      StoredCandidateOnboardingSkillSchema.safeParse({
        type: 'technical',
        name: 'Python',
        proficiency: 'ADVANCED',
      }).success,
    ).toBe(true);
  });
});
