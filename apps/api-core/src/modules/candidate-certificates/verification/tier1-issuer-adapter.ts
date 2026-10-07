export type TierVerificationStatus = 'VERIFIED' | 'FAILED' | 'AMBIGUOUS' | 'UNAVAILABLE';

export interface TierVerificationResult {
  status: TierVerificationStatus;
  tier: 'TIER_1_ISSUER_API' | 'TIER_2_PUBLIC_URL' | 'TIER_3_OCR_HEURISTIC';
  confidence: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface Tier1Input {
  title: string;
  issuer: string;
  certificateNumber?: string | null;
  verificationUrl?: string | null;
  candidateName?: string | null;
}

export interface Tier1IssuerAdapter {
  readonly name: string;
  supports(issuer: string): boolean;
  verify(input: Tier1Input): Promise<TierVerificationResult>;
}
