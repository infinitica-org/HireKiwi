import { z } from 'zod';

/**
 * Th6-600 — evidence files attached to education, work experience and projects.
 * One rule set for every claim: PDF or PNG only, at most 10 MB, uploaded through a
 * short-lived presigned URL and confirmed by the server (size + magic bytes + virus scan).
 */
export const EVIDENCE_FILE_MAX_BYTES = 10 * 1024 * 1024;

export const EVIDENCE_FILE_MIME_TYPES = ['application/pdf', 'image/png'] as const;
export const EvidenceFileMimeTypeSchema = z.enum(EVIDENCE_FILE_MIME_TYPES);
export type EvidenceFileMimeType = z.infer<typeof EvidenceFileMimeTypeSchema>;

/** File-input `accept` value for the browser picker. */
export const EVIDENCE_FILE_ACCEPT = '.pdf,.png,application/pdf,image/png';

/** Presigned URLs for evidence uploads and downloads live this long. */
export const EVIDENCE_URL_TTL_SECONDS = 15 * 60;

const EXTENSION_FOR_MIME: Record<EvidenceFileMimeType, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
};

export function evidenceExtensionFor(mimeType: EvidenceFileMimeType): string {
  return EXTENSION_FOR_MIME[mimeType];
}

/** The lower-cased extension of `fileName`, or '' when it has none. */
export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
}

/** True when the file name's extension matches the declared MIME type. */
export function evidenceExtensionMatches(
  fileName: string,
  mimeType: EvidenceFileMimeType,
): boolean {
  return fileExtension(fileName) === EXTENSION_FOR_MIME[mimeType];
}

export const EvidenceFileNameSchema = z
  .string()
  .trim()
  .min(1, 'File name is required')
  .max(200)
  .regex(/\.(pdf|png)$/i, 'Only PDF and PNG files are accepted.');

export const EvidenceFileSizeSchema = z
  .number()
  .int()
  .positive('File size must be positive')
  .max(EVIDENCE_FILE_MAX_BYTES, 'Evidence files must be 10 MB or smaller.');

/** Step 1 — ask the server for a presigned PUT URL. */
export const EvidenceUploadUrlRequestSchema = z
  .object({
    fileName: EvidenceFileNameSchema,
    mimeType: EvidenceFileMimeTypeSchema,
    fileSizeBytes: EvidenceFileSizeSchema,
  })
  .refine((v) => evidenceExtensionMatches(v.fileName, v.mimeType), {
    message: 'The file extension does not match its type.',
    path: ['fileName'],
  });
export type EvidenceUploadUrlRequest = z.infer<typeof EvidenceUploadUrlRequestSchema>;

export const EvidenceUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  objectKey: z.string().min(1),
  expiresInSeconds: z.number().int().positive(),
});
export type EvidenceUploadUrlResponse = z.infer<typeof EvidenceUploadUrlResponseSchema>;

/** Step 2 — after the PUT, confirm the stored object so the server can verify and attach it. */
export const EvidenceFileConfirmSchema = z
  .object({
    objectKey: z.string().min(1).max(512),
    fileName: EvidenceFileNameSchema,
    mimeType: EvidenceFileMimeTypeSchema,
    fileSizeBytes: EvidenceFileSizeSchema,
  })
  .refine((v) => evidenceExtensionMatches(v.fileName, v.mimeType), {
    message: 'The file extension does not match its type.',
    path: ['fileName'],
  });
export type EvidenceFileConfirm = z.infer<typeof EvidenceFileConfirmSchema>;
