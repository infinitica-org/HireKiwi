import type {
  AdapterCapabilities,
  AdapterVerificationResult,
  CredentialInput,
  CredentialVerifier,
  NormalizedCredential,
} from '../types.js';

/**
 * Registered last, matches nothing by itself, and is what the registry
 * returns when no real adapter claims the input. Keeps the orchestrator
 * from ever needing a null-adapter branch, and keeps "we don't know how to
 * verify this" an explicit, honest result rather than a thrown error.
 */
export class UnverifiableFallbackAdapter implements CredentialVerifier {
  readonly id = 'unverifiable-fallback';

  canHandle(_input: CredentialInput): boolean {
    return false; // never selected by canHandle matching; the registry uses it only as a last resort
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    return {
      achievement: {},
      issuer: {},
      subject: {},
      issueDate: null,
      expirationDate: null,
      sourceEvidence: [],
      rawInput: input,
    };
  }

  async verify(_credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    return {
      status: 'UNVERIFIABLE',
      verificationLevel: 'UNVERIFIED',
      method: 'DOCUMENT_PARSE',
      provider: null,
      verifiedAt: null,
      checks: [
        { checkName: 'issuer', result: 'UNKNOWN', detail: 'No adapter recognized this input.' },
      ],
      evidence: [],
      evidenceUrl: null,
      rawResponse: null,
    };
  }

  async getEvidence(): Promise<[]> {
    return [];
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: false,
      canCheckRevocation: false,
      canCheckSubjectIdentity: false,
      requiresUserMediation: false,
      integrationType: 'UNSUPPORTED',
    };
  }
}
