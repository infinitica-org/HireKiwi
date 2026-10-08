import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

/**
 * Generic at-rest encryption for secrets we must read back in plaintext later
 * (e.g. a student's GitHub access token) — unlike password/API-key hashing,
 * which is one-way and only ever compared, never decrypted.
 *
 * The key argument is any passphrase (same ergonomics as JWT_SECRET /
 * CERTIFICATE_MASTER_SECRET): it is hashed to exactly 32 bytes, so callers
 * never have to generate or store a correctly-sized raw key themselves.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function deriveKey(passphrase: string): Buffer {
  return createHash('sha256').update(passphrase, 'utf8').digest();
}

/** Encrypts `plaintext`. Output format: `<iv>.<authTag>.<ciphertext>`, each base64url. */
export function encryptSecret(plaintext: string, passphrase: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, deriveKey(passphrase), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((buf) => buf.toString('base64url')).join('.');
}

/** Inverse of {@link encryptSecret}. Throws if `passphrase` is wrong or the payload was tampered with. */
export function decryptSecret(payload: string, passphrase: string): string {
  const [ivPart, tagPart, dataPart] = payload.split('.');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Malformed encrypted secret payload.');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    deriveKey(passphrase),
    Buffer.from(ivPart, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
