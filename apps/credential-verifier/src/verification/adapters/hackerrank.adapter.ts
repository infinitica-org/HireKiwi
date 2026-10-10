import { toIsoDate } from '../html-meta.util.js';
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

const HACKERRANK_HOST_PATTERN = /(^|\.)hackerrank\.com$/i;
const CERTIFICATE_PATH_PATTERN = /^\/certificates\/(?:iframe\/)?([a-f0-9]{8,24})\/?$/i;
const CERTIFICATE_BASE_URL = 'https://www.hackerrank.com/certificates/';
const INITIAL_DATA_PATTERN =
  /<script\b[^>]*\bid=["']initialData["'][^>]*>\s*([\s\S]*?)\s*<\/script>/iu;

/** The fields this adapter reads from HackerRank's certificate record. */
export interface HackerRankCertificate {
  status: string | null;
  skills: string[];
  holderName: string | null;
  completedAt: string | null;
}

/**
 * HackerRank skill certificates. The page is client-rendered, but the server embeds its initial
 * Redux state (URL-encoded JSON in `<script id="initialData">`) holding the certificate record:
 * pass status, the skill(s), and the name the holder chose to print on it.
 */
export class HackerRankAdapter implements CredentialVerifier {
  readonly id = 'hackerrank';

  canHandle(input: CredentialInput): boolean {
    return certificateId(input) !== null;
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    return {
      achievement: { credentialType: 'SKILL_CREDENTIAL' },
      issuer: {
        name: 'HackerRank',
        domain: 'hackerrank.com',
        issuerType: 'platform',
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
    const id = certificateId(credential.rawInput);
    const checks: VerificationCheck[] = [];
    if (!id) {
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail: 'No certificate id.' });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, credential.rawInput.value);
    }
    const pageUrl = `${CERTIFICATE_BASE_URL}${id}`;

    let record: HackerRankCertificate | null;
    try {
      const response = await safeFetch(pageUrl);
      if (response.status === 404) {
        checks.push({
          checkName: 'credential',
          result: 'FAIL',
          detail: 'Certificate not found (404).',
        });
        return this.result('NOT_FOUND', 'UNVERIFIED', checks, pageUrl);
      }
      if (!response.ok) {
        checks.push({
          checkName: 'credential',
          result: 'UNKNOWN',
          detail: `HackerRank returned HTTP ${response.status}.`,
        });
        return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, pageUrl);
      }
      record = parseHackerRankPage(response.text, id);
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Certificate URL blocked: ${error.message}`
          : `Could not reach HackerRank: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail });
      return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, pageUrl);
    }

    if (!record) {
      checks.push({
        checkName: 'credential',
        result: 'UNKNOWN',
        detail: `HackerRank's page did not include a record for certificate ${id}.`,
      });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, pageUrl);
    }

    const skill = record.skills.join(', ') || 'skill';
    if (record.status !== 'test_passed') {
      checks.push({
        checkName: 'status',
        result: 'FAIL',
        detail: `HackerRank lists this ${skill} certificate as "${record.status ?? 'unknown'}", not passed.`,
      });
      return this.result('INVALID', 'CREDENTIAL_PLATFORM_VERIFIED', checks, pageUrl, record);
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: `HackerRank ${skill} certificate ${id}, test passed.`,
    });
    checks.push({ checkName: 'issuer', result: 'PASS', detail: 'Issued by HackerRank.' });
    checks.push({
      checkName: 'subject',
      result: record.holderName ? 'PASS' : 'UNKNOWN',
      detail: record.holderName
        ? `Name on the certificate: ${record.holderName}.`
        : 'No holder name on the certificate.',
    });
    checks.push({ checkName: 'expiration', result: 'SKIP', detail: 'No expiration.' });
    return this.result('VERIFIED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, pageUrl, record);
  }

  async getEvidence(credential: NormalizedCredential): Promise<Evidence[]> {
    return credential.sourceEvidence;
  }

  getCapabilities(): AdapterCapabilities {
    return {
      canCheckExpiration: false,
      canCheckRevocation: false,
      canCheckSubjectIdentity: true,
      requiresUserMediation: false,
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
    };
  }

  private result(
    status: AdapterVerificationResult['status'],
    level: AdapterVerificationResult['verificationLevel'],
    checks: VerificationCheck[],
    evidenceUrl: string,
    record: HackerRankCertificate | null = null,
  ): AdapterVerificationResult {
    return {
      status,
      verificationLevel: level,
      method: 'ISSUER_VERIFICATION_PAGE',
      provider: 'hackerrank',
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      checks,
      evidence: [
        { evidenceType: 'verification_page', url: evidenceUrl, fileRef: null, metadata: {} },
      ],
      evidenceUrl,
      rawResponse: null,
      subjectName: record?.holderName ?? null,
      details: record
        ? {
            achievementName: record.skills.length
              ? `${record.skills.join(', ')} certificate`
              : null,
            issuerName: 'HackerRank',
            issuedOn: record.completedAt,
            expiresOn: null,
          }
        : null,
    };
  }
}

function certificateId(input: CredentialInput): string | null {
  if (input.type !== 'URL' && input.type !== 'QR_CODE') return null;
  try {
    const url = new URL(input.value);
    if (!HACKERRANK_HOST_PATTERN.test(url.hostname)) return null;
    return CERTIFICATE_PATH_PATTERN.exec(url.pathname)?.[1]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

/** Decodes `initialData` and finds the record keyed by `id` in any `certificates` map. */
export function parseHackerRankPage(html: string, id: string): HackerRankCertificate | null {
  const encoded = INITIAL_DATA_PATTERN.exec(html)?.[1];
  if (!encoded) return null;
  let state: unknown;
  try {
    state = JSON.parse(decodeURIComponent(encoded));
  } catch {
    return null;
  }
  const raw = findCertificate(state, id, 0);
  if (!raw) return null;
  const skills = Array.isArray(raw.certificates)
    ? raw.certificates.filter((skill): skill is string => typeof skill === 'string')
    : [];
  const holderName = typeof raw.hacker_name === 'string' ? raw.hacker_name.trim() : '';
  return {
    status: typeof raw.status === 'string' ? raw.status : null,
    skills,
    holderName: holderName || null,
    completedAt: toIsoDate(raw.completed_at ?? null),
  };
}

type RawCertificate = Record<string, unknown> & { certificates?: unknown };

function findCertificate(node: unknown, id: string, depth: number): RawCertificate | null {
  if (depth > 6 || typeof node !== 'object' || node === null) return null;
  const record = node as Record<string, unknown>;
  const certificates = record.certificates;
  if (typeof certificates === 'object' && certificates !== null && !Array.isArray(certificates)) {
    const match = (certificates as Record<string, unknown>)[id];
    if (typeof match === 'object' && match !== null) return match as RawCertificate;
  }
  for (const value of Object.values(record)) {
    const found = findCertificate(value, id, depth + 1);
    if (found) return found;
  }
  return null;
}
