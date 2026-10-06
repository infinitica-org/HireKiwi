import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BasicProfileStep from './BasicProfileStep';
import { emptyOnboardingForm } from '@/lib/onboarding-form';
import { confirmPhotoCrop, mockCanvasCrop } from '@/test/photo-crop-dialog';

const uploadProfilePhoto = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { users: { uploadProfilePhoto: (...args: unknown[]) => uploadProfilePhoto(...args) } },
}));

describe('BasicProfileStep', () => {
  const onContinue = vi.fn();
  const updateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders First name, Last name, Major, and Grad Year fields', () => {
    render(
      <BasicProfileStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByText('Basic Profile')).toBeDefined();
    expect(screen.getByTestId('first-name-input')).toBeDefined();
    expect(screen.getByTestId('last-name-input')).toBeDefined();
    expect(screen.getByTestId('major-study-program-input')).toBeDefined();
    expect(screen.getByTestId('graduation-year-select')).toBeDefined();
  });

  it('uploads a profile photo and stores its URL on the form', async () => {
    mockCanvasCrop();
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

    await confirmPhotoCrop();

    await waitFor(() => {
      expect(updateField).toHaveBeenCalledWith('profilePhotoUrl', 'https://cdn.test/photo.png');
    });
    expect(uploadProfilePhoto).toHaveBeenCalledWith(expect.any(File), 'me.jpg');
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
      expect(screen.getByText(/First name and last name are required/i)).toBeDefined();
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('calls onContinue when all fields are valid', async () => {
    const form = {
      ...emptyOnboardingForm(),
      firstName: 'Satheswaran',
      lastName: 'V',
      academicProgram: {
        studyProgram: 'B.Tech Computer Science & Engineering',
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
