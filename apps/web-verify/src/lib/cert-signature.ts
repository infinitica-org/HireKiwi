import { createHmac } from 'node:crypto';

const SECRET_KEY = process.env.CERT_SIGNATURE_SECRET ?? 'hirekiwi-certificate-signing-key-v1';

/**
 * Computes the canonical HMAC-SHA256 signature hash for a certificate UUID.
 */
export function generateCertificateSignature(certificateId: string): string {
  return createHmac('sha256', SECRET_KEY).update(certificateId).digest('hex');
}

/**
 * Validates a certificate signature hash against the expected HMAC-SHA256.
 * Returns false if the signature hash is corrupted, altered, or malformed.
 */
export function verifyCertificateSignature(certificateId: string, signatureHash: string): boolean {
  if (!signatureHash || typeof signatureHash !== 'string') {
    return false;
  }

  // Hex format check (64 hex chars for SHA-256)
  if (!/^[0-9a-fA-F]{64}$/.test(signatureHash)) {
    return false;
  }

  const expected = generateCertificateSignature(certificateId);
  return expected.toLowerCase() === signatureHash.toLowerCase();
}

/**
 * Validates whether a string is a valid UUID v4 / standard UUID format.
 */
export function isValidUuid(id: string): boolean {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
}
