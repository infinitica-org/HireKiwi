import {
  EVIDENCE_FILE_MAX_BYTES,
  fileExtension,
  type EvidenceFileMimeType,
  type EvidenceUploadUrlRequest,
  type EvidenceUploadUrlResponse,
} from '@smart/contracts';

/** Th6-600 — what the attach endpoints need once the browser has uploaded the file. */
export interface UploadedEvidenceFile {
  objectKey: string;
  fileName: string;
  mimeType: EvidenceFileMimeType;
  fileSizeBytes: number;
}

export class EvidenceFileError extends Error {
  override readonly name = 'EvidenceFileError';
}

/** PDF/PNG type for `file`, from its extension (browsers often leave `file.type` empty). */
export function evidenceMimeTypeFor(fileName: string): EvidenceFileMimeType | null {
  const ext = fileExtension(fileName);
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  return null;
}

/** Client-side check mirroring the server: PDF or PNG, 10 MB max. Returns an error message or null. */
export function validateEvidenceFile(file: { name: string; size: number }): string | null {
  if (!evidenceMimeTypeFor(file.name)) return 'Only PDF and PNG files are accepted.';
  if (file.size <= 0) return 'The file is empty.';
  if (file.size > EVIDENCE_FILE_MAX_BYTES) return 'Evidence files must be 10 MB or smaller.';
  return null;
}

/**
 * Presigned upload: asks the API for a 15-minute PUT URL, uploads the file straight to storage,
 * and returns the object key. The caller then attaches it, which is where the server verifies
 * the real bytes (magic number, extension, type, size, virus scan).
 */
export async function uploadEvidenceFile(
  file: File,
  requestUploadUrl: (body: EvidenceUploadUrlRequest) => Promise<EvidenceUploadUrlResponse>,
  fetchImpl: typeof fetch = fetch,
): Promise<UploadedEvidenceFile> {
  const problem = validateEvidenceFile(file);
  const mimeType = evidenceMimeTypeFor(file.name);
  if (problem || !mimeType) throw new EvidenceFileError(problem ?? 'Unsupported file.');

  const { uploadUrl, objectKey } = await requestUploadUrl({
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
  });
  const response = await fetchImpl(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': mimeType },
    body: file,
  });
  if (!response.ok) {
    throw new EvidenceFileError('The file could not be uploaded. Please try again.');
  }
  return { objectKey, fileName: file.name, mimeType, fileSizeBytes: file.size };
}
