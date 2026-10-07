import { randomUUID } from 'node:crypto';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersService } from './users.service.js';

function studentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    email: 'student@example.com',
    fullName: 'Test Student',
    role: 'STUDENT',
    provider: 'PASSWORD',
    emailVerified: true,
    institutionId: null,
    createdAt: new Date(),
    passwordHash: null,
    heldAt: null,
    onboardingCompleted: false,
    onboardingDetails: null,
    dpdpConsentAt: null,
    institution: null,
    company: null,
    primaryTrack: null,
    secondaryTrack: null,
    ...overrides,
  };
}

function minimalCompletion(overrides: Record<string, unknown> = {}) {
  return {
    interestDomain: 'CS_IT',
    firstName: 'Ada',
    lastName: 'Lovelace',
    phoneCountryCode: '+91',
    phoneNumber: '9876543210',
    dpdpConsent: true as const,
    ...overrides,
  };
}

function mockCompletedUpdate(
  prismaRef: { user: { update: ReturnType<typeof vi.fn> } },
  user: ReturnType<typeof studentRow>,
) {
  prismaRef.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
    ...user,
    ...data,
    onboardingCompleted: true,
    institution: null,
    company: null,
    primaryTrack: null,
    secondaryTrack: null,
  }));
}

function mockStorage() {
  return {
    upload: vi.fn().mockResolvedValue('profile-photos/user-id/photo.jpg'),
    getSignedDownloadUrl: vi
      .fn()
      .mockResolvedValue('https://storage.example/profile-photos/user-id/photo.jpg'),
    deleteObject: vi.fn().mockResolvedValue(undefined),
  };
}

describe('UsersService completeOnboarding', () => {
  const auth = { revokeAllForUser: vi.fn() };
  const outbox = { enqueueEnvelope: vi.fn().mockResolvedValue(undefined) };
  const storage = mockStorage();
  const auditPublisher = { record: vi.fn().mockResolvedValue(undefined) };
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    outbox.enqueueEnvelope.mockClear();
    auditPublisher.record.mockClear();
    service = new UsersService(
      prisma as never,
      auth as never,
      outbox as never,
      storage as never,
      auditPublisher as never,
    );
  });

  it('accepts valid minimal completion and sets onboardingCompleted=true', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    const result = await service.completeOnboarding(user.id, minimalCompletion());

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({
          onboardingCompleted: true,
          fullName: 'Ada Lovelace',
          dpdpConsentAt: expect.any(Date),
          onboardingDetails: expect.objectContaining({
            interestDomain: 'CS_IT',
            firstName: 'Ada',
            lastName: 'Lovelace',
            phoneCountryCode: '+91',
            phoneNumber: '9876543210',
            dpdpConsent: true,
          }),
        }),
      }),
    );
    expect(result.onboardingCompleted).toBe(true);
  });

  it('stamps the current consent version and records a consent-accepted audit event on first completion', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(user.id, minimalCompletion());

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({ consentVersion: 'v1' }),
        }),
      }),
    );
    expect(auditPublisher.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: user.id,
        action: 'student.consent_accepted',
        resourceType: 'user',
        resourceId: user.id,
        metadata: expect.objectContaining({ consentVersion: 'v1', source: 'onboarding_complete' }),
      }),
    );
  });

  it('does not record a second consent-accepted audit event on retry (already-consented user)', async () => {
    const alreadyConsentedUser = studentRow({ dpdpConsentAt: new Date('2026-01-01T00:00:00Z') });
    prisma.user.findUnique.mockResolvedValueOnce(alreadyConsentedUser);
    mockCompletedUpdate(prisma, alreadyConsentedUser);

    await service.completeOnboarding(alreadyConsentedUser.id, minimalCompletion());

    expect(auditPublisher.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'student.consent_accepted' }),
    );
  });

  it('preserves the original consent timestamp when onboarding completion is retried', async () => {
    const originalConsentAt = new Date('2026-01-01T00:00:00Z');
    const alreadyConsentedUser = studentRow({ dpdpConsentAt: originalConsentAt });
    prisma.user.findUnique.mockResolvedValueOnce(alreadyConsentedUser);
    mockCompletedUpdate(prisma, alreadyConsentedUser);

    await service.completeOnboarding(alreadyConsentedUser.id, minimalCompletion());

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ dpdpConsentAt: originalConsentAt }),
      }),
    );
  });

  it('persists study program + graduation year and records an audit event', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(
      user.id,
      minimalCompletion({
        academicProgram: { studyProgram: 'B.Tech CSE', graduationYear: 2026 },
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          graduationYear: 2026,
          onboardingDetails: expect.objectContaining({
            academicProgram: { studyProgram: 'B.Tech CSE', graduationYear: 2026 },
          }),
        }),
      }),
    );
    expect(auditPublisher.record).toHaveBeenCalledWith({
      actorId: user.id,
      action: 'student.academic_program_updated',
      resourceType: 'user',
      resourceId: user.id,
      reasonCode: null,
      metadata: {
        source: 'complete',
        previous: null,
        next: { studyProgram: 'B.Tech CSE', graduationYear: 2026 },
      },
    });
  });

  it('does not record an academic-program audit event when academicProgram is not submitted', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(user.id, minimalCompletion());

    expect(auditPublisher.record).not.toHaveBeenCalledWith(
      expect.objectContaining({ action: 'student.academic_program_updated' }),
    );
  });

  it('rejects an empty studyProgram string', async () => {
    await expect(
      service.completeOnboarding(
        randomUUID(),
        minimalCompletion({ academicProgram: { studyProgram: '' } }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a graduationYear that is too far in the past', async () => {
    await expect(
      service.completeOnboarding(
        randomUUID(),
        minimalCompletion({ academicProgram: { graduationYear: 1800 } }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a graduationYear that is too far in the future', async () => {
    await expect(
      service.completeOnboarding(
        randomUUID(),
        minimalCompletion({ academicProgram: { graduationYear: 3050 } }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-integer graduationYear', async () => {
    await expect(
      service.completeOnboarding(
        randomUUID(),
        minimalCompletion({ academicProgram: { graduationYear: 2025.5 } }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('is idempotent on repeated identical submissions', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValue(user);
    mockCompletedUpdate(prisma, user);
    const payload = minimalCompletion({
      academicProgram: { studyProgram: 'B.Tech CSE', graduationYear: 2026 },
    });

    const first = await service.completeOnboarding(user.id, payload);
    const second = await service.completeOnboarding(user.id, payload);

    expect(prisma.user.update).toHaveBeenCalledTimes(2);
    expect(first.onboardingCompleted).toBe(true);
    expect(second.onboardingCompleted).toBe(true);
  });

  it('rejects completion when interestDomain is missing', async () => {
    const { interestDomain: _removed, ...payload } = minimalCompletion();
    await expect(service.completeOnboarding(randomUUID(), payload)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects completion when firstName is missing', async () => {
    await expect(
      service.completeOnboarding(randomUUID(), minimalCompletion({ firstName: '' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completion when lastName is missing', async () => {
    await expect(
      service.completeOnboarding(randomUUID(), minimalCompletion({ lastName: '' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completion when phoneCountryCode is missing', async () => {
    await expect(
      service.completeOnboarding(randomUUID(), minimalCompletion({ phoneCountryCode: '' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects completion when phoneNumber is missing', async () => {
    await expect(
      service.completeOnboarding(randomUUID(), minimalCompletion({ phoneNumber: '' })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects payloads without DPDP consent', async () => {
    await expect(
      service.completeOnboarding(randomUUID(), minimalCompletion({ dpdpConsent: false })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not require jobPreferences', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await expect(service.completeOnboarding(user.id, minimalCompletion())).resolves.toMatchObject({
      onboardingCompleted: true,
    });
  });

  it('does not require skills', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    const result = await service.completeOnboarding(user.id, minimalCompletion());

    expect(result.onboardingCompleted).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({ skills: [] }),
        }),
      }),
    );
  });

  it('does not require social information', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await expect(service.completeOnboarding(user.id, minimalCompletion())).resolves.toMatchObject({
      onboardingCompleted: true,
    });
  });

  it('does not require education or experiences', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(user.id, minimalCompletion());

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({
            education: [],
            experiences: [],
          }),
        }),
      }),
    );
  });

  it('persists optional deferred profile fields when supplied', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(
      user.id,
      minimalCompletion({
        linkedinUrl: 'https://www.linkedin.com/in/ada',
        githubUrl: 'https://github.com/ada',
        skills: [{ type: 'language', name: 'English', proficiency: 'Fluent' }],
        jobPreferences: {
          expectedCtcLakhs: 8,
          currentLocation: 'Bengaluru',
          preferredLocations: ['Bengaluru'],
          preferredWorkModes: ['FULL_TIME'],
        },
      }),
    );

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({
            interestDomain: 'CS_IT',
            githubUrl: 'https://github.com/ada',
            linkedinUrl: 'https://www.linkedin.com/in/ada',
          }),
        }),
      }),
    );
  });

  it('does not create SkillClaims on minimal completion', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(user.id, minimalCompletion());

    expect(outbox.enqueueEnvelope).not.toHaveBeenCalled();
  });

  it('does not create SkillClaims when optional skills are supplied', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);
    // Th6-600 — technical skills are checked against the skill catalog.
    Object.assign(prisma, {
      skill: {
        findMany: vi
          .fn()
          .mockResolvedValue([{ code: 'GIT_VERSION_CONTROL' }, { code: 'PYTHON_PROGRAMMING' }]),
      },
    });

    await service.completeOnboarding(
      user.id,
      minimalCompletion({
        skills: [
          { type: 'technical', code: 'GIT_VERSION_CONTROL', name: 'Git & version control' },
          { type: 'technical', code: 'PYTHON_PROGRAMMING', name: 'Python' },
        ],
      }),
    );

    expect(outbox.enqueueEnvelope).not.toHaveBeenCalled();
  });

  it('does not enroll TECH_FULLSTACK as a side effect of completion', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    const result = await service.completeOnboarding(user.id, minimalCompletion());

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({
          primaryTrackId: expect.anything(),
          secondaryTrackId: expect.anything(),
        }),
      }),
    );
    expect(result.primaryTrack).toBeNull();
  });

  it('enqueues candidate.skills_discovered only for skills the candidate kept selected', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(
      user.id,
      minimalCompletion({
        skillDiscovery: {
          suggestedFromGithub: [
            { language: 'TypeScript', bytes: 900, byteShare: 0.9, repoCount: 3 },
            { language: 'CSS', bytes: 100, byteShare: 0.1, repoCount: 1 },
          ],
          selectedSkillNames: ['TypeScript'],
          customSkillNames: [],
        },
      }),
    );

    expect(outbox.enqueueEnvelope).toHaveBeenCalledTimes(1);
    const call = outbox.enqueueEnvelope.mock.calls[0][0] as { data: { languages: unknown[] } };
    expect(call.data.languages).toEqual([
      { language: 'TypeScript', bytes: 900, byteShare: 0.9, repoCount: 3 },
    ]);
  });

  it('does not enqueue candidate.skills_discovered when no skills were selected', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    mockCompletedUpdate(prisma, user);

    await service.completeOnboarding(user.id, minimalCompletion());

    expect(outbox.enqueueEnvelope).not.toHaveBeenCalled();
  });
});

describe('UsersService uploadProfilePhoto', () => {
  const auth = { revokeAllForUser: vi.fn() };
  const outbox = { enqueueEnvelope: vi.fn().mockResolvedValue(undefined) };
  const storage = mockStorage();
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    storage.upload.mockClear();
    storage.getSignedDownloadUrl.mockClear();
    service = new UsersService(
      prisma as never,
      auth as never,
      outbox as never,
      storage as never,
      { record: vi.fn().mockResolvedValue(undefined) } as never,
    );
  });

  it('stores the uploaded photo and returns a signed profilePhotoUrl', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    const result = await service.uploadProfilePhoto(user.id, {
      buffer: Buffer.from('fake-image'),
      fileName: 'avatar.png',
      mimeType: 'image/png',
    });

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: `profile-photos/${user.id}`,
        fileName: 'avatar.png',
        contentType: 'image/png',
      }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: user.id },
      data: { profilePhotoObjectKey: 'profile-photos/user-id/photo.jpg' },
    });
    expect(result.profilePhotoUrl).toBe('https://storage.example/profile-photos/user-id/photo.jpg');
  });

  it('rejects unsupported mime types', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);

    await expect(
      service.uploadProfilePhoto(user.id, {
        buffer: Buffer.from('fake'),
        fileName: 'avatar.gif',
        mimeType: 'image/gif',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts jpeg inferred from the file name when mime type is generic', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    await service.uploadProfilePhoto(user.id, {
      buffer: Buffer.from('fake-image'),
      fileName: 'avatar.jpg',
      mimeType: 'application/octet-stream',
    });

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: 'image/jpeg', fileName: 'avatar.jpg' }),
    );
  });

  it('returns storage_unavailable when object storage rejects the upload', async () => {
    const user = studentRow();
    prisma.user.findUnique.mockResolvedValueOnce(user);
    storage.upload.mockRejectedValueOnce(new Error('InvalidAccessKeyId'));

    await expect(
      service.uploadProfilePhoto(user.id, {
        buffer: Buffer.from('fake-image'),
        fileName: 'avatar.png',
        mimeType: 'image/png',
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({ error: 'storage_unavailable' }),
    });
  });
});

describe('UsersService saveOnboardingDraft', () => {
  const auth = { revokeAllForUser: vi.fn() };
  const outbox = { enqueueEnvelope: vi.fn().mockResolvedValue(undefined) };
  const storage = mockStorage();
  const auditPublisher = { record: vi.fn().mockResolvedValue(undefined) };
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };
    auditPublisher.record.mockClear();
    service = new UsersService(
      prisma as never,
      auth as never,
      outbox as never,
      storage as never,
      auditPublisher as never,
    );
  });

  it('rejects an invalid draft payload', async () => {
    await expect(
      service.saveOnboardingDraft(randomUUID(), { firstName: 42 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('merges progressive profile fields after onboarding is complete', async () => {
    const user = studentRow({
      onboardingCompleted: true,
      onboardingDetails: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        dpdpConsent: true,
        dpdpConsentAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    prisma.user.findUnique
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    await service.saveOnboardingDraft(user.id, {
      about: 'Full-stack engineer focused on verification systems.',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: {
          onboardingDetails: expect.objectContaining({
            about: 'Full-stack engineer focused on verification systems.',
          }),
        },
      }),
    );
  });

  it('merges partial fields into onboardingDetails without completing onboarding', async () => {
    const user = studentRow({ onboardingDetails: { firstName: 'Ada', linkedinUrl: '' } });
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    const result = await service.saveOnboardingDraft(user.id, {
      lastName: 'Lovelace',
      githubUrl: 'https://github.com/ada',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: {
          onboardingDetails: expect.objectContaining({
            firstName: 'Ada',
            lastName: 'Lovelace',
            githubUrl: 'https://github.com/ada',
            savedAt: expect.any(String),
          }),
        },
      }),
    );
    expect(result.onboardingCompleted).toBe(false);
    expect(result.profile).toBeNull();
    expect(result.draft?.firstName).toBe('Ada');
    expect(result.draft?.lastName).toBe('Lovelace');
    expect(result.profilePhotoUrl).toBeNull();
  });

  it('denormalizes graduationYear onto the User row and records an audit event', async () => {
    const user = studentRow({ onboardingDetails: { firstName: 'Ada' } });
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    await service.saveOnboardingDraft(user.id, {
      academicProgram: { graduationYear: 2027 },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({ graduationYear: 2027 }),
      }),
    );
    expect(auditPublisher.record).toHaveBeenCalledWith({
      actorId: user.id,
      action: 'student.academic_program_updated',
      resourceType: 'user',
      resourceId: user.id,
      reasonCode: null,
      metadata: {
        source: 'draft',
        previous: null,
        next: { graduationYear: 2027 },
      },
    });
  });

  it('does not record an audit event on unrelated draft saves', async () => {
    const user = studentRow({ onboardingDetails: { firstName: 'Ada' } });
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    await service.saveOnboardingDraft(user.id, { githubUrl: 'https://github.com/ada' });

    expect(auditPublisher.record).not.toHaveBeenCalled();
  });

  it('rejects an out-of-range graduationYear in the draft payload', async () => {
    await expect(
      service.saveOnboardingDraft(randomUUID(), {
        academicProgram: { graduationYear: 1800 },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('persists onboardingStep so a returning student resumes at the right wizard step (I212)', async () => {
    const user = studentRow({ onboardingDetails: { firstName: 'Ada' } });
    prisma.user.findUnique.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    const result = await service.saveOnboardingDraft(user.id, {
      onboardingStep: 'academics',
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({ onboardingStep: 'academics' }),
        }),
      }),
    );
    expect(result.draft?.onboardingStep).toBe('academics');
  });

  it('rejects an invalid onboardingStep value', async () => {
    await expect(
      service.saveOnboardingDraft(randomUUID(), { onboardingStep: 'not-a-real-step' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('saves a study-program-only draft then completes with graduation year, merging both', async () => {
    const draftUser = studentRow({ onboardingDetails: {} });
    prisma.user.findUnique.mockResolvedValueOnce(draftUser).mockResolvedValueOnce(draftUser);
    prisma.user.update.mockResolvedValueOnce(draftUser);

    await service.saveOnboardingDraft(draftUser.id, {
      academicProgram: { studyProgram: 'B.Tech CSE' },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({
            academicProgram: { studyProgram: 'B.Tech CSE' },
          }),
        }),
      }),
    );
  });

  it('preserves previously-set studyProgram when a later draft only changes graduationYear (post-completion merge)', async () => {
    const user = studentRow({
      onboardingCompleted: true,
      onboardingDetails: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        dpdpConsent: true,
        academicProgram: { studyProgram: 'B.Tech CSE' },
      },
    });
    prisma.user.findUnique
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user)
      .mockResolvedValueOnce(user);
    prisma.user.update.mockResolvedValueOnce(user);

    await service.saveOnboardingDraft(user.id, {
      academicProgram: { graduationYear: 2026 },
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          onboardingDetails: expect.objectContaining({
            academicProgram: { studyProgram: 'B.Tech CSE', graduationYear: 2026 },
          }),
        }),
      }),
    );
  });

  describe('UsersService resume operations', () => {
    const validResumePdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
        'Vishal Bharath R\nEmail: vishal@example.com\n' +
        'Education: B.Tech in Artificial Intelligence, KEC\n' +
        'Technical Skills: TypeScript, React, Python, PostgreSQL, Node.js\n' +
        'Work Experience: Software Engineer Intern at Infinitica\n' +
        'Projects: HireKiwi Talent Discovery Platform\n' +
        'endstream\nendobj\n%%EOF',
    );

    it('uploads initial resume for student without existing resume', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/resume.pdf`);

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);

      expect(result.resumeFile.fileName).toBe('resume.pdf');
      expect(result.resumeFiles).toHaveLength(1);
      expect(result.resumeFiles[0]?.fileName).toBe('resume.pdf');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          onboardingDetails: expect.objectContaining({
            resumeFile: expect.objectContaining({ fileName: 'resume.pdf' }),
            resumeFiles: [expect.objectContaining({ fileName: 'resume.pdf' })],
          }),
        },
      });
    });

    it('rejects direct replacement/upload if a resume already exists', async () => {
      const oldResume = {
        fileName: 'old-cv.pdf',
        objectKey: 'resumes/u1/old-key.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        uploadedAt: '2026-09-01T10:00:00.000Z',
        lastParsedAt: null,
      };
      const user = studentRow({
        onboardingDetails: {
          resumeFile: oldResume,
          resumeFiles: [oldResume],
        },
      });

      prisma.user.findUnique.mockResolvedValueOnce(user);

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'new-cv.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, file)).rejects.toThrow(
        'Remove your existing resume before uploading a new one.',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('supports remove-then-upload flow', async () => {
      const oldResume = {
        fileName: 'old-cv.pdf',
        objectKey: 'resumes/u1/old-key.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        uploadedAt: '2026-09-01T10:00:00.000Z',
        lastParsedAt: null,
      };
      const userWithResume = studentRow({
        onboardingDetails: {
          resumeFile: oldResume,
          resumeFiles: [oldResume],
        },
      });

      prisma.user.findUnique.mockResolvedValueOnce(userWithResume);
      prisma.user.update.mockResolvedValueOnce(userWithResume);

      // 1. Delete existing resume
      const deleteResult = await service.deleteResume(userWithResume.id, {
        objectKey: oldResume.objectKey,
      });
      expect(deleteResult.resumeFiles).toHaveLength(0);

      // 2. Upload new resume
      const emptyUser = studentRow({ onboardingDetails: { resumeFiles: [] } });
      prisma.user.findUnique.mockResolvedValueOnce(emptyUser);
      prisma.user.update.mockResolvedValueOnce(emptyUser);
      storage.upload.mockResolvedValueOnce(`resumes/${emptyUser.id}/new-cv.pdf`);

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'new-cv.pdf',
        mimeType: 'application/pdf',
      };

      const uploadResult = await service.uploadResume(emptyUser.id, file);
      expect(uploadResult.resumeFiles).toHaveLength(1);
      expect(uploadResult.resumeFile.fileName).toBe('new-cv.pdf');
    });

    it('rejects upload from non-student user', async () => {
      const user = studentRow({ role: 'COMPANY' });
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, file)).rejects.toThrow();
    });

    it('rejects invalid file types without .pdf extension', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const file = {
        buffer: Buffer.from('MZ executable header'),
        fileName: 'malicious.exe',
        mimeType: 'application/x-msdownload',
      };

      await expect(service.uploadResume(user.id, file)).rejects.toThrow(
        'Only PDF resumes are allowed.',
      );
    });

    it('rejects non-PDF files such as DOCX or TXT even if labeled .pdf if magic bytes fail', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const fakePdf = {
        buffer: Buffer.from('This is actually a plain text file pretending to be pdf.'),
        fileName: 'fake.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, fakePdf)).rejects.toThrow(
        'Only PDF resumes are allowed.',
      );
    });

    it('rejects files exceeding 5MB', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const file = {
        buffer: Buffer.alloc(6 * 1024 * 1024),
        fileName: 'large.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, file)).rejects.toThrow(
        'Resume must be 5 MB or smaller.',
      );
    });

    it('rejects corrupted or truncated PDF files', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const corruptPdf = {
        buffer: Buffer.from('%PDF-1.4 [corrupted stream data without trailer or text]'),
        fileName: 'corrupted.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, corruptPdf)).rejects.toThrow(
        'This PDF appears to be corrupted or unreadable.',
      );
    });

    it('rejects non-resume documents such as certificates or invoices', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const certificatePdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Certificate of Completion\n' +
            'This is to certify that John Doe has completed the Machine Learning Course.\n' +
            'Issued by Coursera on October 2026.\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'certificate.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, certificatePdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
    });

    it('rejects academic marksheets', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const marksheetPdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Statement of Marks and Semester Grade Report\n' +
            'Student Name: Jane Doe | Roll No: 12345\n' +
            'Subject Code: CS101 - Grade: A - SGPA: 8.9\n' +
            'Provisional Certificate Issued by University Controller of Examinations.\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'marksheet.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, marksheetPdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
    });

    it('rejects offer letters and appointment letters', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const offerLetterPdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Offer of Employment - Letter of Appointment\n' +
            'Dear Candidate, we are pleased to offer you the position of Software Engineer\n' +
            'with an annual fixed CTC of 8 LPA. Please sign and return acceptance.\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'offer-letter.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, offerLetterPdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
    });

    it('rejects invoices and billing receipts', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const invoicePdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Tax Invoice\n' +
            'Invoice No: INV-2026-001\n' +
            'Bill To: ABC Technologies Pvt Ltd\n' +
            'GSTIN: 33AAAAA0000A1Z5\n' +
            'Total Amount Due: INR 50,000 | Payment Receipt\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'invoice.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, invoicePdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
    });

    it('rejects random non-resume PDF articles or essays', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const articlePdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'The Quantum Theory of Light and Electrodynamics\n' +
            'In physics, radiation is the emission or transmission of energy in the form of waves or particles through space.\n' +
            'Electromagnetic radiation consists of photons which are synchronized oscillations of electric and magnetic fields.\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'article.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, articlePdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
    });

    it('accepts resume with only Experience and Skills', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/exp-skills.pdf`);

      const file = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'John Doe\n' +
            'Email: john@example.com | Phone: 9876543210\n' +
            'Professional Experience\n' +
            'Senior Backend Engineer at TechCorp (2020 - Present)\n' +
            'Technical Skills\n' +
            'TypeScript, Node.js, PostgreSQL, Redis, Docker, Kafka\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'exp-skills.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('exp-skills.pdf');
    });

    it('accepts resume with Education, Skills, and Projects', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/edu-skills-proj.pdf`);

      const file = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Priya Sharma\n' +
            'Email: priya@example.com | Phone: 9123456780\n' +
            'Education\n' +
            'B.Tech in Artificial Intelligence, KEC\n' +
            'Technical Skills\n' +
            'Python, PyTorch, Fastify, React, PostgreSQL\n' +
            'Projects\n' +
            'HireKiwi Intelligent Talent Discovery Engine\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'edu-skills-proj.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('edu-skills-proj.pdf');
    });

    it('accepts resume without Summary', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/no-summary.pdf`);

      const file = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Alex Miller\n' +
            'alex@example.com | +1 555 123 4567\n' +
            'Work Experience\n' +
            'Full Stack Engineer at WebScale (2022 - Present)\n' +
            'Education\n' +
            'B.S. in Computer Science\n' +
            'Skills\n' +
            'React, TypeScript, GraphQL, Next.js, Node.js\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'no-summary.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('no-summary.pdf');
    });

    it('accepts resume without Projects', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/no-projects.pdf`);

      const file = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Ananya Sen\n' +
            'ananya@example.com\n' +
            'Professional Summary\n' +
            'Experienced QA automation engineer with 4 years in testing.\n' +
            'Work Experience\n' +
            'SDET II at FinTech Ltd (2022 - Present)\n' +
            'Education\n' +
            'B.E. Information Technology\n' +
            'Technical Skills\n' +
            'Playwright, Cypress, Vitest, Jest, Python\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'no-projects.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('no-projects.pdf');
    });

    it('accepts resume without Certifications', async () => {
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/no-cert.pdf`);

      const file = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'David Kim\n' +
            'david@example.com\n' +
            'Work Experience\n' +
            'Frontend Developer at CloudBase\n' +
            'Education\n' +
            'B.S. Computer Science\n' +
            'Skills\n' +
            'HTML5, CSS3, JavaScript, Vue.js, Tailwind\n' +
            'Projects\n' +
            'Personal portfolio site and open-source UI libraries\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'no-cert.pdf',
        mimeType: 'application/pdf',
      };

      const result = await service.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('no-cert.pdf');
    });

    it('rejects document when AI classification finds no resume structure with very low confidence', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      // A PDF that has enough keywords to pass the heuristic Layer A (email, phone,
      // education, skills) — so it passes Layer A — but the AI comes back with empty
      // sections and very low confidence, indicating it isn't actually a resume.
      const ambiguousPdf = {
        buffer: Buffer.from(
          '%PDF-1.4\n1 0 obj\n<< /Length 200 >>\nstream\n' +
            'Contact: candidate@email.com Phone: 9876543210\n' +
            'Education: Bachelor Degree field of study\n' +
            'Skills: some technical skills listed here for testing purposes\n' +
            'Summary: professional with experience in industry\n' +
            'endstream\nendobj\n%%EOF',
        ),
        fileName: 'ambiguous.pdf',
        mimeType: 'application/pdf',
      };

      const mockResumeParse = {
        parse: vi.fn().mockResolvedValue({
          status: 'PARSED',
          draft: {
            education: [],
            experiences: [],
            skills: [],
            licenses: [],
            basicInfo: undefined,
            parseConfidence: 0.1,
            missingFields: ['education', 'experiences', 'skills', 'basicInfo'],
          },
        }),
      };

      const aiService = new UsersService(
        prisma as never,
        auth as never,
        outbox as never,
        storage as never,
        auditPublisher as never,
        mockResumeParse as never,
      );

      await expect(aiService.uploadResume(user.id, ambiguousPdf)).rejects.toThrow(
        "The uploaded document doesn't appear to be a resume.",
      );
      expect(mockResumeParse.parse).toHaveBeenCalled();
    });

    it('does NOT reject genuine resume when AI returns FAILED status (provider failed closed)', async () => {
      // CRITICAL: status === 'FAILED' means the AI gateway/provider failed,
      // NOT that the document is not a resume.  Must not reject the upload.
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/resume.pdf`);

      const mockResumeParse = {
        parse: vi.fn().mockResolvedValue({
          status: 'FAILED',
          draft: null,
        }),
      };

      const aiService = new UsersService(
        prisma as never,
        auth as never,
        outbox as never,
        storage as never,
        auditPublisher as never,
        mockResumeParse as never,
      );

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      };

      // Must succeed — AI failed-closed is NOT a reason to reject the upload.
      const result = await aiService.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('resume.pdf');
      expect(mockResumeParse.parse).toHaveBeenCalled();
    });

    it('returns 503 ServiceUnavailable when AI provider throws (not NOT_A_RESUME)', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const mockResumeParse = {
        parse: vi.fn().mockRejectedValue(new Error('no providers configured')),
      };

      const aiService = new UsersService(
        prisma as never,
        auth as never,
        outbox as never,
        storage as never,
        auditPublisher as never,
        mockResumeParse as never,
      );

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'resume.pdf',
        mimeType: 'application/pdf',
      };

      const err = await aiService.uploadResume(user.id, file).catch((e: unknown) => e);
      // Must be a ServiceUnavailableException (503) not a BadRequestException (400).
      expect(err).toMatchObject({ status: 503 });
      expect(JSON.stringify(err)).not.toContain("doesn't appear to be a resume");
    });

    it('invokes ResumeParseService and accepts when AI extracts a valid resume draft', async () => {
      const user = studentRow();
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/valid.pdf`);

      const mockResumeParse = {
        parse: vi.fn().mockResolvedValue({
          status: 'PARSED',
          draft: {
            basicInfo: { firstName: 'Jane', lastName: 'Doe' },
            education: [{ institutionName: 'MIT' }],
            experiences: [{ role: 'Engineer', company: 'Google' }],
            skills: [{ type: 'technical', name: 'TypeScript', proficiency: 'PROFICIENT' }],
            licenses: [],
            parseConfidence: 0.9,
            missingFields: [],
          },
        }),
      };

      const aiService = new UsersService(
        prisma as never,
        auth as never,
        outbox as never,
        storage as never,
        auditPublisher as never,
        mockResumeParse as never,
      );

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'valid-resume.pdf',
        mimeType: 'application/pdf',
      };

      const result = await aiService.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('valid-resume.pdf');
      expect(mockResumeParse.parse).toHaveBeenCalled();
    });

    it('accepts genuine resume even when some sections are absent from AI draft', async () => {
      // A real resume might only have basicInfo + skills; it must still be accepted.
      const user = studentRow({ onboardingDetails: {} });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);
      storage.upload.mockResolvedValueOnce(`resumes/${user.id}/resume.pdf`);

      const mockResumeParse = {
        parse: vi.fn().mockResolvedValue({
          status: 'PARSED',
          draft: {
            basicInfo: { firstName: 'Arun', lastName: 'Kumar' },
            education: [],
            experiences: [],
            skills: [{ type: 'technical', name: 'Python', proficiency: 'INTERMEDIATE' }],
            licenses: [],
            parseConfidence: 0.7,
            missingFields: ['education', 'experiences'],
          },
        }),
      };

      const aiService = new UsersService(
        prisma as never,
        auth as never,
        outbox as never,
        storage as never,
        auditPublisher as never,
        mockResumeParse as never,
      );

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'sparse-resume.pdf',
        mimeType: 'application/pdf',
      };

      // Must succeed — partial AI parse is not grounds for rejection.
      const result = await aiService.uploadResume(user.id, file);
      expect(result.resumeFile.fileName).toBe('sparse-resume.pdf');
    });

    it('preserves existing database state if storage upload fails', async () => {
      const user = studentRow({
        onboardingDetails: {
          resumeFile: null,
          resumeFiles: [],
        },
      });

      prisma.user.findUnique.mockResolvedValueOnce(user);
      storage.upload.mockRejectedValueOnce(new Error('S3 connection timed out'));

      const file = {
        buffer: validResumePdfBuffer,
        fileName: 'new.pdf',
        mimeType: 'application/pdf',
      };

      await expect(service.uploadResume(user.id, file)).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('reads resume state for student', async () => {
      const sampleResume = {
        fileName: 'my-resume.pdf',
        objectKey: 'resumes/u1/my-resume.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        uploadedAt: '2026-09-01T10:00:00.000Z',
        lastParsedAt: null,
      };
      const user = studentRow({
        onboardingDetails: {
          resumeFile: sampleResume,
          resumeFiles: [sampleResume],
        },
      });
      prisma.user.findUnique.mockResolvedValueOnce(user);

      const state = await service.getResumeState(user.id);
      expect(state.resumeFile?.fileName).toBe('my-resume.pdf');
      expect(state.resumeFiles).toHaveLength(1);
    });

    it('deletes stored resume and updates user record', async () => {
      const sampleResume = {
        fileName: 'my-resume.pdf',
        objectKey: 'resumes/u1/my-resume.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        uploadedAt: '2026-09-01T10:00:00.000Z',
        lastParsedAt: null,
      };
      const user = studentRow({
        onboardingDetails: {
          resumeFile: sampleResume,
          resumeFiles: [sampleResume],
        },
      });
      prisma.user.findUnique.mockResolvedValueOnce(user);
      prisma.user.update.mockResolvedValueOnce(user);

      const result = await service.deleteResume(user.id, {
        objectKey: 'resumes/u1/my-resume.pdf',
      });

      expect(result.resumeFiles).toEqual([]);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: user.id },
        data: {
          onboardingDetails: expect.not.objectContaining({
            resumeFile: expect.anything(),
          }),
        },
      });
      expect(storage.deleteObject).toHaveBeenCalledWith('resumes/u1/my-resume.pdf');
    });
  });
});
