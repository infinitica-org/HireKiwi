'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { queryKeys } from '@hirekiwi/api-client';
import type { AuthenticatedUser } from '@hirekiwi/contracts';
import { useQueryClient } from '@hirekiwi/ui';

import { api } from '@/lib/api';
import { CandidateAvatar } from '@/components/profile/overview/CandidateAvatar';
import { PhotoCropDialog } from '@/components/profile/overview/PhotoCropDialog';
import {
  PROFILE_PHOTO_ACCEPT,
  profilePhotoDisplayUrl,
  validateProfilePhotoFile,
  validateProfilePhotoImage,
} from '@/lib/profile-photo';

export interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AuthenticatedUser | null;
  imageLoader?: (file: File) => Promise<ImageData | null>;
}

export function EditProfileDialog({ isOpen, onClose, user, imageLoader }: EditProfileDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [description, setDescription] = useState(user?.profileHeadline ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.profilePhotoUrl ?? null);
  const [pendingCropFile, setPendingCropFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDescription(user?.profileHeadline ?? '');
      setPhotoUrl(user?.profilePhotoUrl ?? null);
      setPhotoError(null);
      setDescriptionError(null);
      setGlobalError(null);
      setPendingCropFile(null);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePhotoSelect = (file: File | undefined) => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file) return;
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    setPhotoError(null);
    setPendingCropFile(file);
  };

  const handleCroppedPhoto = async (cropped: File) => {
    setPendingCropFile(null);
    setUploadingPhoto(true);
    setPhotoError(null);
    try {
      const faceResult = await validateProfilePhotoImage(cropped, { imageLoader });
      if (!faceResult.valid) {
        setPhotoError(faceResult.error ?? 'Please provide a clear face photo.');
        return;
      }

      const response = await api.users.uploadProfilePhoto(cropped, cropped.name);
      const cacheBusted = profilePhotoDisplayUrl(response.profilePhotoUrl, Date.now());
      setPhotoUrl(cacheBusted);
      queryClient.setQueryData<AuthenticatedUser | undefined>(queryKeys.me(), (prev) =>
        prev ? { ...prev, profilePhotoUrl: response.profilePhotoUrl } : prev,
      );
    } catch {
      setPhotoError('Could not upload your profile photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const trimmedDescription = description.trim();
  const charCount = description.length;
  const isDescriptionTooLong = charCount > 300;
  const isDescriptionTooShort = trimmedDescription.length > 0 && trimmedDescription.length < 3;
  const hasPhoto = Boolean(photoUrl);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setDescription(val);
    if (val.length > 300) {
      setDescriptionError('Profile description must be at most 300 characters.');
    } else if (val.trim().length > 0 && val.trim().length < 3) {
      setDescriptionError('Profile description must be at least 3 characters.');
    } else {
      setDescriptionError(null);
    }
  };

  const handleSave = async () => {
    if (isDescriptionTooLong) {
      setDescriptionError('Profile description must be at most 300 characters.');
      return;
    }
    if (isDescriptionTooShort) {
      setDescriptionError('Profile description must be at least 3 characters.');
      return;
    }

    setSaving(true);
    setGlobalError(null);
    try {
      const updatedUser = await api.users.updateProfile({
        profileHeadline: trimmedDescription.length > 0 ? trimmedDescription : undefined,
      });

      queryClient.setQueryData<AuthenticatedUser | undefined>(queryKeys.me(), updatedUser);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      onClose();
    } catch {
      setGlobalError('Could not save your profile changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isSaveDisabled = saving || uploadingPhoto || isDescriptionTooLong || isDescriptionTooShort;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/45 p-4 font-sans"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit Profile"
          data-testid="edit-profile-dialog"
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[min(92vh,720px)] w-full max-w-[560px] flex-col overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-[0_18px_48px_rgba(15,23,42,0.12)]"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[var(--ds-border)] px-6 py-4">
            <div>
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--ds-text)]">
                Edit Profile
              </h2>
              <p className="mt-0.5 text-sm text-[var(--ds-text-muted)]">
                Update your profile picture and introduction headline.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-md p-1.5 text-[var(--ds-text-muted)] transition hover:bg-[var(--ds-surface-hover)] hover:text-[var(--ds-text)]"
            >
              <X className="size-5" />
            </button>
          </div>

          {globalError ? (
            <div className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {globalError}
            </div>
          ) : null}

          {/* Body */}
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {/* Section 1: Profile Photo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[13px] font-medium text-[var(--ds-text)]">
                  Profile photo <span className="text-red-500">*</span>
                </label>
                {!hasPhoto ? (
                  <span className="text-xs font-medium text-red-600">Required</span>
                ) : null}
              </div>

              <div className="flex items-center gap-4">
                <CandidateAvatar
                  fullName={user?.fullName}
                  profilePhotoUrl={photoUrl}
                  className="h-20 w-20 shrink-0 rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] text-2xl font-bold text-[var(--ds-text)]"
                  fallbackClassName="rounded-full bg-zinc-900 text-2xl font-bold text-white dark:bg-white dark:text-zinc-900"
                />

                <div className="space-y-2 flex-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto || saving}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ds-border)] px-5 py-2 text-sm font-medium text-[var(--ds-text-secondary)] transition hover:bg-[var(--ds-surface-hover)] disabled:opacity-60"
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="size-4 animate-spin text-zinc-600 dark:text-zinc-300" />
                    ) : (
                      <Camera className="size-4 text-zinc-600 dark:text-zinc-300" />
                    )}
                    {hasPhoto ? 'Change photo' : 'Upload photo'}
                  </button>

                  <p
                    data-testid="photo-helper-text"
                    className="text-xs leading-relaxed text-[var(--ds-text-muted)]"
                  >
                    Upload a clear profile photo. JPG, JPEG or PNG only. Maximum size: 2 MB. Your
                    face should be clearly visible.
                  </p>

                  {photoError ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {photoError}
                    </p>
                  ) : null}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={PROFILE_PHOTO_ACCEPT}
                className="hidden"
                onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
              />
            </div>

            {/* Section 2: Profile Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="profile-description"
                  className="text-[13px] font-medium text-[var(--ds-text)]"
                >
                  Profile description
                </label>
                <span
                  data-testid="char-counter"
                  className={`text-xs ${
                    isDescriptionTooLong
                      ? 'font-medium text-rose-600 dark:text-rose-400'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  {charCount} / 300
                </span>
              </div>

              <textarea
                id="profile-description"
                data-testid="profile-description-input"
                rows={4}
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Write a short summary about yourself, your background, or what you're looking for..."
                className="w-full resize-none rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] p-3.5 text-sm text-[var(--ds-text)] shadow-sm placeholder:text-[var(--ds-text-subtle)] focus:border-[var(--ds-green)] focus:outline-none focus:ring-2 focus:ring-[var(--ds-green-soft)]"
              />

              {descriptionError ? (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {descriptionError}
                </p>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--ds-border)] px-6 py-4">
            <button
              type="button"
              data-testid="cancel-profile-btn"
              onClick={onClose}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ds-border)] px-5 py-2 text-sm font-medium text-[var(--ds-text-secondary)] transition hover:bg-[var(--ds-surface-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              data-testid="save-profile-btn"
              onClick={() => void handleSave()}
              disabled={isSaveDisabled}
              className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-md bg-[var(--ds-green)] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[var(--ds-green-hover)] disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <PhotoCropDialog
        file={pendingCropFile}
        onCancel={() => setPendingCropFile(null)}
        onConfirm={(cropped) => void handleCroppedPhoto(cropped)}
      />
    </>
  );
}
