import { createHmac, timingSafeEqual } from 'node:crypto';

export interface CanonicalCertificatePayload {
  certificateId: string;
  studentId: string;
  trackId: string;
  highestLevelCleared: number;
  headlineTier: string;
  issuedAt: string; // ISO 8601 string
}

/**
 * Builds a deterministic canonical string representation of the certificate payload.
 * Strictly avoids unordered JSON serialization by formatting fixed key-value pairs in alphabetical order.
 */
export function buildCanonicalCertificatePayload(payload: CanonicalCertificatePayload): string {
  const normalizedIssuedAt = new Date(payload.issuedAt).toISOString();
  return [
    `certificateId=${payload.certificateId}`,
    `headlineTier=${payload.headlineTier}`,
    `highestLevelCleared=${payload.highestLevelCleared}`,
    `issuedAt=${normalizedIssuedAt}`,
    `studentId=${payload.studentId}`,
    `trackId=${payload.trackId}`,
  ].join('&');
}

/**
 * Computes the HMAC-SHA256 signature of a canonical certificate payload using the master private secret.
 */
export function signCertificatePayload(
  payload: CanonicalCertificatePayload,
  masterSecret: string,
): string {
  const canonical = buildCanonicalCertificatePayload(payload);
  return createHmac('sha256', masterSecret).update(canonical).digest('hex');
}

/**
 * Verifies a certificate signature against the expected canonical payload using timing-safe comparison.
 */
export function verifyCertificateSignature(
  payload: CanonicalCertificatePayload,
  providedSignature: string,
  masterSecret: string,
): boolean {
  if (!providedSignature || typeof providedSignature !== 'string') {
    return false;
  }
  const expectedSignature = signCertificatePayload(payload, masterSecret);
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const providedBuffer = Buffer.from(providedSignature, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

/**
 * Constructs the canonical public verification URL embedding the cryptographic signature.
 */
export function buildCertificateVerificationUrl(
  verifyAppUrl: string,
  certificateId: string,
  signature: string,
): string {
  const base = verifyAppUrl.replace(/\/+$/, '');
  return `${base}/cert/${certificateId}?sig=${encodeURIComponent(signature)}`;
}
