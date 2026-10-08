import { describe, expect, it } from 'vitest';
import {
  CreateEmployerJobRequestSchema,
  UpdateEmployerJobRequestSchema,
} from '@hirekiwi/contracts';
import { EMPTY_JOB_FORM, sampleJobForm, toJobPayload } from './job-form';

/** The form's request body must be accepted by the API's own schema, or posting fails with a 422. */
describe('job payload matches the API contract', () => {
  it('accepts the sample job on create', () => {
    const result = CreateEmployerJobRequestSchema.safeParse(toJobPayload(sampleJobForm()));
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it('accepts the sample job on update', () => {
    const result = UpdateEmployerJobRequestSchema.safeParse(toJobPayload(sampleJobForm()));
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });

  it('accepts a minimal job', () => {
    const form = { ...sampleJobForm(), ...EMPTY_JOB_FORM, title: 'Minimal', location: 'Pune' };
    form.mustHave = sampleJobForm().mustHave;
    const result = CreateEmployerJobRequestSchema.safeParse(toJobPayload(form));
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });
});
