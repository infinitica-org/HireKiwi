/** Canonical, provider-independent types. Adapters translate into this shape; the engine never speaks a provider's native shape outside an adapter. */

export type CredentialType =
  | 'PROFESSIONAL_CERTIFICATION'
  | 'COURSE_COMPLETION'
  | 'PROFESSIONAL_CERTIFICATE'
  | 'DIGITAL_BADGE'
  | 'DEGREE'
  | 'LICENSE'
  | 'TRAINING_CREDENTIAL'
  | 'SKILL_CREDENTIAL'
  | 'UNKNOWN';

export type VerificationLevel =
  | 'UNVERIFIED'
  | 'DOCUMENT_PARSED'
  | 'ISSUER_RECORD_MATCH'
  | 'CREDENTIAL_PLATFORM_VERIFIED'
  | 'CRYPTOGRAPHICALLY_VERIFIED';

export type VerificationStatus =
  | 'VERIFIED'
  | 'VERIFIED_WITH_WARNINGS'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED'
  | 'INVALID'
  | 'NOT_FOUND'
  | 'UNVERIFIABLE'
  | 'DOCUMENT_ONLY'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_ERROR';

export type VerificationMethod =
  | 'CREDLY'
  | 'OPEN_BADGES'
  | 'W3C_VC'
  | 'ISSUER_VERIFICATION_PAGE'
  | 'USER_MEDIATED_PROFILE'
  | 'DOCUMENT_PARSE';

export type IntegrationType =
  | 'OFFICIAL_API'
  | 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT'
  | 'PUBLIC_CREDENTIAL_PLATFORM'
  | 'PUBLIC_ISSUER_VERIFICATION_PAGE'
  | 'USER_MEDIATED'
  | 'UNSUPPORTED';

export type CredentialInputType =
  'URL' | 'QR_CODE' | 'PDF' | 'IMAGE' | 'JSON_CREDENTIAL' | 'ISSUER_AND_ID' | 'PASTED_TEXT';

export interface Issuer {
  id?: string;
  name: string;
  domain: string | null;
  issuerType: string;
  trustStatus: 'TRUSTED' | 'UNVERIFIED' | 'BLOCKED';
}

export interface Subject {
  id?: string;
  name: string;
  email: string | null;
  externalIdentifier: string | null;
}

export interface Achievement {
  id?: string;
  name: string;
  description: string | null;
  credentialType: CredentialType;
  level: string | null;
  skills: string[];
  framework: string | null;
}

export interface VerificationCheck {
  checkName: 'issuer' | 'credential' | 'subject' | 'status' | 'expiration';
  result: 'PASS' | 'FAIL' | 'SKIP' | 'UNKNOWN';
  detail: string | null;
}

export interface Evidence {
  evidenceType: 'badge_url' | 'verification_page' | 'qr_source' | 'document' | 'profile_url';
  url: string | null;
  fileRef: string | null;
  metadata: Record<string, unknown>;
}

export interface CredentialInput {
  type: CredentialInputType;
  /** URL/ID/pasted text as a string; PDF/image as a base64 data buffer the caller already stored. */
  value: string;
  metadata?: Record<string, unknown>;
}

export interface AdapterCapabilities {
  canCheckExpiration: boolean;
  canCheckRevocation: boolean;
  canCheckSubjectIdentity: boolean;
  requiresUserMediation: boolean;
  integrationType: IntegrationType;
}

export interface NormalizedCredential {
  achievement: Partial<Achievement>;
  issuer: Partial<Issuer>;
  subject: Partial<Subject>;
  issueDate: string | null;
  expirationDate: string | null;
  sourceEvidence: Evidence[];
  /** Carried through from input so verify() doesn't need a second resolve. */
  rawInput: CredentialInput;
}

export interface AdapterVerificationResult {
  status: VerificationStatus;
  verificationLevel: VerificationLevel;
  method: VerificationMethod;
  provider: string | null;
  verifiedAt: string | null;
  checks: VerificationCheck[];
  evidence: Evidence[];
  evidenceUrl: string | null;
  rawResponse: Record<string, unknown> | null;
  /** Earner name as the source publishes it, when the adapter can read one. Matching it to an account is the caller's job. */
  subjectName?: string | null;
  /** What the source says the credential is, so a caller can prefill a form instead of asking for it. */
  details?: CredentialDetails | null;
}

export interface CredentialDetails {
  achievementName: string | null;
  /** The organization that awarded it (Cisco, Meta…), not the hosting platform. */
  issuerName: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
}

/**
 * The core engine depends on this interface only — it never imports a
 * provider SDK or knows how Credly/Open Badges/W3C VC work internally.
 */
export interface CredentialVerifier {
  readonly id: string; // e.g. "credly" | "open-badges" | "w3c-vc" | "issuer-page:cisco"
  canHandle(input: CredentialInput): boolean;
  normalize(input: CredentialInput): Promise<NormalizedCredential>;
  verify(credential: NormalizedCredential): Promise<AdapterVerificationResult>;
  getEvidence(credential: NormalizedCredential): Promise<Evidence[]>;
  getCapabilities(): AdapterCapabilities;
}
