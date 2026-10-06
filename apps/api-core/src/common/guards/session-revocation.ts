/**
 * Th6-614 - access tokens are signed JWTs, so on their own they stay valid until they expire,
 * even after the session behind them was revoked (logout, reuse detection, admin revoke).
 * Every access token carries its session as the `fam` (refresh-token family) claim; when a
 * family is revoked its id is written to Redis for the lifetime of any token that could still
 * be in circulation, and JwtAuthGuard rejects tokens whose family is marked.
 */
export const REVOKED_FAMILY_KEY_PREFIX = 'auth:revoked-family:';

export function revokedFamilyKey(familyId: string): string {
  return `${REVOKED_FAMILY_KEY_PREFIX}${familyId}`;
}

/** A marker only has to outlive the longest access token that could carry the family. */
export function revokedFamilyTtlSeconds(accessTtlSeconds: number): number {
  return accessTtlSeconds + 60;
}
