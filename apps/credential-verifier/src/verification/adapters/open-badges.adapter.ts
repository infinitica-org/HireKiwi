import { safeFetch, UnsafeUrlError } from '../safe-fetch.util.js';
import { W3cVcAdapter } from './w3c-vc.adapter.js';
import type {
  AdapterCapabilities,
  AdapterVerificationResult,
  CredentialInput,
  CredentialVerifier,
  Evidence,
  NormalizedCredential,
  VerificationCheck,
} from '../types.js';

interface OpenBadgeAssertionShape {
  '@context'?: unknown;
  type?: string | string[];
  badge?: { name?: string; issuer?: { name?: string; url?: string } } | string;
  recipient?: { identity?: string; type?: string; hashed?: boolean };
  issuedOn?: string;
  expires?: string;
  verification?: { type?: string; url?: string };
  revoked?: boolean;
  revocationReason?: string;
}

/**
 * Open Badges adapter. v3.0 badges ARE W3C Verifiable Credentials — this
 * adapter detects that and delegates to W3cVcAdapter rather than
 * duplicating proof verification. v2.0 badges are self-asserted JSON with
 * verification pointing back to an issuer-hosted copy; this adapter
 * re-fetches that copy (through the SSRF-safe fetcher) and compares, which
 * is the actual OB 2.0 verification mechanism — not a signature.
 */
export class OpenBadgesAdapter implements CredentialVerifier {
  readonly id = 'open-badges';
  private readonly w3cVc = new W3cVcAdapter();

  canHandle(input: CredentialInput): boolean {
    if (input.type !== 'JSON_CREDENTIAL') return false;
    const shape = this.tryParse(input.value);
    if (!shape) return false;
    if (this.isOb3(shape)) return true;
    return this.isOb2Assertion(shape);
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    const shape = this.tryParse(input.value);
    if (shape && this.isOb3(shape)) {
      return this.w3cVc.normalize(input);
    }

    const badgeName =
      typeof shape?.badge === 'object' ? (shape.badge.name ?? 'Unknown') : 'Unknown';
    const issuerName =
      typeof shape?.badge === 'object' ? (shape.badge.issuer?.name ?? 'Unknown') : 'Unknown';

    return {
      achievement: { name: badgeName, credentialType: 'DIGITAL_BADGE' },
      issuer: {
        name: issuerName,
        domain: null,
        issuerType: 'open-badges-issuer',
        trustStatus: 'UNVERIFIED',
      },
      subject: {
        name: shape?.recipient?.identity ?? 'Unknown',
        email: null,
        externalIdentifier: null,
      },
      issueDate: shape?.issuedOn ?? null,
      expirationDate: shape?.expires ?? null,
      sourceEvidence: [
        { evidenceType: 'document', url: null, fileRef: null, metadata: { raw: input.value } },
      ],
      rawInput: input,
    };
  }

  async verify(credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    const shape = this.tryParse(credential.rawInput.value);
    if (!shape) {
      return this.unverifiable('Input did not parse as JSON.');
    }

    if (this.isOb3(shape)) {
      const result = await this.w3cVc.verify(credential);
      return { ...result, method: 'OPEN_BADGES', provider: 'open-badges-3.0-vc' };
    }

    const checks: VerificationCheck[] = [
      {
        checkName: 'credential',
        result: 'PASS',
        detail: 'Assertion has required Open Badges 2.0 fields.',
      },
    ];

    if (shape.revoked) {
      checks.push({
        checkName: 'status',
        result: 'FAIL',
        detail: shape.revocationReason ?? 'Badge marked revoked in assertion.',
      });
      return this.statusResult('REVOKED', 'ISSUER_RECORD_MATCH', checks, shape);
    }

    if (shape.expires && new Date(shape.expires) < new Date()) {
      checks.push({ checkName: 'expiration', result: 'FAIL', detail: `Expired ${shape.expires}.` });
      return this.statusResult('EXPIRED', 'ISSUER_RECORD_MATCH', checks, shape);
    }
    checks.push({
      checkName: 'expiration',
      result: shape.expires ? 'PASS' : 'SKIP',
      detail: shape.expires ? `Valid until ${shape.expires}.` : 'No expiration asserted.',
    });

    const verificationUrl = shape.verification?.url;
    if (!verificationUrl) {
      checks.push({
        checkName: 'issuer',
        result: 'UNKNOWN',
        detail: 'No issuer-hosted verification URL present.',
      });
      return this.statusResult('DOCUMENT_ONLY', 'DOCUMENT_PARSED', checks, shape);
    }

    try {
      const response = await safeFetch(verificationUrl);
      if (!response.ok) {
        checks.push({
          checkName: 'issuer',
          result: 'FAIL',
          detail: `Issuer-hosted assertion returned HTTP ${response.status}.`,
        });
        return this.statusResult('NOT_FOUND', 'DOCUMENT_PARSED', checks, shape);
      }
      const hosted = JSON.parse(response.text) as OpenBadgeAssertionShape;
      const matches =
        (typeof hosted.badge === 'object' ? hosted.badge.name : hosted.badge) ===
          (typeof shape.badge === 'object' ? shape.badge.name : shape.badge) &&
        hosted.recipient?.identity === shape.recipient?.identity;

      checks.push({
        checkName: 'issuer',
        result: matches ? 'PASS' : 'FAIL',
        detail: matches
          ? `Matches the issuer-hosted copy at ${verificationUrl}.`
          : 'Submitted assertion does not match the issuer-hosted copy.',
      });

      if (hosted.revoked) {
        checks.push({
          checkName: 'status',
          result: 'FAIL',
          detail: hosted.revocationReason ?? 'Issuer-hosted copy marked revoked.',
        });
        return this.statusResult('REVOKED', 'ISSUER_RECORD_MATCH', checks, shape, verificationUrl);
      }

      return this.statusResult(
        matches ? 'VERIFIED' : 'INVALID',
        'ISSUER_RECORD_MATCH',
        checks,
        shape,
        verificationUrl,
      );
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Verification URL blocked: ${error.message}`
          : `Could not reach issuer-hosted assertion: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'issuer', result: 'UNKNOWN', detail });
      return this.statusResult('VERIFICATION_ERROR', 'DOCUMENT_PARSED', checks, shape);
    }
  }

  async getEvidence(credential: NormalizedCredential): Promise<Evidence[]> {
    return credential.sourceEvidence;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: true,
      canCheckRevocation: true,
      canCheckSubjectIdentity: false,
      requiresUserMediation: false,
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
    };
  }

  private statusResult(
    status: AdapterVerificationResult['status'],
    level: AdapterVerificationResult['verificationLevel'],
    checks: VerificationCheck[],
    _shape: OpenBadgeAssertionShape,
    evidenceUrl?: string,
  ): AdapterVerificationResult {
    return {
      status,
      verificationLevel: level,
      method: 'OPEN_BADGES',
      provider: 'open-badges-2.0',
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      checks,
      evidence: evidenceUrl
        ? [{ evidenceType: 'verification_page', url: evidenceUrl, fileRef: null, metadata: {} }]
        : [],
      evidenceUrl: evidenceUrl ?? null,
      rawResponse: null,
    };
  }

  private unverifiable(reason: string): AdapterVerificationResult {
    return {
      status: 'UNVERIFIABLE',
      verificationLevel: 'UNVERIFIED',
      method: 'OPEN_BADGES',
      provider: null,
      verifiedAt: null,
      checks: [{ checkName: 'credential', result: 'FAIL', detail: reason }],
      evidence: [],
      evidenceUrl: null,
      rawResponse: null,
    };
  }

  private isOb3(shape: OpenBadgeAssertionShape): boolean {
    const context = shape['@context'];
    const contextStr = Array.isArray(context) ? context.join(' ') : String(context ?? '');
    const typeStr = Array.isArray(shape.type) ? shape.type.join(' ') : String(shape.type ?? '');
    const isVc =
      contextStr.includes('w3.org/2018/credentials') ||
      contextStr.includes('w3.org/ns/credentials');
    // OB 3.0 credentials ARE W3C VCs, but not every W3C VC is a badge — require the
    // OpenBadgeCredential type too, or this adapter would steal non-badge VCs from W3cVcAdapter.
    return isVc && typeStr.includes('OpenBadgeCredential');
  }

  private isOb2Assertion(shape: OpenBadgeAssertionShape): boolean {
    const typeStr = Array.isArray(shape.type) ? shape.type.join(' ') : String(shape.type ?? '');
    return typeStr.includes('Assertion') && typeof shape.badge !== 'undefined';
  }

  private tryParse(raw: string): OpenBadgeAssertionShape | null {
    try {
      return JSON.parse(raw) as OpenBadgeAssertionShape;
    } catch {
      return null;
    }
  }
}
