import { randomUUID } from 'node:crypto';
import { NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import {
  EVIDENCE_FILE_MAX_BYTES,
  EVIDENCE_URL_TTL_SECONDS,
  EvidenceUploadUrlRequestSchema,
  fileExtension,
  type EvidenceFileMimeType,
  type EvidenceUploadUrlResponse,
} from '@smart/contracts';
import { assertFileClean } from './file-scanner.js';
import type { StorageService } from './storage.service.js';

/**
 * Th6-600 — server-side checks for evidence files (education, experience, project proofs).
 * The browser uploads straight to storage with a presigned PUT; the server then reads the
 * stored object back and only attaches it when the real bytes, the extension and the declared
 * MIME type all agree. Anything else is rejected with 422 and the object is deleted.
 */

const PDF_MAGIC = Buffer.from('%PDF-', 'ascii');
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The evidence type the file's leading bytes prove, or null when they match neither. */
export function detectEvidenceMimeType(bytes: Buffer): EvidenceFileMimeType | null {
  if (bytes.length >= PDF_MAGIC.length && bytes.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return 'application/pdf';
  }
  if (bytes.length >= PNG_MAGIC.length && bytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
    return 'image/png';
  }
  return null;
}

const EXTENSION_FOR: Record<EvidenceFileMimeType, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
};

function reject(message: string): never {
  throw new UnprocessableEntityException({
    error: 'evidence_file_rejected',
    message,
    statusCode: 422,
  });
}

/**
 * Throws 422 unless `buffer` is a PDF or PNG no larger than 10 MB whose magic bytes, file
 * extension and declared MIME type all name the same format. Then runs the ClamAV scan.
 */
export async function assertEvidenceFile(file: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}): Promise<EvidenceFileMimeType> {
  if (file.buffer.byteLength === 0) reject('The uploaded file is empty.');
  if (file.buffer.byteLength > EVIDENCE_FILE_MAX_BYTES) {
    reject('Evidence files must be 10 MB or smaller.');
  }
  const detected = detectEvidenceMimeType(file.buffer);
  if (!detected) reject('Only PDF and PNG files are accepted.');
  if (file.mimeType !== detected) {
    reject('The file type does not match its contents.');
  }
  if (fileExtension(file.fileName) !== EXTENSION_FOR[detected]) {
    reject('The file extension does not match its contents.');
  }
  await assertFileClean(file.buffer, file.fileName);
  return detected;
}

function safeName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9_.-]/g, '_').slice(-120);
}

/** Issues a presigned PUT for one evidence file under `namespace` (e.g. `education-proofs/<user>/<id>`). */
export async function createEvidenceUploadUrl(
  storage: StorageService,
  namespace: string,
  body: unknown,
): Promise<EvidenceUploadUrlResponse> {
  const request = EvidenceUploadUrlRequestSchema.parse(body);
  const objectKey = `${namespace}/${randomUUID()}-${safeName(request.fileName)}`;
  const uploadUrl = await storage.getSignedUploadUrl({
    objectKey,
    contentType: request.mimeType,
  });
  return { uploadUrl, objectKey, expiresInSeconds: EVIDENCE_URL_TTL_SECONDS };
}

/**
 * Reads back an uploaded evidence object and verifies it. Rejects (and deletes the object) when
 * the key is outside `namespace`, the size differs from what the client declared, or the bytes
 * fail {@link assertEvidenceFile}.
 */
export async function verifyUploadedEvidence(
  storage: StorageService,
  namespace: string,
  file: { objectKey: string; fileName: string; mimeType: string; fileSizeBytes: number },
): Promise<void> {
  if (!file.objectKey.startsWith(`${namespace}/`)) {
    throw new NotFoundException({
      error: 'not_found',
      message: 'Uploaded file not found.',
      statusCode: 404,
    });
  }
  let buffer: Buffer;
  try {
    buffer = await storage.getObjectBuffer(file.objectKey);
  } catch {
    throw new NotFoundException({
      error: 'not_found',
      message: 'Uploaded file not found. Upload it again.',
      statusCode: 404,
    });
  }
  try {
    if (buffer.byteLength !== file.fileSizeBytes) {
      reject('The uploaded file size does not match.');
    }
    await assertEvidenceFile({ buffer, fileName: file.fileName, mimeType: file.mimeType });
  } catch (error) {
    await storage.deleteObject(file.objectKey).catch(() => undefined);
    throw error;
  }
}

/** True for values that are storage object keys (not legacy data URIs or placeholder paths). */
export function isEvidenceObjectKey(value: string, namespaces: readonly string[]): boolean {
  return namespaces.some((ns) => value.startsWith(`${ns}/`));
}
