/** Minimal base58btc decoder (Bitcoin alphabet) — enough to decode did:key multibase values without pulling in a dependency. */
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP = new Map(ALPHABET.split('').map((c, i) => [c, i]));

export function base58Decode(input: string): Uint8Array {
  let num = 0n;
  for (const char of input) {
    const value = ALPHABET_MAP.get(char);
    if (value === undefined) throw new Error(`Invalid base58 character: ${char}`);
    num = num * 58n + BigInt(value);
  }
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num /= 256n;
  }
  for (const char of input) {
    if (char !== '1') break;
    bytes.unshift(0);
  }
  return new Uint8Array(bytes);
}
