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

interface ParsedBadgePage {
  badgeName: string | null;
  issuerName: string | null;
  recipientName: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  state: 'active' | 'expired' | 'revoked' | 'unknown';
}

/**
 * Credly adapter — treated as a PLATFORM per the Priority 0 research, not a
 * per-issuer integration: AWS/GCP/MongoDB badges all route through here.
 *
 * Per research, there is no documented public API for anonymous badge
 * lookup (the Web Service API is for the ISSUING organization's own
 * management). This adapter instead fetches the public badge page itself
 * and extracts the embedded JSON-LD (schema.org or Open Badges) that
 * Credly's public pages publish — falling back to an explicit
 * UNVERIFIABLE when that structured data isn't present, rather than
 * guessing from HTML text.
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
    const badgeUrl = credential.rawInput.value;
    const checks: VerificationCheck[] = [];

    let page: ParsedBadgePage;
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
      page = this.parseBadgePage(response.text);
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Badge URL blocked: ${error.message}`
          : `Could not reach Credly: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail });
      return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, badgeUrl);
    }

    if (!page.badgeName) {
      checks.push({
        checkName: 'credential',
        result: 'UNKNOWN',
        detail:
          'Page fetched but no structured badge data (JSON-LD) was found to parse. Confirm the public badge page still embeds this before trusting this adapter further.',
      });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, badgeUrl);
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: `Resolved badge "${page.badgeName}" from the public Credly page.`,
    });
    checks.push({
      checkName: 'issuer',
      result: page.issuerName ? 'PASS' : 'UNKNOWN',
      detail: page.issuerName ? `Issued by ${page.issuerName}.` : 'Issuer name not found on page.',
    });
    checks.push({
      checkName: 'subject',
      result: page.recipientName ? 'PASS' : 'UNKNOWN',
      detail: page.recipientName
        ? `Recipient: ${page.recipientName}.`
        : 'Recipient name not found on page.',
    });

    if (page.state === 'revoked') {
      checks.push({
        checkName: 'status',
        result: 'FAIL',
        detail: 'Badge page indicates this badge was revoked.',
      });
      return this.result('REVOKED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl);
    }
    if (page.state === 'expired' || (page.expiresOn && new Date(page.expiresOn) < new Date())) {
      checks.push({
        checkName: 'expiration',
        result: 'FAIL',
        detail: `Expired ${page.expiresOn ?? 'per page state'}.`,
      });
      return this.result('EXPIRED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl);
    }
    checks.push({
      checkName: 'expiration',
      result: page.expiresOn ? 'PASS' : 'SKIP',
      detail: page.expiresOn ? `Valid until ${page.expiresOn}.` : 'No expiration found on page.',
    });

    return this.result('VERIFIED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, badgeUrl);
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

  /** Extracts the embedded JSON-LD block Credly's public badge pages publish. Returns nulls (never fabricated values) if the shape isn't found. */
  private parseBadgePage(html: string): ParsedBadgePage {
    const jsonLdMatch =
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i.exec(html);
    if (!jsonLdMatch?.[1]) {
      return {
        badgeName: null,
        issuerName: null,
        recipientName: null,
        issuedOn: null,
        expiresOn: null,
        state: 'unknown',
      };
    }
    try {
      const data = JSON.parse(jsonLdMatch[1]) as Record<string, unknown>;
      const name = typeof data.name === 'string' ? data.name : null;
      const issuer = data.issuer as { name?: string } | string | undefined;
      const issuerName = typeof issuer === 'string' ? issuer : (issuer?.name ?? null);
      const recipient = data.recipient as { name?: string } | undefined;
      const dateCreated = typeof data.dateCreated === 'string' ? data.dateCreated : null;
      const expires = typeof data.expires === 'string' ? data.expires : null;
      return {
        badgeName: name,
        issuerName,
        recipientName: recipient?.name ?? null,
        issuedOn: dateCreated,
        expiresOn: expires,
        state: /revoked/i.test(html) ? 'revoked' : /expired/i.test(html) ? 'expired' : 'active',
      };
    } catch {
      return {
        badgeName: null,
        issuerName: null,
        recipientName: null,
        issuedOn: null,
        expiresOn: null,
        state: 'unknown',
      };
    }
  }

  private result(
    status: AdapterVerificationResult['status'],
    level: AdapterVerificationResult['verificationLevel'],
    checks: VerificationCheck[],
    evidenceUrl: string,
  ): AdapterVerificationResult {
    return {
      status,
      verificationLevel: level,
      method: 'CREDLY',
      provider: 'credly',
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      checks,
      evidence: [{ evidenceType: 'badge_url', url: evidenceUrl, fileRef: null, metadata: {} }],
      evidenceUrl,
      rawResponse: null,
    };
  }
}
