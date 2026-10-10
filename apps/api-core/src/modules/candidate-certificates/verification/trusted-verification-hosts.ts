/**
 * Hosts whose public verification pages Tier 2 may auto-verify from by reading visible page text.
 *
 * A host belongs here only when (1) the issuer controls every page under it — nothing a student
 * can author, so no GitHub Pages / Notion / Google Sites — and (2) its server-rendered HTML shows
 * the holder's name and the credential. Check both against a live page and add a fixture-backed
 * spec before adding a host.
 *
 * Platforms the credential-verifier engine has an adapter for (Credly, Coursera, HackerRank, NPTEL)
 * don't need an entry: Tier 1 handles them, with an identity check. Empty until a host has been
 * checked; every other link goes to manual review instead of being trusted on its text.
 */
export const TRUSTED_VERIFICATION_HOSTS: readonly string[] = [];

/** True when `hostname` is a listed host or a subdomain of one. */
export function isTrustedVerificationHost(
  hostname: string,
  trustedHosts: readonly string[] = TRUSTED_VERIFICATION_HOSTS,
): boolean {
  const host = hostname.toLowerCase().replace(/\.$/u, '');
  return trustedHosts.some((trusted) => host === trusted || host.endsWith(`.${trusted}`));
}
