import { Injectable, Logger } from '@nestjs/common';
import type { CredentialInput, CredentialVerifier } from './types.js';
import { UnverifiableFallbackAdapter } from './adapters/unverifiable-fallback.adapter.js';

/**
 * The only place that knows the full adapter list. The orchestrator asks
 * this for "the right adapter", never imports a provider adapter directly.
 *
 * Stage 5 adds real adapters (Credly, Open Badges, W3C VC, a
 * GenericIssuerVerifier config for Cisco/Linux Foundation). This stage
 * wires the registry + a safe fallback so the pipeline is exercisable
 * end-to-end before any provider-specific code lands.
 */
@Injectable()
export class VerifierRegistryService {
  private readonly logger = new Logger(VerifierRegistryService.name);
  private readonly adapters: CredentialVerifier[] = [];
  private readonly fallback = new UnverifiableFallbackAdapter();

  register(adapter: CredentialVerifier): void {
    this.adapters.push(adapter);
  }

  resolve(input: CredentialInput): CredentialVerifier {
    const match = this.adapters.find((adapter) => adapter.canHandle(input));
    if (!match) {
      this.logger.debug(
        `No adapter claimed input type ${input.type}; falling back to UNVERIFIABLE.`,
      );
      return this.fallback;
    }
    return match;
  }

  list(): ReadonlyArray<Pick<CredentialVerifier, 'id'>> {
    return [...this.adapters.map((a) => ({ id: a.id })), { id: this.fallback.id }];
  }
}
