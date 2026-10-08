import { describe, expect, it } from 'vitest';
import type { EmployerJobDto } from '@hirekiwi/contracts';
import {
  EMPTY_JOB_FORM,
  buildJobInternal,
  jobToForm,
  toJobPayload,
  validateJobForm,
  type JobForm,
  sampleJobForm,
} from './job-form';

const skill = { code: 'PYTHON', name: 'Python', level: 'Intermediate' as const };

function filled(over: Partial<JobForm> = {}): JobForm {
  return {
    ...EMPTY_JOB_FORM,
    title: 'Backend Engineer',
    location: 'Bengaluru',
    mustHave: [skill],
    ...over,
  };
}

describe('validateJobForm', () => {
  it('accepts a minimal valid job', () => {
    expect(validateJobForm(filled())).toBeNull();
  });

  it('requires a title and at least one must-have skill', () => {
    expect(validateJobForm(filled({ title: '  ' }))).toMatch(/title/i);
    expect(validateJobForm(filled({ mustHave: [] }))).toMatch(/must-have skill/i);
  });

  it('only needs a location when the job is not remote', () => {
    expect(validateJobForm(filled({ location: '' }))).toMatch(/location/i);
    expect(validateJobForm(filled({ location: '', workMode: 'Remote' }))).toBeNull();
  });

  it('rejects inverted experience and pay ranges', () => {
    expect(validateJobForm(filled({ minYears: '5', maxYears: '2' }))).toMatch(/experience/i);
    expect(validateJobForm(filled({ payMin: '20', payMax: '10' }))).toMatch(/pay/i);
  });

  it('rejects zero openings and a deadline in the past', () => {
    expect(validateJobForm(filled({ openings: '0' }))).toMatch(/openings/i);
    expect(
      validateJobForm(filled({ deadline: '2020-01-01' }), new Date('2026-10-08T00:00:00')),
    ).toMatch(/deadline/i);
    expect(
      validateJobForm(filled({ deadline: '2026-10-09' }), new Date('2026-10-08T00:00:00')),
    ).toBeNull();
  });
});

describe('toJobPayload', () => {
  it('maps the core fields to the existing job columns', () => {
    const payload = toJobPayload(
      filled({
        type: 'Contract',
        workMode: 'Hybrid',
        minYears: '1',
        maxYears: '4',
        openings: '3',
        deadline: '2026-12-01',
        payMin: '8',
        payMax: '12',
        payPeriod: 'LPA',
      }),
    );
    expect(payload).toMatchObject({
      roleTitle: 'Backend Engineer',
      employmentType: 'CONTRACT',
      workMode: 'HYBRID',
      minYearsExperience: 1,
      maxYearsExperience: 4,
      headcount: 3,
      lastDateToApply: '2026-12-01',
      requiredSkills: [{ skillCode: 'PYTHON', minProficiency: 'INTERMEDIATE' }],
    });
    expect(payload.salaryDetails).toBe('₹8–12 LPA');
  });

  it('describes bonus, equity and negotiable pay in the pay text', () => {
    const payload = toJobPayload(
      filled({ payMin: '10', payMax: '10', payType: 'NEGOTIABLE', bonus: true, equity: true }),
    );
    expect(payload.salaryDetails).toBe('₹10 LPA (negotiable, bonus, equity)');
  });

  it('puts the extra sections in details and keeps internal notes apart', () => {
    const payload = toJobPayload(
      filled({
        department: 'Platform',
        functionCategory: 'Software engineering',
        tags: ['Fresher friendly', 'Urgent hiring'],
        tools: ['Docker'],
        goodToHave: [{ name: 'GraphQL', weight: 4 }],
        coding: true,
        interviewRounds: '3',
        atsReferenceId: 'REQ-1',
        hiringPriority: 'High',
        hiringManager: 'Asha',
      }),
    );
    expect(payload.details).toMatchObject({
      department: 'Platform',
      functionCategory: 'Software engineering',
      tags: ['Fresher friendly', 'Urgent hiring'],
      tools: ['Docker'],
      goodToHaveSkills: [{ name: 'GraphQL', weight: 4 }],
      assessment: { coding: true, interviewRounds: 3 },
    });
    expect(payload.internal).toEqual({
      atsReferenceId: 'REQ-1',
      hiringPriority: 'HIGH',
      hiringManager: 'Asha',
    });
    // Internal notes never leak into the candidate-facing details.
    expect(JSON.stringify(payload.details)).not.toContain('REQ-1');
    expect(JSON.stringify(payload.details)).not.toContain('Asha');
  });

  it('turns the assessment choices into the round description', () => {
    const payload = toJobPayload(filled({ coding: true, aptitude: true, interviewRounds: '2' }));
    expect(payload.roundDetails).toBe('Coding assessment, Aptitude, 2 interview rounds');
  });

  it('saves a job that is on hold as on hold', () => {
    expect(toJobPayload(filled({ status: 'On hold' })).details.onHold).toBe(true);
    expect(toJobPayload(filled({ status: 'Open' })).details.onHold).toBeUndefined();
  });
});

describe('buildJobInternal', () => {
  it('leaves empty internal fields out', () => {
    expect(buildJobInternal(filled())).toEqual({
      atsReferenceId: undefined,
      hiringPriority: undefined,
      hiringManager: undefined,
    });
  });
});

describe('jobToForm', () => {
  it('round-trips a saved job back into the form', () => {
    const job = {
      roleTitle: 'Data Analyst',
      employmentType: 'INTERNSHIP',
      workMode: 'REMOTE',
      location: 'Pune',
      minYearsExperience: 0,
      maxYearsExperience: 2,
      headcount: 4,
      lastDateToApply: '2026-11-30',
      roleDetails: 'Crunch numbers.',
      requiredSkills: [{ skillCode: 'PYTHON', minProficiency: 'ADVANCED' }],
      details: {
        department: 'Insights',
        tags: ['Remote friendly'],
        compensation: {
          currency: 'USD',
          min: 20,
          max: 30,
          period: 'per hour',
          type: 'NEGOTIABLE',
          bonus: true,
        },
        goodToHaveSkills: [{ name: 'dbt', weight: 2 }],
        assessment: { aptitude: true, interviewRounds: 1 },
        joiningTimeline: 'Within 30 days',
        onHold: true,
      },
      internal: { atsReferenceId: 'REQ-9', hiringPriority: 'URGENT' },
    } as unknown as EmployerJobDto;

    const form = jobToForm(job);
    expect(form).toMatchObject({
      title: 'Data Analyst',
      type: 'Internship',
      workMode: 'Remote',
      location: 'Pune',
      openings: '4',
      deadline: '2026-11-30',
      summary: 'Crunch numbers.',
      department: 'Insights',
      tags: ['Remote friendly'],
      currency: 'USD',
      payMin: '20',
      payMax: '30',
      payPeriod: 'per hour',
      payType: 'NEGOTIABLE',
      bonus: true,
      aptitude: true,
      interviewRounds: '1',
      joiningTimeline: 'Within 30 days',
      status: 'On hold',
      atsReferenceId: 'REQ-9',
      hiringPriority: 'Urgent',
    });
    expect(form.mustHave[0]).toMatchObject({ code: 'PYTHON', level: 'Advanced' });
    expect(form.goodToHave).toEqual([{ name: 'dbt', weight: 2 }]);
  });
});

describe('sampleJobForm', () => {
  const now = new Date('2026-10-08T09:30:00Z');

  it('is a complete job that passes validation', () => {
    const form = sampleJobForm(now);
    expect(validateJobForm(form, now)).toBeNull();
    expect(form.mustHave.length).toBeGreaterThan(0);
    expect(form.title).toMatch(/\[TEST\]/);
  });

  it('sets a deadline 30 days out and builds a valid payload', () => {
    const form = sampleJobForm(now);
    expect(form.deadline).toBe('2026-11-07');
    const payload = toJobPayload(form);
    expect(payload.requiredSkills.length).toBeGreaterThan(0);
    expect(payload.details.onHold).toBeUndefined();
    expect(payload.internal.atsReferenceId).toBe('TEST-0001');
  });
});

describe('sampleJobForm', () => {
  const now = new Date('2026-10-08T09:30:00Z');

  it('is a complete job that passes validation', () => {
    const form = sampleJobForm(now);
    expect(validateJobForm(form, now)).toBeNull();
    expect(form.mustHave.length).toBeGreaterThan(0);
    expect(form.title).toMatch(/\[TEST\]/);
  });

  it('sets a deadline 30 days out and builds a valid payload', () => {
    const form = sampleJobForm(now);
    expect(form.deadline).toBe('2026-11-07');
    const payload = toJobPayload(form);
    expect(payload.requiredSkills.length).toBeGreaterThan(0);
    expect(payload.details.onHold).toBeUndefined();
    expect(payload.internal.atsReferenceId).toBe('TEST-0001');
  });
});
