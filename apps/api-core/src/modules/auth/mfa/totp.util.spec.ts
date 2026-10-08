import { describe, expect, it } from 'vitest';
import { buildTotpUri, generateTotp, generateTotpSecret, verifyTotp } from './totp.util.js';

/**
 * RFC 4226 Appendix D test vectors (HOTP-SHA1, 6 digits) adapted to TOTP by
 * treating each HOTP counter as a 30s step, per RFC 6238 §4 Appendix B's own
 * "T0 = 0, time step = 30" convention. Secret is the ASCII string
 * "12345678901234567890", base32-encoded.
 */
const RFC_SECRET_BASE32 = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const RFC_VECTORS: Array<[counter: number, code: string]> = [
  [0, '755224'],
  [1, '287082'],
  [2, '359152'],
  [3, '969429'],
  [4, '338314'],
  [5, '254676'],
  [6, '287922'],
  [7, '162583'],
  [8, '399871'],
  [9, '520489'],
];

describe('generateTotp / verifyTotp', () => {
  it.each(RFC_VECTORS)('matches the RFC 4226 HOTP vector at step %i', (counter, expected) => {
    const atMs = counter * 30_000; // step N = seconds [N*30, N*30+30)
    expect(generateTotp(RFC_SECRET_BASE32, atMs)).toBe(expected);
  });

  it('verifies a code generated for "now"', () => {
    const secret = generateTotpSecret();
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });

  it('accepts a code from one step in the past (clock drift tolerance)', () => {
    const secret = generateTotpSecret();
    const past = Date.now() - 30_000;
    const code = generateTotp(secret, past);
    expect(verifyTotp(secret, code, { atMs: Date.now() })).toBe(true);
  });

  it('rejects a code two steps away', () => {
    const secret = generateTotpSecret();
    const past = Date.now() - 90_000;
    const code = generateTotp(secret, past);
    expect(verifyTotp(secret, code, { atMs: Date.now() })).toBe(false);
  });

  it('rejects a code for a different secret', () => {
    const secretA = generateTotpSecret();
    const secretB = generateTotpSecret();
    const code = generateTotp(secretA);
    expect(verifyTotp(secretB, code)).toBe(false);
  });

  it('rejects malformed input instead of throwing', () => {
    const secret = generateTotpSecret();
    expect(verifyTotp(secret, '')).toBe(false);
    expect(verifyTotp(secret, 'abcdef')).toBe(false);
    expect(verifyTotp(secret, '12345')).toBe(false);
  });

  it('round-trips through base32 for a freshly generated secret', () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    const code = generateTotp(secret);
    expect(verifyTotp(secret, code)).toBe(true);
  });
});

describe('buildTotpUri', () => {
  it('encodes issuer, label and the standard TOTP params', () => {
    const uri = buildTotpUri('ABCDEFGH', 'student@example.com', 'HireKiwi');
    expect(uri).toMatch(/^otpauth:\/\/totp\/HireKiwi%3Astudent%40example\.com\?/);
    expect(uri).toContain('secret=ABCDEFGH');
    expect(uri).toContain('issuer=HireKiwi');
    expect(uri).toContain('algorithm=SHA1');
    expect(uri).toContain('digits=6');
    expect(uri).toContain('period=30');
  });
});
