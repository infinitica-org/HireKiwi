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

const NPTEL_HOST_PATTERN = /(^|\.)nptel\.ac\.in$/i;
/** e.g. NPTEL21GE15S4336322203133020 — printed on the certificate and encoded in its QR code. */
const ROLL_NUMBER_PATTERN = /^NPTEL\d{2}[A-Z]{2,4}\d{1,3}S\d{5,}$/i;
const LOOKUP_BASE_URL = 'https://archive.nptel.ac.in/noc/Ecertificate/?q=';
const NO_CERTIFICATE_PATTERN = /dont have a Certificate/i;
const CERTIFICATE_IMAGE_PATTERN = /<img\b[^>]*\bsrc=["']data:image\//i;

/**
 * NPTEL (IIT/IISc online courses). NPTEL's own archive looks a certificate up by roll number and
 * answers either with the certificate as an image or with an explicit "no certificate" message,
 * so existence is checked against the issuer itself. The learner's name exists only inside that
 * image, so this adapter never reports a subject name: the identity check is left to a reviewer.
 */
export class NptelAdapter implements CredentialVerifier {
  readonly id = 'nptel';

  canHandle(input: CredentialInput): boolean {
    return rollNumber(input) !== null;
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    return {
      achievement: { credentialType: 'COURSE_COMPLETION' },
      issuer: {
        name: 'NPTEL',
        domain: 'nptel.ac.in',
        issuerType: 'issuer',
        trustStatus: 'TRUSTED',
      },
      subject: {},
      issueDate: null,
      expirationDate: null,
      sourceEvidence: [
        { evidenceType: 'verification_page', url: input.value, fileRef: null, metadata: {} },
      ],
      rawInput: input,
    };
  }

  async verify(credential: NormalizedCredential): Promise<AdapterVerificationResult> {
    const roll = rollNumber(credential.rawInput);
    const checks: VerificationCheck[] = [];
    if (!roll) {
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail: 'No NPTEL roll number.' });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, credential.rawInput.value);
    }
    const lookupUrl = `${LOOKUP_BASE_URL}${roll}`;

    let html: string;
    try {
      const response = await safeFetch(lookupUrl);
      if (!response.ok) {
        checks.push({
          checkName: 'credential',
          result: 'UNKNOWN',
          detail: `NPTEL returned HTTP ${response.status}.`,
        });
        return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, lookupUrl);
      }
      html = response.text;
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Lookup URL blocked: ${error.message}`
          : `Could not reach NPTEL: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail });
      return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, lookupUrl);
    }

    if (NO_CERTIFICATE_PATTERN.test(html)) {
      checks.push({
        checkName: 'credential',
        result: 'FAIL',
        detail: `NPTEL has no certificate for roll number ${roll}.`,
      });
      return this.result('NOT_FOUND', 'UNVERIFIED', checks, lookupUrl);
    }
    if (!CERTIFICATE_IMAGE_PATTERN.test(html)) {
      checks.push({
        checkName: 'credential',
        result: 'UNKNOWN',
        detail: 'NPTEL answered, but not with a certificate image this adapter recognizes.',
      });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, lookupUrl);
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: `NPTEL holds a certificate for roll number ${roll}.`,
    });
    checks.push({ checkName: 'issuer', result: 'PASS', detail: 'Looked up on nptel.ac.in.' });
    checks.push({
      checkName: 'subject',
      result: 'UNKNOWN',
      detail: "The learner's name is only printed in NPTEL's certificate image.",
    });
    return this.result('VERIFIED', 'ISSUER_RECORD_MATCH', checks, lookupUrl, true);
  }

  async getEvidence(credential: NormalizedCredential): Promise<Evidence[]> {
    return credential.sourceEvidence;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: false,
      canCheckRevocation: false,
      canCheckSubjectIdentity: false,
      requiresUserMediation: false,
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
    };
  }

  private result(
    status: AdapterVerificationResult['status'],
    level: AdapterVerificationResult['verificationLevel'],
    checks: VerificationCheck[],
    evidenceUrl: string,
    found = false,
  ): AdapterVerificationResult {
    return {
      status,
      verificationLevel: level,
      method: 'ISSUER_VERIFICATION_PAGE',
      provider: 'nptel',
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      checks,
      evidence: [
        { evidenceType: 'verification_page', url: evidenceUrl, fileRef: null, metadata: {} },
      ],
      evidenceUrl,
      rawResponse: null,
      subjectName: null,
      details: found
        ? { achievementName: null, issuerName: 'NPTEL', issuedOn: null, expiresOn: null }
        : null,
    };
  }
}

/** Accepts the QR/link forms (/noc/E_Certificate/<roll>, /noc/Ecertificate/?q=<roll>) or a bare roll number. */
function rollNumber(input: CredentialInput): string | null {
  if (input.type === 'ISSUER_AND_ID') {
    const value = input.value.trim();
    return ROLL_NUMBER_PATTERN.test(value) ? value.toUpperCase() : null;
  }
  if (input.type !== 'URL' && input.type !== 'QR_CODE') return null;
  try {
    const url = new URL(input.value);
    if (!NPTEL_HOST_PATTERN.test(url.hostname)) return null;
    const candidate =
      url.searchParams.get('q') ??
      /\/noc\/E_?Certificate\/([^/?#]+)/i.exec(url.pathname)?.[1] ??
      '';
    return ROLL_NUMBER_PATTERN.test(candidate) ? candidate.toUpperCase() : null;
  } catch {
    return null;
  }
}
