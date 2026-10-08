import { describe, expect, it } from 'vitest';
import {
  ProfessionalCredentialDeclarationResponseDtoSchema,
  UpdateProfessionalCredentialDeclarationDtoSchema,
} from './evidence.dto.js';

describe('ProfessionalCredential declaration schemas', () => {
  it('accepts boolean true, false, and null for declaration response', () => {
    expect(
      ProfessionalCredentialDeclarationResponseDtoSchema.safeParse({ hasNoCredentials: true })
        .success,
    ).toBe(true);
    expect(
      ProfessionalCredentialDeclarationResponseDtoSchema.safeParse({ hasNoCredentials: false })
        .success,
    ).toBe(true);
    expect(
      ProfessionalCredentialDeclarationResponseDtoSchema.safeParse({ hasNoCredentials: null })
        .success,
    ).toBe(true);
    expect(
      ProfessionalCredentialDeclarationResponseDtoSchema.safeParse({ hasNoCredentials: 'none' })
        .success,
    ).toBe(false);
    expect(
      ProfessionalCredentialDeclarationResponseDtoSchema.safeParse({ hasNoCredentials: 123 })
        .success,
    ).toBe(false);
  });

  it('accepts boolean true, false, and null for declaration update', () => {
    expect(
      UpdateProfessionalCredentialDeclarationDtoSchema.safeParse({ hasNoCredentials: true })
        .success,
    ).toBe(true);
    expect(
      UpdateProfessionalCredentialDeclarationDtoSchema.safeParse({ hasNoCredentials: false })
        .success,
    ).toBe(true);
    expect(
      UpdateProfessionalCredentialDeclarationDtoSchema.safeParse({ hasNoCredentials: null })
        .success,
    ).toBe(true);
    expect(
      UpdateProfessionalCredentialDeclarationDtoSchema.safeParse({ hasNoCredentials: 'yes' })
        .success,
    ).toBe(false);
  });
});
