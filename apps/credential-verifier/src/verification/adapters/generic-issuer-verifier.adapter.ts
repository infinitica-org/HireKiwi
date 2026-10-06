import type {
  AdapterCapabilities,
  AdapterVerificationResult,
  CredentialInput,
  CredentialVerifier,
  Evidence,
  NormalizedCredential,
  VerificationCheck,
} from '../types.js';

export interface GenericIssuerConfig {
  id: string;
  displayName: string;
  /** Matched against the declared issuer string (ISSUER_AND_ID input) or the verification-page domain. */
  issuerKeywords: string[];
  domainMatch?: string[];
  integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT' | 'PUBLIC_ISSUER_VERIFICATION_PAGE';
  /**
   * Set only once the issuer's public verify form's field names/selectors
   * and robots.txt/ToS have actually been checked. Left false means: the
   * mechanism is confirmed to exist (research matrix), but this adapter
   * does not yet automate it — an honest UNVERIFIABLE, not a scraper built
   * on guessed selectors.
   */
  implemented: boolean;
  notes: string;
}

/**
 * Framework for issuer public-lookup pages (no API, form-based verification
 * by ID/code) — the research matrix's PUBLIC_ISSUER_VERIFICATION_PAGE
 * category (Cisco, Linux Foundation). Config-driven so adding a confirmed
 * issuer is a config entry, not new adapter code.
 *
 * Both configured entries are `implemented: false` today: before scraping
 * either page, the open question from the research doc — confirming the
 * form's real field names/selectors and that automated access doesn't
 * violate robots.txt/ToS — hasn't been resolved. Returning a clear
 * UNVERIFIABLE here is the "fail gracefully" rule in practice, not a
 * placeholder bug.
 */
export class GenericIssuerVerifierAdapter implements CredentialVerifier {
  readonly id = 'generic-issuer-verifier';

  private readonly configs: GenericIssuerConfig[] = [
    {
      id: 'cisco',
      displayName: 'Cisco',
      issuerKeywords: ['cisco', 'ccna', 'ccnp'],
      domainMatch: ['cp.certmetrics.com'],
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
      implemented: false,
      notes:
        'Public tool confirmed at cp.certmetrics.com/cisco/en/public/verify/credential (16-digit code lookup). Form field names/selectors and robots.txt/ToS not yet confirmed — see research doc open questions.',
    },
    {
      id: 'linux-foundation',
      displayName: 'Linux Foundation',
      issuerKeywords: ['linux foundation', 'cka', 'ckad', 'cks'],
      domainMatch: ['training.linuxfoundation.org'],
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
      implemented: false,
      notes:
        'Public tool confirmed at training.linuxfoundation.org/certification/verify (Certificate ID + exact last name). Form field names/selectors and robots.txt/ToS not yet confirmed — see research doc open questions.',
    },
  ];

  canHandle(input: CredentialInput): boolean {
    return this.matchConfig(input) !== null;
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    const config = this.matchConfig(input);
    return {
      achievement: { credentialType: 'PROFESSIONAL_CERTIFICATION' },
      issuer: {
        name: config?.displayName ?? 'Unknown',
        domain: config?.domainMatch?.[0] ?? null,
        issuerType: 'issuer-verification-page',
        trustStatus: 'UNVERIFIED',
      },
      subject: {},
      issueDate: null,
      expirationDate: null,
      sourceEvidence: [],
      rawInput: input,
    };
  }

  async verify(credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    const config = this.matchConfig(credential.rawInput);
    const checks: VerificationCheck[] = [
      {
        checkName: 'issuer',
        result: 'UNKNOWN',
        detail: config
          ? `${config.displayName}'s public verification page is known (${config.notes}) but not yet automated by this adapter.`
          : 'No configured issuer matched this input.',
      },
    ];
    return {
      status: 'UNVERIFIABLE',
      verificationLevel: 'UNVERIFIED',
      method: 'ISSUER_VERIFICATION_PAGE',
      provider: config?.id ?? null,
      verifiedAt: null,
      checks,
      evidence: [],
      evidenceUrl: null,
      rawResponse: null,
    };
  }

  async getEvidence(): Promise<Evidence[]> {
    return [];
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: false,
      canCheckRevocation: false,
      canCheckSubjectIdentity: false,
      requiresUserMediation: false,
      integrationType: 'PUBLIC_ISSUER_VERIFICATION_PAGE',
    };
  }

  private matchConfig(input: CredentialInput): GenericIssuerConfig | null {
    if (input.type === 'ISSUER_AND_ID') {
      const declared =
        typeof input.metadata?.issuer === 'string' ? input.metadata.issuer.toLowerCase() : '';
      return this.configs.find((c) => c.issuerKeywords.some((kw) => declared.includes(kw))) ?? null;
    }
    if (input.type === 'URL' || input.type === 'QR_CODE') {
      try {
        const hostname = new URL(input.value).hostname;
        return this.configs.find((c) => c.domainMatch?.some((d) => hostname.endsWith(d))) ?? null;
      } catch {
        return null;
      }
    }
    return null;
  }
}
