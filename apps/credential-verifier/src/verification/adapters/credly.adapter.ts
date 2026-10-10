import { safeFetch, UnsafeUrlError } from '../safe-fetch.util.js';
import type {
  AdapterCapabilities,
  AdapterVerificationResult,
  CredentialInput,
  CredentialVerifier,
  Evidence,
  NormalizedCredential,
  VerificationCheck,
} from '../types.js';

const CREDLY_HOST_PATTERN = /(^|\.)(credly\.com|youracclaim\.com)$/i;
const BADGE_ID_PATTERN =
  /\/badges?\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;
const ASSERTION_BASE_URL = 'https://api.credly.com/v1/obi/v2/badge_assertions/';
const PUBLIC_BADGE_BASE_URL = 'https://www.credly.com/badges/';

export interface ParsedBadgePage {
  badgeName: string;
  issuerName: string;
  recipientName: string;
}

/** The subset of Credly's hosted Open Badges v2 assertion this adapter reads. */
interface BadgeAssertion {
  issuedOn?: unknown;
  expires?: unknown;
  revoked?: unknown;
  revocationReason?: unknown;
}

type AssertionLookup =
  | { kind: 'found'; assertion: BadgeAssertion }
  | { kind: 'revoked'; reason: string | null }
  | { kind: 'unavailable'; detail: string };

/**
 * Credly adapter — treated as a PLATFORM per the Priority 0 research, not a
 * per-issuer integration: AWS/GCP/Cisco/MongoDB badges all route through here.
 *
 * There is no documented public API for anonymous badge lookup, and the
 * public badge page is client-rendered: the server HTML carries no JSON-LD
 * and no visible badge text. What it does carry is the Open Graph title
 * ("<badge> was issued by <issuer> to <earner>."), which is the only place
 * the earner's display name is public. Status comes from Credly's hosted
 * Open Badges v2 assertion for the same badge id (issue date, expiry,
 * revocation); its recipient is a hashed email, so it can't name the earner.
 *
 * The earner's name is returned as `subjectName` — a fact about the
 * credential. Matching it against a particular account is the caller's job:
 * results here are cached and deduplicated per badge URL, not per caller.
 */
export class CredlyAdapter implements CredentialVerifier {
  readonly id = 'credly';

  canHandle(input: CredentialInput): boolean {
    if (input.type !== 'URL' && input.type !== 'QR_CODE') return false;
    try {
      const url = new URL(input.value);
      return CREDLY_HOST_PATTERN.test(url.hostname);
    } catch {
      return false;
    }
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    return {
      achievement: { credentialType: 'DIGITAL_BADGE' },
      issuer: {
        name: 'Credly',
        domain: 'credly.com',
        issuerType: 'platform',
        trustStatus: 'TRUSTED',
      },
      subject: {},
      issueDate: null,
      expirationDate: null,
      sourceEvidence: [
        { evidenceType: 'badge_url', url: input.value, fileRef: null, metadata: {} },
      ],
      rawInput: input,
    };
  }

  async verify(credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    // Students paste whatever link they have open: /badges/<id>/public_url, /badges/<id>, or the
    // signed-in /earner/earned/badge/<id>, which is an app shell with no badge data. Every form
    // carries the badge id, so always read the public page for it.
    const badgeId =
      BADGE_ID_PATTERN.exec(new URL(credential.rawInput.value).pathname)?.[1]?.toLowerCase() ??
      null;
    const badgeUrl = badgeId
      ? `${PUBLIC_BADGE_BASE_URL}${badgeId}/public_url`
      : credential.rawInput.value;
    const checks: VerificationCheck[] = [];

    let page: ParsedBadgePage | null;
    try {
      const response = await safeFetch(badgeUrl);
      if (response.status === 404) {
        checks.push({
          checkName: 'credential',
          result: 'FAIL',
          detail: 'Badge page not found (404).',
        });
        return this.result('NOT_FOUND', 'UNVERIFIED', checks, badgeUrl);
      }
      if (!response.ok) {
        checks.push({
          checkName: 'credential',
          result: 'UNKNOWN',
          detail: `Credly returned HTTP ${response.status}.`,
        });
        return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, badgeUrl);
      }
      page = parseBadgePage(response.text);
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Badge URL blocked: ${error.message}`
          : `Could not reach Credly: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail });
      return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, badgeUrl);
    }

    if (!page) {
      checks.push({
        checkName: 'credential',
        result: 'UNKNOWN',
        detail:
          'Page fetched but its og:title did not name a badge, issuer and earner (private badge, or Credly changed the page format).',
      });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, badgeUrl);
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: `Resolved badge "${page.badgeName}" from the public Credly page.`,
    });
    checks.push({ checkName: 'issuer', result: 'PASS', detail: `Issued by ${page.issuerName}.` });
    checks.push({
      checkName: 'subject',
      result: 'PASS',
      detail: `Earner named on the badge: ${page.recipientName}.`,
    });

    const lookup = badgeId
      ? await this.fetchAssertion(badgeId)
      : ({ kind: 'unavailable', detail: 'No badge id in the URL.' } as const);

    if (lookup.kind === 'revoked') {
      checks.push({
        checkName: 'status',
        result: 'FAIL',
        detail: `Credly reports this badge as revoked${lookup.reason ? `: ${lookup.reason}` : '.'}`,
      });
      return this.result('REVOKED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl, page);
    }
    if (lookup.kind === 'unavailable') {
      checks.push({
        checkName: 'status',
        result: 'UNKNOWN',
        detail: `Revocation/expiry not checked — ${lookup.detail}`,
      });
      return this.result(
        'VERIFIED_WITH_WARNINGS',
        'CREDENTIAL_PLATFORM_VERIFIED',
        checks,
        badgeUrl,
        page,
      );
    }

    checks.push({ checkName: 'status', result: 'PASS', detail: 'Credly assertion is active.' });
    const expires = typeof lookup.assertion.expires === 'string' ? lookup.assertion.expires : null;
    if (expires && new Date(expires) < new Date()) {
      checks.push({ checkName: 'expiration', result: 'FAIL', detail: `Expired ${expires}.` });
      return this.result('EXPIRED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl, page);
    }
    checks.push({
      checkName: 'expiration',
      result: expires ? 'PASS' : 'SKIP',
      detail: expires ? `Valid until ${expires}.` : 'Badge has no expiration date.',
    });

    return this.result('VERIFIED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl, page);
  }

  async getEvidence(credential: NormalizedCredential): Promise<Evidence[]> {
    return credential.sourceEvidence;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: true,
      canCheckRevocation: true,
      canCheckSubjectIdentity: true,
      requiresUserMediation: false,
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
    };
  }

  /** Open Badges v2 hosted verification: a revoked assertion answers 410, or 200 with `revoked: true`. */
  private async fetchAssertion(badgeId: string): Promise<AssertionLookup> {
    try {
      const response = await safeFetch(`${ASSERTION_BASE_URL}${badgeId}`, {
        headers: { Accept: 'application/json' },
      });
      if (response.status === 410) return { kind: 'revoked', reason: null };
      if (!response.ok) {
        return { kind: 'unavailable', detail: `assertion returned HTTP ${response.status}.` };
      }
      const assertion = JSON.parse(response.text) as BadgeAssertion;
      if (assertion.revoked === true) {
        return {
          kind: 'revoked',
          reason:
            typeof assertion.revocationReason === 'string' ? assertion.revocationReason : null,
        };
      }
      return { kind: 'found', assertion };
    } catch (error: unknown) {
      return {
        kind: 'unavailable',
        detail: `assertion lookup failed: ${error instanceof Error ? error.message : 'unknown error'}.`,
      };
    }
  }

  private result(
    status: AdapterVerificationResult['status'],
    level: AdapterVerificationResult['verificationLevel'],
    checks: VerificationCheck[],
    evidenceUrl: string,
    page: ParsedBadgePage | null = null,
  ): AdapterVerificationResult {
    const verified = status === 'VERIFIED' || status === 'VERIFIED_WITH_WARNINGS';
    return {
      status,
      verificationLevel: level,
      method: 'CREDLY',
      provider: 'credly',
      verifiedAt: verified ? new Date().toISOString() : null,
      checks,
      evidence: [{ evidenceType: 'badge_url', url: evidenceUrl, fileRef: null, metadata: {} }],
      evidenceUrl,
      rawResponse: null,
      subjectName: page?.recipientName ?? null,
    };
  }
}

/**
 * Reads "<badge> was issued by <issuer> to <earner>." out of the page's og:title.
 * The issuer match is greedy so a badge title containing " to " stays intact;
 * returns null (never a guess) when the title doesn't have that shape.
 */
export function parseBadgePage(html: string): ParsedBadgePage | null {
  const title = readMetaContent(html, 'og:title');
  if (!title) return null;
  const match = /^(.+?) was issued by (.+) to (.+?)\.?$/su.exec(title.trim());
  const [, badgeName, issuerName, recipientName] = match ?? [];
  if (!badgeName || !issuerName || !recipientName) return null;
  return {
    badgeName: badgeName.trim(),
    issuerName: issuerName.trim(),
    recipientName: recipientName.trim(),
  };
}

function readMetaContent(html: string, property: string): string | null {
  const tags = html.match(/<meta\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    const name = /\b(?:property|name)=["']([^"']+)["']/iu.exec(tag)?.[1];
    if (name?.toLowerCase() !== property) continue;
    const content = /\bcontent=(?:"([^"]*)"|'([^']*)')/iu.exec(tag);
    const value = content?.[1] ?? content?.[2];
    if (value) return decodeEntities(value);
  }
  return null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/gu, (_m, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/giu, (_m, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/gu, '"')
    .replace(/&apos;/gu, "'")
    .replace(/&lt;/gu, '<')
    .replace(/&gt;/gu, '>')
    .replace(/&amp;/gu, '&');
}
