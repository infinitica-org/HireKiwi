import { readMetaContent, toIsoDate } from '../html-meta.util.js';
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

const COURSERA_HOST_PATTERN = /(^|\.)coursera\.org$/i;
/** Course certificate links: /verify/<CODE> (printed on the PDF) and /account/accomplishments/verify/<CODE>. */
const CERTIFICATE_PATH_PATTERN = /^\/(?:account\/accomplishments\/)?verify\/([a-z0-9]{6,20})\/?$/i;
const VERIFY_BASE_URL = 'https://www.coursera.org/account/accomplishments/verify/';

export interface ParsedCourseraPage {
  courseName: string | null;
  learnerName: string;
  grantedAt: string | null;
}

/**
 * Coursera course certificates. The public verify page is client-rendered, but the server HTML
 * carries the page's Apollo cache: the certificate code, its grant time and the learner's
 * identity-verified ("signature track") name, plus the course name in og:title.
 *
 * Only the single-course link shape is handled — Specialization and Professional Certificate
 * links use other paths and haven't been checked against a live page, so they fall through to
 * manual review rather than being parsed on a guess.
 */
export class CourseraAdapter implements CredentialVerifier {
  readonly id = 'coursera';

  canHandle(input: CredentialInput): boolean {
    return certificateCode(input) !== null;
  }

  async normalize(input: CredentialInput): Promise<NormalizedCredential> {
    return {
      achievement: { credentialType: 'COURSE_COMPLETION' },
      issuer: {
        name: 'Coursera',
        domain: 'coursera.org',
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
    const code = certificateCode(credential.rawInput);
    const checks: VerificationCheck[] = [];
    if (!code) {
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail: 'No certificate code.' });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, credential.rawInput.value);
    }
    const pageUrl = `${VERIFY_BASE_URL}${code}`;

    let page: ParsedCourseraPage | null;
    try {
      const response = await safeFetch(pageUrl);
      if (response.status === 404) {
        checks.push({
          checkName: 'credential',
          result: 'FAIL',
          detail: 'Certificate page not found (404).',
        });
        return this.result('NOT_FOUND', 'UNVERIFIED', checks, pageUrl);
      }
      if (!response.ok) {
        checks.push({
          checkName: 'credential',
          result: 'UNKNOWN',
          detail: `Coursera returned HTTP ${response.status}.`,
        });
        return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, pageUrl);
      }
      page = parseCourseraPage(response.text, code);
    } catch (error: unknown) {
      const detail =
        error instanceof UnsafeUrlError
          ? `Certificate URL blocked: ${error.message}`
          : `Could not reach Coursera: ${error instanceof Error ? error.message : 'unknown error'}.`;
      checks.push({ checkName: 'credential', result: 'UNKNOWN', detail });
      return this.result('VERIFICATION_ERROR', 'UNVERIFIED', checks, pageUrl);
    }

    if (!page) {
      // Coursera answers 200 even for an unknown code, so a missing record is "couldn't confirm",
      // never a definitive NOT_FOUND that would auto-reject the student.
      checks.push({
        checkName: 'credential',
        result: 'UNKNOWN',
        detail: `Coursera's page did not include a certificate record for code ${code}.`,
      });
      return this.result('UNVERIFIABLE', 'UNVERIFIED', checks, pageUrl);
    }

    checks.push({
      checkName: 'credential',
      result: 'PASS',
      detail: page.courseName
        ? `Coursera certificate ${code} for "${page.courseName}".`
        : `Coursera certificate ${code} found.`,
    });
    checks.push({ checkName: 'issuer', result: 'PASS', detail: 'Issued through Coursera.' });
    checks.push({
      checkName: 'subject',
      result: 'PASS',
      detail: `Identity-verified learner name: ${page.learnerName}.`,
    });
    checks.push({
      checkName: 'expiration',
      result: 'SKIP',
      detail: 'Coursera course certificates do not expire.',
    });
    return this.result('VERIFIED', 'CREDENTIAL_PLATFORM_VERIFIED', checks, pageUrl, page);
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
    page: ParsedCourseraPage | null = null,
  ): AdapterVerificationResult {
    return {
      status,
      verificationLevel: level,
      method: 'ISSUER_VERIFICATION_PAGE',
      provider: 'coursera',
      verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : null,
      checks,
      evidence: [
        { evidenceType: 'verification_page', url: evidenceUrl, fileRef: null, metadata: {} },
      ],
      evidenceUrl,
      rawResponse: null,
      subjectName: page?.learnerName ?? null,
      details: page
        ? {
            achievementName: page.courseName,
            issuerName: 'Coursera',
            issuedOn: page.grantedAt,
            expiresOn: null,
          }
        : null,
    };
  }
}

function certificateCode(input: CredentialInput): string | null {
  if (input.type !== 'URL' && input.type !== 'QR_CODE') return null;
  try {
    const url = new URL(input.value);
    if (!COURSERA_HOST_PATTERN.test(url.hostname)) return null;
    return CERTIFICATE_PATH_PATTERN.exec(url.pathname)?.[1]?.toUpperCase() ?? null;
  } catch {
    return null;
  }
}

/**
 * Pulls the record for `code` out of the server-rendered Apollo cache. Returns null unless the
 * page carries both that exact certificate code and an identity-verified learner name.
 */
export function parseCourseraPage(html: string, code: string): ParsedCourseraPage | null {
  const codeAt = html.indexOf(`"certificateCode":"${code}"`);
  if (codeAt === -1) return null;

  const profileJson = /\{"__typename":"AccomplishmentsSignatureTrackProfile"[^{}]*\}/u.exec(
    html,
  )?.[0];
  if (!profileJson) return null;
  let profile: { firstName?: unknown; middleName?: unknown; lastName?: unknown };
  try {
    profile = JSON.parse(profileJson) as typeof profile;
  } catch {
    return null;
  }
  const learnerName = [profile.firstName, profile.middleName, profile.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim())
    .join(' ');
  if (!learnerName) return null;

  const grantedAt = /"grantedAt":(\d{10,})/u.exec(html.slice(codeAt, codeAt + 600))?.[1];
  const title = readMetaContent(html, 'og:title');
  const courseName = title ? /^Completion Certificate for (.+)$/u.exec(title.trim())?.[1] : null;

  return {
    courseName: courseName?.trim() ?? null,
    learnerName,
    grantedAt: grantedAt ? toIsoDate(Number(grantedAt)) : null,
  };
}
