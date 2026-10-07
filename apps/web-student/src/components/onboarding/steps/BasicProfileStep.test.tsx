import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BasicProfileStep from './BasicProfileStep';
import { emptyOnboardingForm } from '@/lib/onboarding-form';

import type * as ProfilePhotoModule from '@/lib/profile-photo';

const uploadProfilePhoto = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { users: { uploadProfilePhoto: (...args: unknown[]) => uploadProfilePhoto(...args) } },
}));

vi.mock('@/components/profile/PhotoCropDialog', () => ({
  PhotoCropDialog: ({
    file,
    onConfirm,
  }: {
    file: File | null;
    onConfirm: (file: File) => void;
  }) => {
    if (!file) return null;
    return (
      <button type="button" data-testid="mock-confirm-crop" onClick={() => onConfirm(file)}>
        Confirm Crop
      </button>
    );
  },
}));

vi.mock('@/lib/profile-photo', async (importOriginal) => {
  const actual = await importOriginal<typeof ProfilePhotoModule>();
  return {
    ...actual,
    validateProfilePhotoImage: vi.fn().mockResolvedValue({ valid: true, error: null }),
  };
});

describe('BasicProfileStep', () => {
  const onContinue = vi.fn();
  const updateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders First name, Middle name, Last name, Degree, Specialization, and Grad Year fields', () => {
    render(
      <BasicProfileStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByText('Basic Profile')).toBeDefined();
    expect(screen.getByTestId('first-name-input')).toBeDefined();
    expect(screen.getByTestId('middle-name-input')).toBeDefined();
    expect(screen.getByTestId('last-name-input')).toBeDefined();
    expect(screen.getByTestId('degree-select')).toBeDefined();
    expect(screen.getByTestId('specialization-select')).toBeDefined();
    expect(screen.getByTestId('graduation-year-select')).toBeDefined();
  });

  it('uploads a profile photo and stores its URL on the form', async () => {
    uploadProfilePhoto.mockResolvedValue({ profilePhotoUrl: 'https://cdn.test/photo.png' });
    const { container } = render(
      <BasicProfileStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByRole('button', { name: /upload photo/i })).toBeDefined();
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'me.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    const confirmCropBtn = await screen.findByTestId('mock-confirm-crop');
    fireEvent.click(confirmCropBtn);

    await waitFor(() => {
      expect(updateField).toHaveBeenCalledWith('profilePhotoUrl', 'https://cdn.test/photo.png');
    });
    expect(uploadProfilePhoto).toHaveBeenCalledWith(file, 'me.png');
  });

  it('validates required fields before allowing continue', async () => {
    render(
      <BasicProfileStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    fireEvent.click(screen.getByTestId('profile-continue-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Please upload a profile photo/i)).toBeDefined();
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('calls onContinue when all fields are valid', async () => {
    const form = {
      ...emptyOnboardingForm(),
      profilePhotoUrl: 'https://cdn.test/photo.png',
      firstName: 'Satheswaran',
      middleName: '',
      lastName: 'V',
      academicProgram: {
        studyProgram: 'B.Tech - Computer Science',
        degree: 'B.Tech',
        specialization: 'Computer Science',
        graduationYear: '2026',
      },
    };

    render(<BasicProfileStep formData={form} updateField={updateField} onContinue={onContinue} />);

    fireEvent.click(screen.getByTestId('profile-continue-btn'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });
});
