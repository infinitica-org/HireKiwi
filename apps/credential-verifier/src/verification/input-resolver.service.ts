import { Injectable } from '@nestjs/common';
import type { CredentialInput, CredentialInputType } from './types.js';

export interface RawVerificationRequest {
  /** Caller states the shape explicitly — the frontend/calling service already knows what it collected. */
  inputType: CredentialInputType;
  value: string;
  metadata?: Record<string, unknown>;
}

/**
 * Resolves raw request input into the canonical CredentialInput shape and
 * derives a stable dedupe/cache key. Does NOT fetch, parse, or verify
 * anything — that is the adapter's job once the registry picks one.
 */
@Injectable()
export class InputResolverService {
  resolve(request: RawVerificationRequest): CredentialInput {
    return {
      type: request.inputType,
      value: this.normalizeValue(request.inputType, request.value),
      metadata: request.metadata,
    };
  }

  /** Stable key for dedupe/caching — same credential URL/ID should not be re-verified on every request. */
  sourceIdentifier(input: CredentialInput): string {
    return `${input.type}:${input.value}`;
  }

  private normalizeValue(type: CredentialInputType, value: string): string {
    if (type === 'URL' || type === 'QR_CODE') {
      try {
        const url = new URL(value.trim());
        return url.toString();
      } catch {
        return value.trim();
      }
    }
    return value.trim();
  }
}
