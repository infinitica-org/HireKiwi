export type TierVerificationStatus = 'VERIFIED' | 'FAILED' | 'AMBIGUOUS' | 'UNAVAILABLE';

export interface TierVerificationResult {
  status: TierVerificationStatus;
  tier: 'TIER_1_ISSUER_API' | 'TIER_2_PUBLIC_URL' | 'TIER_3_OCR_HEURISTIC';
  confidence: number;
  reason: string;
  metadata?: Record<string, unknown>;
  /** Plain-language explanation shown to the student; `reason` stays the technical audit line. */
  studentMessage?: string;
}

export interface Tier1Input {
  title: string;
  issuer: string;
  certificateNumber?: string | null;
  verificationUrl?: string | null;
  candidateName?: string | null;
  /** Contents of an uploaded Open Badges / W3C Verifiable Credential JSON file. */
  credentialJson?: string | null;
  /** Ask the engine to re-run instead of answering from its cache. */
  refresh?: boolean;
}

export interface Tier1IssuerAdapter {
  readonly name: string;
  supports(issuer: string): boolean;
  verify(input: Tier1Input): Promise<TierVerificationResult>;
}
