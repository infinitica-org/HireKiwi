import { Injectable, Logger } from '@nestjs/common';
import type { CredentialInput, CredentialVerifier } from './types.js';
import { UnverifiableFallbackAdapter } from './adapters/unverifiable-fallback.adapter.js';
import { OpenBadgesAdapter } from './adapters/open-badges.adapter.js';
import { W3cVcAdapter } from './adapters/w3c-vc.adapter.js';
import { CredlyAdapter } from './adapters/credly.adapter.js';
import { GenericIssuerVerifierAdapter } from './adapters/generic-issuer-verifier.adapter.js';

/**
 * The only place that knows the full adapter list. The orchestrator asks
 * this for "the right adapter", never imports a provider adapter directly.
 *
 * Order matters: `resolve()` picks the FIRST adapter whose `canHandle` is
 * true, so OpenBadgesAdapter (narrower: requires the OpenBadgeCredential
 * type) is registered ahead of W3cVcAdapter (broader: any valid W3C VC) so
 * a badge-shaped VC is labeled OPEN_BADGES rather than the generic W3C_VC.
 */
@Injectable()
export class VerifierRegistryService {
  private readonly logger = new Logger(VerifierRegistryService.name);
  private readonly adapters: CredentialVerifier[] = [
    new OpenBadgesAdapter(),
    new W3cVcAdapter(),
    new CredlyAdapter(),
    new GenericIssuerVerifierAdapter(),
  ];
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
