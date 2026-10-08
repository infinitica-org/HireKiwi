import {
  evaluateFaceImageData,
  FACE_LUMA_MIN,
  type FaceCheckResult,
} from './proctoring/face-check';

export const PROFILE_PHOTO_ACCEPT = 'image/jpeg,image/png';
export const PROFILE_PHOTO_MAX_BYTES = 2 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

function mimeTypeForProfilePhoto(file: File): string {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return file.type;
}

/** Bust browser cache when the same signed URL is reused after replace. */
export function profilePhotoDisplayUrl(url: string, cacheKey: number | string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}

export function validateProfilePhotoFile(file: File): string | null {
  const mimeType = mimeTypeForProfilePhoto(file);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return 'Only JPEG and PNG images are supported.';
  }
  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    return 'The profile photo must be 2MB or smaller.';
  }
  return null;
}

export async function loadImageDataFromFile(file: File | Blob): Promise<ImageData | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const canvas = document.createElement('canvas');
        const width = img.naturalWidth || img.width || 320;
        const height = img.naturalHeight || img.height || 320;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        resolve(imageData);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export type ProfilePhotoValidationResult = {
  valid: boolean;
  error: string | null;
  faceCheck?: FaceCheckResult;
};

export async function validateProfilePhotoImage(
  file: File,
  options?: {
    imageLoader?: (file: File) => Promise<ImageData | null>;
  },
): Promise<ProfilePhotoValidationResult> {
  const fileError = validateProfilePhotoFile(file);
  if (fileError) {
    return { valid: false, error: fileError };
  }

  const loader = options?.imageLoader ?? loadImageDataFromFile;
  let imageData: ImageData | null = null;
  try {
    imageData = await loader(file);
  } catch {
    return {
      valid: false,
      error: 'Could not process this image. Please upload a valid JPEG or PNG photo.',
    };
  }

  if (!imageData) {
    return {
      valid: false,
      error: 'Could not read image data. Please ensure the file is a valid image.',
    };
  }

  const faceResult = evaluateFaceImageData(imageData);
  if (faceResult.ok) {
    return { valid: true, error: null, faceCheck: faceResult };
  }

  let message = faceResult.message;
  if (faceResult.faceCount === 0) {
    message =
      "We couldn't detect a clear face in this photo. Please upload a well-lit photo looking directly at the camera.";
  } else if (faceResult.faceCount > 1) {
    message = 'Multiple faces detected. Please upload a photo with only you.';
  } else if (!faceResult.fillOk) {
    message = 'Please upload a photo where your face is centered and clearly visible.';
  } else if (!faceResult.lightingOk && faceResult.brightness < FACE_LUMA_MIN) {
    message = 'Photo is too dark. Please face a light source or lamp.';
  } else if (!faceResult.lightingOk) {
    message =
      'Photo lighting is too harsh or overexposed. Please choose a photo with even lighting.';
  }

  return {
    valid: false,
    error: message,
    faceCheck: faceResult,
  };
}
