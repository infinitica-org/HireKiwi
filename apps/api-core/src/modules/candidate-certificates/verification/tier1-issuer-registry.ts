import { Inject, Injectable } from '@nestjs/common';
import { CredentialVerifierClientAdapter } from './credential-verifier-client.js';
import type {
  Tier1Input,
  Tier1IssuerAdapter,
  TierVerificationResult,
} from './tier1-issuer-adapter.js';

@Injectable()
export class Tier1IssuerRegistry {
  private readonly adapters: Tier1IssuerAdapter[];

  constructor(
    @Inject(CredentialVerifierClientAdapter) credentialVerifier: CredentialVerifierClientAdapter,
  ) {
    this.adapters = [credentialVerifier];
  }

  getAdapter(issuer: string): Tier1IssuerAdapter | null {
    if (!issuer || typeof issuer !== 'string') return null;
    return this.adapters.find((adapter) => adapter.supports(issuer)) ?? null;
  }

  async verify(input: Tier1Input): Promise<TierVerificationResult> {
    const adapter = this.getAdapter(input.issuer);
    if (!adapter) {
      return {
        status: 'UNAVAILABLE',
        tier: 'TIER_1_ISSUER_API',
        confidence: 0,
        reason: `No supported Tier 1 issuer adapter found for issuer "${input.issuer}".`,
      };
    }

    return adapter.verify(input);
  }
}
