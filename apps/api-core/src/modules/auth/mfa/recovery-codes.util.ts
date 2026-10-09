import { randomInt } from 'node:crypto';

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I — hand-transcribed.
const GROUP_LENGTH = 5;
const GROUP_COUNT = 2;

function randomCode(): string {
  const groups: string[] = [];
  for (let group = 0; group < GROUP_COUNT; group++) {
    let chars = '';
    for (let i = 0; i < GROUP_LENGTH; i++) {
      chars += RECOVERY_CODE_ALPHABET[randomInt(RECOVERY_CODE_ALPHABET.length)];
    }
    groups.push(chars);
  }
  return groups.join('-'); // e.g. "7K4PQ-9XZ3M"
}

/** A fresh batch of plaintext recovery codes. Caller hashes each before storing. */
export function generateRecoveryCodes(count: number = RECOVERY_CODE_COUNT): string[] {
  return Array.from({ length: count }, randomCode);
}

/** Codes are shown and typed back with the dash; normalize before hashing/comparing. */
export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase();
}
