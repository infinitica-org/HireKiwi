import { describe, expect, it } from 'vitest';
import type { InstitutionStudentDto, SkillClaimDto } from '@hirekiwi/contracts';
import {
  buildConsolidatedReportCsv,
  buildPlacementOpportunitiesSummary,
  buildVerificationByMajorRows,
  toCsv,
} from './tpo-reports-export';

const student = (overrides: Partial<InstitutionStudentDto>): InstitutionStudentDto => ({
  userId: '11111111-1111-4111-8111-111111111111',
  email: 'a@school.edu',
  fullName: 'Alex',
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

describe('buildVerificationByMajorRows', () => {
  it('groups by batch name and computes completion percentage', () => {
    const students = [
      student({ userId: '11111111-1111-4111-8111-111111111111', batchName: 'Comp. Sci' }),
      student({
        userId: '22222222-2222-4222-8222-222222222222',
        batchName: 'Marketing',
        inviteStatus: 'PENDING',
      }),
    ];
    const claims = [
      {
        studentId: '11111111-1111-4111-8111-111111111111',
        status: 'VERIFIED',
      } as SkillClaimDto,
    ];

    const rows = buildVerificationByMajorRows(students, claims);
    expect(rows).toHaveLength(2);
    const cs = rows.find((r) => r.major === 'Comp. Sci');
    expect(cs?.fullyVerified).toBe(1);
    expect(cs?.completionPct).toBe(100);
  });

  it('reconciles counts where Whitelisted equals Fully Verified + Partial + Pending', () => {
    const students = [
      student({ userId: 's1', batchName: 'Batch 2026', inviteStatus: 'ACCEPTED' }),
      student({ userId: 's2', batchName: 'Batch 2026', inviteStatus: 'ACCEPTED' }),
      student({ userId: 's3', batchName: 'Batch 2026', inviteStatus: 'PENDING' }),
      student({ userId: 's4', batchName: null, inviteStatus: 'ACCEPTED' }), // Undeclared
    ];
    const claims = [{ studentId: 's1', status: 'VERIFIED' } as SkillClaimDto];

    const rows = buildVerificationByMajorRows(students, claims);
    expect(rows).toHaveLength(2);

    const b26 = rows.find((r) => r.major === 'Batch 2026');
    expect(b26).toBeDefined();
    if (!b26) throw new Error('Batch 2026 row not found');
    expect(b26.whitelisted).toBe(3);
    expect(b26.fullyVerified).toBe(1);
    expect(b26.partial).toBe(1);
    expect(b26.pending).toBe(1);
    expect(b26.whitelisted).toBe(b26.fullyVerified + b26.partial + b26.pending);

    const undeclared = rows.find((r) => r.major === 'Undeclared');
    expect(undeclared).toBeDefined();
    if (!undeclared) throw new Error('Undeclared row not found');
    expect(undeclared.whitelisted).toBe(1);
    expect(undeclared.fullyVerified).toBe(0);
    expect(undeclared.partial).toBe(1);
    expect(undeclared.pending).toBe(0);
    expect(undeclared.whitelisted).toBe(
      undeclared.fullyVerified + undeclared.partial + undeclared.pending,
    );
  });
});

describe('buildPlacementOpportunitiesSummary', () => {
  it('returns whitelisted and application totals', () => {
    const summary = buildPlacementOpportunitiesSummary(
      [student({})],
      [{ studentId: '11111111-1111-4111-8111-111111111111', status: 'VERIFIED' } as SkillClaimDto],
      [{ status: 'OPEN' } as never, { status: 'DRAFT' } as never],
      12,
    );
    expect(summary).toEqual({
      whitelisted: 1,
      fullyVerified: 1,
      activeOpenings: 1,
      totalApplications: 12,
    });
  });
});

describe('buildConsolidatedReportCsv', () => {
  it('formats all three sections with proper headers, blank lines, and BOM', () => {
    const summary = {
      whitelisted: 54,
      fullyVerified: 12,
      activeOpenings: 4,
      totalApplications: 48,
    };
    const verificationRows = [
      {
        major: 'Computer Science',
        whitelisted: 30,
        fullyVerified: 10,
        partial: 15,
        pending: 5,
        completionPct: 33,
      },
    ];
    const employerRows = [
      {
        employerName: 'Acme, Inc. "Global"',
        activeOpenings: 2,
        totalOpenings: 3,
        applications: 20,
      },
    ];

    const csv = buildConsolidatedReportCsv({
      summary,
      verificationRows,
      employerRows,
    });

    expect(csv.startsWith('\uFEFF')).toBe(true);

    // Section A
    expect(csv).toContain('=== Section A: Summary Metrics ===');
    expect(csv).toContain('"Whitelisted Students","54"');
    expect(csv).toContain('"Fully Verified","12"');
    expect(csv).toContain('"Active Drives","4"');
    expect(csv).toContain('"Applications Matched","48"');

    // Section B
    expect(csv).toContain('=== Section B: Verification by Cohort / Batch ===');
    expect(csv).toContain(
      '"Cohort / Batch","Whitelisted","Fully Verified","Partial","Pending","Completion %"',
    );
    expect(csv).toContain('"Computer Science","30","10","15","5","33"');

    // Section C
    expect(csv).toContain('=== Section C: Employer Engagement ===');
    expect(csv).toContain('"Employer","Active Openings","Total Openings","Applications"');
    // Escaping of quotes and commas
    expect(csv).toContain('"Acme, Inc. ""Global"""');
    expect(csv).toContain('"20"');
  });

  it('handles empty verification and employer sections cleanly', () => {
    const summary = {
      whitelisted: 0,
      fullyVerified: 0,
      activeOpenings: 0,
      totalApplications: 0,
    };

    const csv = buildConsolidatedReportCsv({
      summary,
      verificationRows: [],
      employerRows: [],
    });

    expect(csv).toContain('"No students on the whitelist yet"');
    expect(csv).toContain('"No employers in the repository yet"');
  });
});

describe('toCsv', () => {
  it('includes utf-8 bom and quoted headers', () => {
    expect(toCsv(['Major'], [['Comp. Sci']])).toMatch(/^\uFEFF"Major"/);
  });
});
