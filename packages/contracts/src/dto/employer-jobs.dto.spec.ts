import { describe, expect, it } from 'vitest';
import {
  COMPANY_ROLE_PERMISSIONS,
  CreateEmployerJobRequestSchema,
  DuplicateEmployerJobRequestSchema,
  ROUTES,
  SKILL_CODES,
  UpdateEmployerJobRequestSchema,
} from '../index.js';

const institutionId = '00000000-0000-4000-8000-000000000001';
const taxonomySkill = SKILL_CODES[0] as string;

function validCreate(overrides: Record<string, unknown> = {}) {
  return {
    institutionId,
    roleTitle: 'Frontend Engineer Intern',
    domain: 'SOFTWARE_IT',
    requiredSkills: [{ skillCode: taxonomySkill, minProficiency: 'INTERMEDIATE' }],
    minYearsExperience: 0,
    maxYearsExperience: 2,
    location: 'Bengaluru',
    employmentType: 'INTERNSHIP',
    ...overrides,
  };
}

describe('JOB-01 employer job contracts', () => {
  it('accepts a job posted to one campus', () => {
    expect(CreateEmployerJobRequestSchema.safeParse(validCreate()).success).toBe(true);
  });

  it('allows no target campus for a normal, every-university company job', () => {
    const { institutionId: _omit, ...body } = validCreate();
    expect(CreateEmployerJobRequestSchema.safeParse(body).success).toBe(true);
  });

  it('never takes the company name or drive fields from the body', () => {
    const parsed = CreateEmployerJobRequestSchema.safeParse(
      validCreate({ companyName: 'Spoofed Inc', driveSpoc: 'x', aboutCompany: 'x' }),
    );
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect('companyName' in parsed.data).toBe(false);
      expect('driveSpoc' in parsed.data).toBe(false);
      expect('aboutCompany' in parsed.data).toBe(false);
    }
  });

  it('rejects an inverted experience range on create and update', () => {
    expect(
      CreateEmployerJobRequestSchema.safeParse(
        validCreate({ minYearsExperience: 5, maxYearsExperience: 1 }),
      ).success,
    ).toBe(false);
    expect(
      UpdateEmployerJobRequestSchema.safeParse({ minYearsExperience: 5, maxYearsExperience: 1 })
        .success,
    ).toBe(false);
  });

  it('allows partial updates but not a campus change', () => {
    const parsed = UpdateEmployerJobRequestSchema.safeParse({ roleTitle: 'Frontend Engineer' });
    expect(parsed.success).toBe(true);
    const moved = UpdateEmployerJobRequestSchema.safeParse({ institutionId });
    expect(moved.success && 'institutionId' in moved.data).toBe(false);
  });

  it('duplicates to the same or another campus', () => {
    expect(DuplicateEmployerJobRequestSchema.safeParse({}).success).toBe(true);
    expect(DuplicateEmployerJobRequestSchema.safeParse({ institutionId }).success).toBe(true);
  });

  it('registers every /employer/jobs route for COMPANY only', () => {
    const jobRoutes = ROUTES.filter((route) => route.path.startsWith('/employer/jobs'));
    const ids = jobRoutes.map((route) => `${route.method} ${route.path}`);
    expect(ids).toEqual(
      expect.arrayContaining([
        'GET /employer/jobs',
        'POST /employer/jobs',
        'GET /employer/jobs/:id',
        'PATCH /employer/jobs/:id',
        'DELETE /employer/jobs/:id',
        'POST /employer/jobs/:id/publish',
        'POST /employer/jobs/:id/close',
        'POST /employer/jobs/:id/duplicate',
      ]),
    );
    for (const route of jobRoutes) {
      expect(route.roles, `${route.method} ${route.path}`).toEqual(['COMPANY']);
    }
  });

  it('lets owners and recruiters view and manage jobs', () => {
    for (const role of ['OWNER', 'RECRUITER'] as const) {
      expect(COMPANY_ROLE_PERMISSIONS[role]).toContain('company.jobs.view');
      expect(COMPANY_ROLE_PERMISSIONS[role]).toContain('company.jobs.manage');
    }
  });
});
