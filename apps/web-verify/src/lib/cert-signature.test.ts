import { describe, expect, it } from 'vitest';
import {
  generateCertificateSignature,
  verifyCertificateSignature,
  isValidUuid,
} from './cert-signature.js';

describe('Certificate Signature & UUID Verification', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  it('validates correct UUID format', () => {
    expect(isValidUuid(validUuid)).toBe(true);
    expect(isValidUuid('invalid-uuid')).toBe(false);
    expect(isValidUuid('12345')).toBe(false);
  });

  it('verifies valid HMAC-SHA256 certificate signature hash', () => {
    const validSig = generateCertificateSignature(validUuid);
    expect(verifyCertificateSignature(validUuid, validSig)).toBe(true);
  });

  it('detects single hex character alteration in signature hash (Adversarial Test 1)', () => {
    const validSig = generateCertificateSignature(validUuid);

    // Flip 1 character in the signature hex string
    const firstChar = validSig[0] === 'a' ? 'b' : 'a';
    const tamperedSig = firstChar + validSig.slice(1);

    expect(verifyCertificateSignature(validUuid, tamperedSig)).toBe(false);
  });

  it('rejects malformed or invalid hex signature strings', () => {
    expect(verifyCertificateSignature(validUuid, 'not-a-hex-signature')).toBe(false);
    expect(verifyCertificateSignature(validUuid, '')).toBe(false);
  });
});
