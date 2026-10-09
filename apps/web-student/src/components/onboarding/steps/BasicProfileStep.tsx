'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { LightSelect } from '../../ui/LightSelect';
import type { OnboardingProfileForm } from '@/lib/onboarding-form';
import { BRANCH_SPECIALIZATION_OPTIONS, PROGRAM_DEGREE_OPTIONS } from '@/lib/education-form';
import { ProfilePhotoPicker } from '../ProfilePhotoPicker';
import {
  BackButton,
  ErrorBanner,
  FieldLabel,
  PrimaryButton,
  StepHeading,
  TextInput,
} from '../wizard-ui';

interface BasicProfileStepProps {
  formData: OnboardingProfileForm;
  updateField: <K extends keyof OnboardingProfileForm>(
    field: K,
    value: OnboardingProfileForm[K],
  ) => void;
  onBack?: () => void;
  isFirstWizardStep?: boolean;
  onContinue: () => void;
}

const GRADUATION_YEARS = Array.from({ length: 10 }, (_, i) =>
  (new Date().getFullYear() + 4 - i).toString(),
);

const DEGREE_OPTIONS = PROGRAM_DEGREE_OPTIONS.filter(
  (d) => d !== '10th Standard' && d !== '12th Standard',
);

export default function BasicProfileStep({
  formData,
  updateField,
  onBack,
  isFirstWizardStep = false,
  onContinue,
}: BasicProfileStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const firstNameInvalid = attempted && !formData.firstName.trim();
  const lastNameInvalid = attempted && !formData.lastName.trim();
  const _degreeInvalid =
    attempted &&
    !formData.academicProgram.degree?.trim() &&
    !formData.academicProgram.studyProgram.trim();
  const _specializationInvalid =
    attempted &&
    !formData.academicProgram.specialization?.trim() &&
    !formData.academicProgram.studyProgram.trim();

  const handleContinue = () => {
    setAttempted(true);
    setError(null);

    if (!formData.profilePhotoUrl.trim()) {
      setError('Please upload a profile photo.');
      return;
    }

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }

    const hasDegree = Boolean(formData.academicProgram.degree?.trim());
    const hasSpecialization = Boolean(formData.academicProgram.specialization?.trim());
    const hasLegacyStudyProgram = Boolean(formData.academicProgram.studyProgram.trim());

    if (!hasDegree && !hasLegacyStudyProgram) {
      setError('Please select your degree.');
      return;
    }

    if (!hasSpecialization && !hasLegacyStudyProgram) {
      setError('Please select your specialization.');
      return;
    }

    if (hasDegree && !hasSpecialization) {
      setError('Please select your specialization.');
      return;
    }

    if (!formData.academicProgram.graduationYear.trim()) {
      setError('Please select your graduation year.');
      return;
    }

    onContinue();
  };

  const fullName = [formData.firstName, formData.middleName, formData.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return (
    <div data-testid="basic-profile-step">
      <StepHeading
        title="Basic Profile"
        subtitle="Add a photo, then tell us your name, degree, specialization and graduation year."
      />

      <AnimatePresence>{error ? <ErrorBanner>{error}</ErrorBanner> : null}</AnimatePresence>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ProfilePhotoPicker
          fullName={fullName}
          profilePhotoUrl={formData.profilePhotoUrl}
          onPhotoChange={(url) => updateField('profilePhotoUrl', url)}
          required
        />

        <div className="grid grid-cols-1 gap-5 md:col-span-2 md:grid-cols-3">
          <div>
            <FieldLabel required>First Name</FieldLabel>
            <TextInput
              data-testid="first-name-input"
              value={formData.firstName}
              onChange={(e) => updateField('firstName', e.target.value)}
              autoComplete="given-name"
              invalid={firstNameInvalid}
              maxLength={50}
              placeholder="First name (e.g. Satheswaran)"
            />
          </div>

          <div>
            <FieldLabel>Middle Name</FieldLabel>
            <TextInput
              data-testid="middle-name-input"
              value={formData.middleName || ''}
              onChange={(e) => updateField('middleName', e.target.value)}
              autoComplete="additional-name"
              maxLength={50}
              placeholder="Middle name (optional)"
            />
          </div>

          <div>
            <FieldLabel required>Last Name</FieldLabel>
            <TextInput
              data-testid="last-name-input"
              value={formData.lastName}
              onChange={(e) => updateField('lastName', e.target.value)}
              autoComplete="family-name"
              invalid={lastNameInvalid}
              maxLength={50}
              placeholder="Last name (e.g. V)"
            />
          </div>
        </div>

        <div data-testid="degree-select">
          <FieldLabel required>Degree</FieldLabel>
          <LightSelect
            data-testid="degree-select"
            value={formData.academicProgram.degree || ''}
            onChange={(val) => {
              const currentSpecialization = formData.academicProgram.specialization || '';
              const studyProgram =
                val && currentSpecialization
                  ? `${val} - ${currentSpecialization}`
                  : val || currentSpecialization;
              updateField('academicProgram', {
                ...formData.academicProgram,
                degree: val,
                studyProgram,
              });
            }}
            placeholder="Select degree"
            options={DEGREE_OPTIONS.map((d) => ({ label: d, value: d }))}
          />
        </div>

        <div data-testid="specialization-select">
          <FieldLabel required>Specialization</FieldLabel>
          <LightSelect
            data-testid="specialization-select"
            value={formData.academicProgram.specialization || ''}
            onChange={(val) => {
              const currentDegree = formData.academicProgram.degree || '';
              const studyProgram =
                currentDegree && val ? `${currentDegree} - ${val}` : currentDegree || val;
              updateField('academicProgram', {
                ...formData.academicProgram,
                specialization: val,
                studyProgram,
              });
            }}
            placeholder="Select specialization"
            options={BRANCH_SPECIALIZATION_OPTIONS.map((s) => ({ label: s, value: s }))}
          />
        </div>

        <div className="md:col-span-2" data-testid="graduation-year-select">
          <FieldLabel required>Graduation Year</FieldLabel>
          <LightSelect
            data-testid="graduation-year-select"
            value={formData.academicProgram.graduationYear}
            onChange={(val) =>
              updateField('academicProgram', {
                ...formData.academicProgram,
                graduationYear: val,
              })
            }
            placeholder="Select graduation year"
            options={GRADUATION_YEARS.map((y) => ({ label: y, value: y }))}
          />
        </div>
      </div>

      <div className={`mt-10 flex ${!isFirstWizardStep ? 'justify-between' : 'justify-end'}`}>
        {!isFirstWizardStep ? <BackButton onClick={onBack} /> : null}
        <PrimaryButton data-testid="profile-continue-btn" onClick={handleContinue}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
