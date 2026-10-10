import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryKeys } from '@hirekiwi/api-client';
import type { AuthenticatedUser } from '@hirekiwi/contracts';

import { EditProfileDialog } from './EditProfileDialog';

const uploadProfilePhoto = vi.fn();
const updateProfile = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    users: {
      uploadProfilePhoto: (...args: unknown[]) => uploadProfilePhoto(...args),
      updateProfile: (...args: unknown[]) => updateProfile(...args),
    },
  },
}));

vi.mock('@/components/profile/overview/PhotoCropDialog', () => ({
  PhotoCropDialog: ({
    file,
    onConfirm,
    onCancel,
  }: {
    file: File | null;
    onConfirm: (file: File) => void;
    onCancel: () => void;
  }) => {
    if (!file) return null;
    return (
      <div data-testid="mock-photo-crop-dialog">
        <button type="button" data-testid="mock-confirm-crop" onClick={() => onConfirm(file)}>
          Confirm Crop
        </button>
        <button type="button" data-testid="mock-cancel-crop" onClick={onCancel}>
          Cancel Crop
        </button>
      </div>
    );
  },
}));

function mockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: 'user-123',
    email: 'ada@example.com',
    fullName: 'Ada Lovelace',
    role: 'STUDENT',
    institutionId: null,
    institutionName: null,
    primaryTrack: null,
    secondaryTrack: null,
    provider: 'PASSWORD',
    emailVerified: true,
    createdAt: new Date(0).toISOString(),
    profilePhotoUrl: 'https://cdn.example/photo.jpg',
    profileHeadline: 'Aspiring AI engineer',
    cgpa: null,
    sscPercentage: null,
    hscPercentage: null,
    onboardingCompleted: true,
    sessionHold: null,
    ...overrides,
  };
}

function makeImage(width: number, height: number): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

function fillRect(
  image: ImageData,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const i = (y * image.width + x) * 4;
      image.data[i] = r;
      image.data[i + 1] = g;
      image.data[i + 2] = b;
      image.data[i + 3] = 255;
    }
  }
}

function validFaceImage(): ImageData {
  const image = makeImage(80, 60);
  fillRect(image, 28, 12, 24, 32, 210, 160, 130);
  return image;
}

function noFaceImage(): ImageData {
  return makeImage(80, 60);
}

function multiFaceImage(): ImageData {
  const image = makeImage(80, 60);
  fillRect(image, 10, 12, 16, 24, 210, 160, 130);
  fillRect(image, 50, 12, 16, 24, 210, 160, 130);
  return image;
}

function offCenterFaceImage(): ImageData {
  const image = makeImage(80, 60);
  fillRect(image, 0, 8, 14, 40, 210, 160, 130);
  return image;
}

function renderDialog(props: {
  isOpen?: boolean;
  onClose?: () => void;
  user?: AuthenticatedUser | null;
  imageLoader?: (file: File) => Promise<ImageData | null>;
  queryClient?: QueryClient;
}) {
  const client =
    props.queryClient ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (props.user) {
    client.setQueryData(queryKeys.me(), props.user);
  }

  const onClose = props.onClose ?? vi.fn();

  const utils = render(
    <QueryClientProvider client={client}>
      <EditProfileDialog
        isOpen={props.isOpen ?? true}
        onClose={onClose}
        user={props.user}
        imageLoader={props.imageLoader}
      />
    </QueryClientProvider>,
  );

  return { ...utils, onClose, client };
}

describe('EditProfileDialog', () => {
  beforeEach(() => {
    uploadProfilePhoto.mockReset();
    updateProfile.mockReset();
  });

  it('renders nothing when isOpen is false', () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId('edit-profile-dialog')).toBeNull();
  });

  it('renders dialog with title, helper text, and pre-filled description', () => {
    const user = mockUser({ profileHeadline: 'Machine Learning Enthusiast' });
    renderDialog({ user });

    expect(screen.getByTestId('edit-profile-dialog')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Edit Profile/i })).toBeTruthy();
    expect(
      screen.getByText(
        'Upload a clear profile photo. JPG, JPEG or PNG only. Maximum size: 2 MB. Your face should be clearly visible.',
      ),
    ).toBeTruthy();

    const textarea = screen.getByTestId('profile-description-input') as HTMLTextAreaElement;
    expect(textarea.value).toBe('Machine Learning Enthusiast');
    expect(screen.getByTestId('char-counter').textContent).toBe(
      `${'Machine Learning Enthusiast'.length} / 300`,
    );
  });

  it('updates character count and validates maximum characters', () => {
    renderDialog({ user: mockUser() });

    const textarea = screen.getByTestId('profile-description-input') as HTMLTextAreaElement;
    const longText = 'A'.repeat(305);
    fireEvent.change(textarea, { target: { value: longText } });

    expect(screen.getByTestId('char-counter').textContent).toBe('305 / 300');
    expect(screen.getByText('Profile description must be at most 300 characters.')).toBeTruthy();

    const saveBtn = screen.getByTestId('save-profile-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('validates minimum 3 characters when description is non-empty', () => {
    renderDialog({ user: mockUser() });

    const textarea = screen.getByTestId('profile-description-input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'hi' } });

    expect(screen.getByText('Profile description must be at least 3 characters.')).toBeTruthy();

    const saveBtn = screen.getByTestId('save-profile-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });

  it('displays photo requirement badge but allows saving description when photo is missing', async () => {
    updateProfile.mockResolvedValue(
      mockUser({ profilePhotoUrl: null, profileHeadline: 'Updated without photo' }),
    );

    const { onClose } = renderDialog({
      user: mockUser({ profilePhotoUrl: null, profileHeadline: 'Old headline' }),
    });

    expect(screen.getByText('Required')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Upload photo/i })).toBeTruthy();

    const textarea = screen.getByTestId('profile-description-input');
    fireEvent.change(textarea, { target: { value: 'Updated without photo' } });

    const saveBtn = screen.getByTestId('save-profile-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        profileHeadline: 'Updated without photo',
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not force re-upload when user already has a valid photo', () => {
    renderDialog({
      user: mockUser({ profilePhotoUrl: 'https://cdn.example/existing.jpg' }),
    });

    expect(screen.queryByText('Required')).toBeNull();
    expect(screen.getByRole('button', { name: /Change photo/i })).toBeTruthy();

    const saveBtn = screen.getByTestId('save-profile-btn') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);
  });

  it('rejects WebP format with clear error', () => {
    renderDialog({ user: mockUser() });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const webpFile = new File(['fake-webp'], 'photo.webp', { type: 'image/webp' });
    fireEvent.change(input, { target: { files: [webpFile] } });

    expect(screen.getByText(/Only JPEG and PNG images are supported/i)).toBeTruthy();
    expect(screen.queryByTestId('mock-photo-crop-dialog')).toBeNull();
  });

  it('rejects files larger than 2MB', () => {
    renderDialog({ user: mockUser() });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File(['fake'], 'photo.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 2 * 1024 * 1024 + 10 });
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(screen.getByText(/must be 2MB or smaller/i)).toBeTruthy();
    expect(screen.queryByTestId('mock-photo-crop-dialog')).toBeNull();
  });

  it('blocks upload when face check detects 0 faces', async () => {
    renderDialog({
      user: mockUser({ profilePhotoUrl: null }),
      imageLoader: async () => noFaceImage(),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'noface.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByTestId('mock-photo-crop-dialog')).toBeTruthy();
    fireEvent.click(screen.getByTestId('mock-confirm-crop'));

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't detect a clear face in this photo. Please upload a well-lit photo looking directly at the camera.",
        ),
      ).toBeTruthy();
    });

    expect(uploadProfilePhoto).not.toHaveBeenCalled();
  });

  it('blocks upload when face check detects multiple faces', async () => {
    renderDialog({
      user: mockUser({ profilePhotoUrl: null }),
      imageLoader: async () => multiFaceImage(),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'group.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByTestId('mock-confirm-crop'));

    await waitFor(() => {
      expect(
        screen.getByText('Multiple faces detected. Please upload a photo with only you.'),
      ).toBeTruthy();
    });

    expect(uploadProfilePhoto).not.toHaveBeenCalled();
  });

  it('blocks upload when face is off-center or clipped', async () => {
    renderDialog({
      user: mockUser({ profilePhotoUrl: null }),
      imageLoader: async () => offCenterFaceImage(),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'offcenter.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByTestId('mock-confirm-crop'));

    await waitFor(() => {
      expect(
        screen.getByText('Please upload a photo where your face is centered and clearly visible.'),
      ).toBeTruthy();
    });

    expect(uploadProfilePhoto).not.toHaveBeenCalled();
  });

  it('successfully uploads photo when face check passes and enables saving', async () => {
    uploadProfilePhoto.mockResolvedValue({
      profilePhotoUrl: 'https://cdn.example/uploaded-photo.jpg',
    });

    const { client } = renderDialog({
      user: mockUser({ profilePhotoUrl: null }),
      imageLoader: async () => validFaceImage(),
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['bytes'], 'valid-photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByTestId('mock-confirm-crop'));

    await waitFor(() => {
      expect(uploadProfilePhoto).toHaveBeenCalledWith(file, 'valid-photo.jpg');
    });

    await waitFor(() => {
      const saveBtn = screen.getByTestId('save-profile-btn') as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(false);
    });

    const cached = client.getQueryData<AuthenticatedUser>(queryKeys.me());
    expect(cached?.profilePhotoUrl).toBe('https://cdn.example/uploaded-photo.jpg');
  });

  it('saves changes, updates query cache with server response, and closes dialog on save', async () => {
    const returnedServerUser = mockUser({
      userId: 'user-123',
      profileHeadline: 'Server authoritative headline',
      profilePhotoUrl: 'https://cdn.example/photo.jpg',
    });
    updateProfile.mockResolvedValue(returnedServerUser);

    const { onClose, client } = renderDialog({
      user: mockUser({
        profilePhotoUrl: 'https://cdn.example/photo.jpg',
        profileHeadline: 'Old headline',
      }),
    });

    const textarea = screen.getByTestId('profile-description-input');
    fireEvent.change(textarea, { target: { value: 'New updated headline' } });

    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('save-profile-btn'));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        profileHeadline: 'New updated headline',
      });
    });

    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    const cached = client.getQueryData<AuthenticatedUser>(queryKeys.me());
    expect(cached).toEqual(returnedServerUser);
    expect(cached?.profileHeadline).toBe('Server authoritative headline');
  });

  it('calls onClose when Cancel button is clicked', () => {
    const { onClose } = renderDialog({ user: mockUser() });

    fireEvent.click(screen.getByTestId('cancel-profile-btn'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when X button is clicked', () => {
    const { onClose } = renderDialog({ user: mockUser() });

    fireEvent.click(screen.getByRole('button', { name: /Close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose on Escape key', () => {
    const { onClose } = renderDialog({ user: mockUser() });

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('displays error when updateProfile API fails, keeps dialog open, and does not call onClose', async () => {
    updateProfile.mockRejectedValue(new Error('Network error'));

    const { onClose } = renderDialog({ user: mockUser() });

    fireEvent.click(screen.getByTestId('save-profile-btn'));

    await waitFor(() => {
      expect(
        screen.getByText('Could not save your profile changes. Please try again.'),
      ).toBeTruthy();
    });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId('edit-profile-dialog')).toBeTruthy();
  });
});
