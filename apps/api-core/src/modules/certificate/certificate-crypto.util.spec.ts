import { describe, expect, it } from 'vitest';
import {
  buildCanonicalCertificatePayload,
  buildCertificateVerificationUrl,
  signCertificatePayload,
  verifyCertificateSignature,
  type CanonicalCertificatePayload,
} from './certificate-crypto.util.js';

describe('Certificate Crypto Utilities', () => {
  const sampleSecret = 'test-secret-that-is-at-least-32-characters-long!';

  const basePayload: CanonicalCertificatePayload = {
    certificateId: '11111111-1111-4111-8111-111111111111',
    studentId: '22222222-2222-4222-8222-222222222222',
    trackId: '33333333-3333-4333-8333-333333333333',
    highestLevelCleared: 3,
    headlineTier: 'GOLD',
    issuedAt: '2026-09-29T12:00:00.000Z',
  };

  it('6. Canonical payload is deterministic regardless of key order/source formatting', () => {
    const canonical1 = buildCanonicalCertificatePayload(basePayload);
    const canonical2 = buildCanonicalCertificatePayload({
      issuedAt: '2026-09-29T12:00:00.000Z',
      headlineTier: 'GOLD',
      highestLevelCleared: 3,
      trackId: '33333333-3333-4333-8333-333333333333',
      studentId: '22222222-2222-4222-8222-222222222222',
      certificateId: '11111111-1111-4111-8111-111111111111',
    });

    expect(canonical1).toBe(canonical2);
    expect(canonical1).toBe(
      'certificateId=11111111-1111-4111-8111-111111111111&headlineTier=GOLD&highestLevelCleared=3&issuedAt=2026-09-29T12:00:00.000Z&studentId=22222222-2222-4222-8222-222222222222&trackId=33333333-3333-4333-8333-333333333333',
    );
  });

  it('7. Same payload produces the same signature', () => {
    const sig1 = signCertificatePayload(basePayload, sampleSecret);
    const sig2 = signCertificatePayload(basePayload, sampleSecret);

    expect(sig1).toBe(sig2);
    expect(sig1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('8. Changing certificate data invalidates signature', () => {
    const originalSig = signCertificatePayload(basePayload, sampleSecret);

    const tamperedPayload: CanonicalCertificatePayload = {
      ...basePayload,
      headlineTier: 'SILVER',
    };
    const tamperedSig = signCertificatePayload(tamperedPayload, sampleSecret);

    expect(originalSig).not.toBe(tamperedSig);
    expect(verifyCertificateSignature(tamperedPayload, originalSig, sampleSecret)).toBe(false);
  });

  it('9. Timing-safe signature verification rejects tampering and invalid lengths', () => {
    const validSig = signCertificatePayload(basePayload, sampleSecret);

    expect(verifyCertificateSignature(basePayload, validSig, sampleSecret)).toBe(true);
    expect(verifyCertificateSignature(basePayload, 'invalid-signature', sampleSecret)).toBe(false);
    expect(
      verifyCertificateSignature(
        basePayload,
        'a'.repeat(64), // same length, wrong bytes
        sampleSecret,
      ),
    ).toBe(false);
    expect(verifyCertificateSignature(basePayload, '', sampleSecret)).toBe(false);
  });

  it('10. Verification URL contains the signature as query parameter', () => {
    const signature = signCertificatePayload(basePayload, sampleSecret);
    const url = buildCertificateVerificationUrl(
      'https://verify.smart.com',
      basePayload.certificateId,
      signature,
    );

    expect(url).toBe(`https://verify.smart.com/cert/${basePayload.certificateId}?sig=${signature}`);
    expect(url).toContain(`sig=${signature}`);
  });
});
