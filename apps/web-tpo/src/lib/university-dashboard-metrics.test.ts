import { describe, expect, it } from 'vitest';
import type { InstitutionStudentDto, SkillClaimDto } from '@hirekiwi/contracts';
import {
  buildUniversityRosterRows,
  computeUniversityDashboardMetrics,
  filterUniversityRoster,
  verificationStateForStudent,
} from './university-dashboard-metrics';

const student = (overrides: Partial<InstitutionStudentDto>): InstitutionStudentDto => ({
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'a@school.edu',
  fullName: 'Alex Student',
  batchId: null,
  batchName: 'Comp. Sci',
  inviteStatus: 'ACCEPTED',
  lastSentAt: null,
  acceptedAt: null,
  heldAt: null,
  linkedinUrl: null,
  githubUrl: null,
  ...overrides,
});

const claim = (overrides: Partial<SkillClaimDto>): SkillClaimDto =>
  ({
    claimId: '22222222-2222-4222-8222-222222222222',
    studentId: '11111111-1111-4111-8111-111111111111',
    skillCode: 'REACT',
    proficiency: 'ADVANCED',
    status: 'VERIFIED',
    strikes: 0,
    lockedUntil: null,
    lastAttemptId: null,
    ...overrides,
  }) as SkillClaimDto;

describe('computeUniversityDashboardMetrics', () => {
  it('counts whitelisted students, fully verified, and summed application counts', () => {
    const students = [
      student({ userId: '11111111-1111-4111-8111-111111111111' }),
      student({
        userId: '33333333-3333-4333-8333-333333333333',
        inviteStatus: 'PENDING',
      }),
    ];
    const claims = [claim({})];
    expect(computeUniversityDashboardMetrics(students, claims, 8)).toEqual({
      whitelisted: 2,
      fullyVerified: 1,
      opportunitiesMatched: 8,
    });
  });
});

describe('verificationStateForStudent', () => {
  it('returns Full when the student has a verified claim', () => {
    const map = new Map([['11111111-1111-4111-8111-111111111111', 1]]);
    expect(verificationStateForStudent(student({}), map)).toBe('Full');
  });

  it('returns Partial for accepted invites without verified claims', () => {
    expect(verificationStateForStudent(student({ inviteStatus: 'ACCEPTED' }), new Map())).toBe(
      'Partial',
    );
  });

  it('returns Pending for non-accepted invites', () => {
    expect(verificationStateForStudent(student({ inviteStatus: 'PENDING' }), new Map())).toBe(
      'Pending',
    );
  });
});

describe('buildUniversityRosterRows', () => {
  it('maps major from batch name and verification badge', () => {
    const rows = buildUniversityRosterRows([student({})], [claim({})]);
    expect(rows[0]).toMatchObject({
      name: 'Alex Student',
      email: 'a@school.edu',
      major: 'Comp. Sci',
      verificationState: 'Full',
      hiredLabel: '—',
      verifiedSkillsCount: 1,
    });
  });
});

describe('filterUniversityRoster', () => {
  const sampleRoster = [
    {
      userId: '11111111-aaaa-4111-8111-111111111111',
      name: 'Ada Lovelace',
      email: 'ada@school.edu',
      major: 'Computer Science',
      verificationState: 'Full' as const,
      hiredLabel: '—',
      verifiedSkillsCount: 3,
    },
    {
      userId: '22222222-bbbb-4222-8222-222222222222',
      name: 'Alan Turing',
      email: 'alan@cambridge.edu',
      major: 'Mathematics',
      verificationState: 'Partial' as const,
      hiredLabel: '—',
      verifiedSkillsCount: 1,
    },
    {
      userId: '33333333-cccc-4333-8333-333333333333',
      name: 'Grace Hopper',
      email: 'grace@navy.mil',
      major: 'Systems',
      verificationState: 'Pending' as const,
      hiredLabel: '—',
      verifiedSkillsCount: 0,
    },
  ];

  it('returns full roster when query is empty or whitespace', () => {
    expect(filterUniversityRoster(sampleRoster, '')).toEqual(sampleRoster);
    expect(filterUniversityRoster(sampleRoster, '   ')).toEqual(sampleRoster);
  });

  it('filters by student name case-insensitively and with partial matching', () => {
    const result = filterUniversityRoster(sampleRoster, 'ada');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Ada Lovelace');

    const partial = filterUniversityRoster(sampleRoster, 'TUR');
    expect(partial).toHaveLength(1);
    expect(partial[0]?.name).toBe('Alan Turing');
  });

  it('filters by student email', () => {
    const result = filterUniversityRoster(sampleRoster, 'cambridge.edu');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Alan Turing');
  });

  it('filters by student ID prefix and full UUID', () => {
    const byPrefix = filterUniversityRoster(sampleRoster, '11111111');
    expect(byPrefix).toHaveLength(1);
    expect(byPrefix[0]?.name).toBe('Ada Lovelace');

    const byFull = filterUniversityRoster(sampleRoster, '22222222-bbbb-4222-8222-222222222222');
    expect(byFull).toHaveLength(1);
    expect(byFull[0]?.name).toBe('Alan Turing');
  });

  it('filters when query includes "ID " prefix as shown in UI table', () => {
    const result = filterUniversityRoster(sampleRoster, 'ID 11111111');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Ada Lovelace');

    const withColon = filterUniversityRoster(sampleRoster, 'id: 33333333');
    expect(withColon).toHaveLength(1);
    expect(withColon[0]?.name).toBe('Grace Hopper');
  });

  it('filters by major', () => {
    const result = filterUniversityRoster(sampleRoster, 'systems');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Grace Hopper');
  });

  it('ignores leading and trailing whitespace', () => {
    const result = filterUniversityRoster(sampleRoster, '  grace  ');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Grace Hopper');
  });

  it('returns an empty array when no students match', () => {
    const result = filterUniversityRoster(sampleRoster, 'nonexistent-query-xyz');
    expect(result).toEqual([]);
  });
});
