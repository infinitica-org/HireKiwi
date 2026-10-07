/**
 * Minimal JSON Canonicalization Scheme (RFC 8785) approximation: recursively
 * sorts object keys and emits compact JSON. Sufficient for verifying
 * `eddsa-jcs-2022` proofs, where the signed bytes are the canonical JSON of
 * the credential with `proof` removed. Does NOT implement RFC 8785's exact
 * number serialization rules — adequate for string/boolean/integer-heavy
 * credential payloads, not guaranteed byte-exact for floating point values.
 */
export function canonicalizeJcs(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stringify).join(',')}]`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return `{${keys.map((k) => `${JSON.stringify(k)}:${stringify(obj[k])}`).join(',')}}`;
  }
  throw new Error(`Cannot canonicalize value of type ${typeof value}`);
}
