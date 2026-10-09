import { createHmac, randomBytes } from 'node:crypto';

/**
 * RFC 4226 (HOTP) / RFC 6238 (TOTP), SHA-1/6-digit/30s — the parameters every
 * mainstream authenticator app (Google Authenticator, Authy, 1Password, …)
 * assumes when it isn't told otherwise. No otplib/speakeasy dependency: the
 * algorithm is ~40 lines and pulling a package for it isn't worth the extra
 * supply-chain surface on an auth-critical path.
 */

const DIGITS = 6;
const PERIOD_SECONDS = 30;
const SECRET_BYTES = 20; // 160 bits, the RFC 4226 recommendation.

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(secret: string): Buffer {
  const cleaned = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of cleaned) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** A fresh random TOTP secret, base32-encoded for the authenticator app and QR URI. */
export function generateTotpSecret(): string {
  return base32Encode(randomBytes(SECRET_BYTES));
}

function hotp(secret: Buffer, counter: bigint): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(counter);
  const hmac = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = hmac.readUInt8(hmac.length - 1) & 0x0f;
  const truncated =
    ((hmac.readUInt8(offset) & 0x7f) << 24) |
    ((hmac.readUInt8(offset + 1) & 0xff) << 16) |
    ((hmac.readUInt8(offset + 2) & 0xff) << 8) |
    (hmac.readUInt8(offset + 3) & 0xff);
  return String(truncated % 10 ** DIGITS).padStart(DIGITS, '0');
}

/** The 6-digit code for `secret` at `atMs` (default: now). */
export function generateTotp(secretBase32: string, atMs: number = Date.now()): string {
  const counter = BigInt(Math.floor(atMs / 1000 / PERIOD_SECONDS));
  return hotp(base32Decode(secretBase32), counter);
}

/**
 * Accepts the current 30s step and one step on either side, so a code typed
 * just before/after a step boundary (or a slightly slow phone clock) still
 * verifies. Constant set of comparisons, not early-exit, to avoid leaking
 * which step (if any) matched via timing.
 */
export function verifyTotp(
  secretBase32: string,
  code: string,
  options: { atMs?: number; windowSteps?: number } = {},
): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const atMs = options.atMs ?? Date.now();
  const windowSteps = options.windowSteps ?? 1;
  const secret = base32Decode(secretBase32);
  const currentStep = BigInt(Math.floor(atMs / 1000 / PERIOD_SECONDS));
  let matched = false;
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    const candidate = hotp(secret, currentStep + BigInt(delta));
    if (candidate === code) matched = true;
  }
  return matched;
}

/** `otpauth://` URI for a QR code; `accountLabel` is typically the user's email. */
export function buildTotpUri(secretBase32: string, accountLabel: string, issuer: string): string {
  const label = encodeURIComponent(`${issuer}:${accountLabel}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
