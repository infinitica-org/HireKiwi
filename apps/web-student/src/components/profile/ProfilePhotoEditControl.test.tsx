import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys } from '@hirekiwi/api-client';
import type { AuthenticatedUser } from '@hirekiwi/contracts';
import type * as ProfilePhotoModule from '@/lib/profile-photo';

import { ProfilePhotoEditControl } from './ProfilePhotoEditControl';

const uploadProfilePhoto = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      uploadProfilePhoto: (...args: unknown[]) => uploadProfilePhoto(...args),
    },
  },
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

function meUser(): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
    role: 'STUDENT',
    institutionId: null,
    institutionName: null,
    primaryTrack: null,
    secondaryTrack: null,
    provider: 'PASSWORD',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(0).toISOString(),
    profilePhotoUrl: null,
    cgpa: null,
    sscPercentage: null,
    hscPercentage: null,
    onboardingCompleted: true,
    sessionHold: null,
  };
}

vi.mock('@/components/profile/PhotoCropDialog', () => ({
  // The real dialog crops on a canvas, which jsdom lacks; confirm hands the picked file straight on.
  PhotoCropDialog: ({
    file,
    onConfirm,
  }: {
    file: File | null;
    onConfirm: (cropped: File) => void;
  }) =>
    file ? (
      <button type="button" onClick={() => onConfirm(file)}>
        Confirm crop
      </button>
    ) : null,
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('ProfilePhotoEditControl', () => {
  beforeEach(() => {
    uploadProfilePhoto.mockReset();
  });

  it('updates the avatar immediately after a successful upload', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(queryKeys.me(), meUser());

    uploadProfilePhoto.mockResolvedValue({
      profilePhotoUrl: 'https://cdn.example/new-photo.jpg',
    });

    render(<ProfilePhotoEditControl fullName="Ada Lovelace" profilePhotoUrl={null} />, {
      wrapper: wrapper(client),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'photo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm crop' }));

    const confirmCrop = document.querySelector('[data-testid="mock-confirm-crop"]');
    if (confirmCrop) fireEvent.click(confirmCrop);

    await waitFor(() => {
      expect(uploadProfilePhoto).toHaveBeenCalledWith(file, 'photo.png');
    });

    await waitFor(() => {
      const cached = client.getQueryData<AuthenticatedUser>(queryKeys.me());
      expect(cached?.profilePhotoUrl).toBe('https://cdn.example/new-photo.jpg');
    });
  });
});
