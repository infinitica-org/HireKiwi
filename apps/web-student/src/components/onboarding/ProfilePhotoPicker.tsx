'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { PhotoCropDialog } from '@/components/profile/PhotoCropDialog';
import { CandidateAvatar } from '@/components/profile/CandidateAvatar';
import {
  PROFILE_PHOTO_ACCEPT,
  validateProfilePhotoFile,
  validateProfilePhotoImage,
} from '@/lib/profile-photo';

interface ProfilePhotoPickerProps {
  fullName: string;
  profilePhotoUrl: string;
  onPhotoChange: (url: string) => void;
  required?: boolean;
}

export function ProfilePhotoPicker({
  fullName,
  profilePhotoUrl,
  onPhotoChange,
  required = true,
}: ProfilePhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Picking a file opens the crop dialog; only the adjusted square is uploaded.
  const handleSelect = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    const validationError = validateProfilePhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setPendingFile(file);
  };

  const uploadCropped = async (file: File) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const faceValidation = await validateProfilePhotoImage(file);
      if (!faceValidation.valid) {
        setError(faceValidation.error ?? 'Please provide a valid profile photo.');
        return;
      }
      const response = await api.users.uploadProfilePhoto(file, file.name);
      onPhotoChange(response.profilePhotoUrl);
    } catch {
      setError('Could not upload your profile photo. Check your connection and try again.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="md:col-span-2">
      <p className="mb-3 text-sm font-medium text-foreground">
        Profile Photo {required ? <span className="text-rose-500">*</span> : null}
      </p>
      <div className="flex items-center gap-4">
        <CandidateAvatar
          fullName={fullName}
          profilePhotoUrl={profilePhotoUrl || null}
          className="h-20 w-20 border-2 border-foreground/30 bg-muted text-lg font-bold text-foreground"
          fallbackClassName="bg-muted text-lg font-bold text-foreground"
        />
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted disabled:opacity-60"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            ) : (
              <Camera className="h-4 w-4 text-foreground" />
            )}
            {profilePhotoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          <p className="text-xs text-muted-foreground">
            JPG, JPEG or PNG only. Maximum size: 2 MB. Your face should be clearly visible.
          </p>
          {error ? <p className="text-xs text-rose-600">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={PROFILE_PHOTO_ACCEPT}
        className="hidden"
        onChange={(event) => handleSelect(event.target.files?.[0])}
      />
      <PhotoCropDialog
        file={pendingFile}
        onCancel={() => setPendingFile(null)}
        onConfirm={(cropped) => void uploadCropped(cropped)}
      />
    </div>
  );
}
