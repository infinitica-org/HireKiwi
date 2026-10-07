import { Injectable } from '@nestjs/common';
import type { CredentialInput } from './types.js';

export interface IssuerDetectionResult {
  /** Best-guess issuer/ecosystem name — used only to pick an adapter, not persisted as fact until the adapter confirms it. */
  candidateIssuer: string | null;
  candidateDomain: string | null;
  signals: string[];
}

const DOMAIN_ISSUER_HINTS: Array<{ domain: string; issuer: string }> = [
  { domain: 'credly.com', issuer: 'Credly' },
  { domain: 'youracclaim.com', issuer: 'Credly' },
  { domain: 'cp.certmetrics.com', issuer: 'Cisco' },
  { domain: 'training.linuxfoundation.org', issuer: 'Linux Foundation' },
  { domain: 'learn.microsoft.com', issuer: 'Microsoft' },
];

/**
 * Cheap, pre-adapter heuristics only: domain match, declared issuer string,
 * or a W3C VC / Open Badges shape in JSON input. This never decides
 * verification outcome — it only narrows which adapters are worth trying.
 */
@Injectable()
export class IssuerDetectorService {
  detect(input: CredentialInput): IssuerDetectionResult {
    const signals: string[] = [];
    let candidateDomain: string | null = null;

    if (input.type === 'URL' || input.type === 'QR_CODE') {
      try {
        candidateDomain = new URL(input.value).hostname.replace(/^www\./, '');
        signals.push(`domain:${candidateDomain}`);
      } catch {
        signals.push('domain:unparseable');
      }
    }

    if (input.type === 'ISSUER_AND_ID' && input.metadata?.issuer) {
      signals.push(`declared_issuer:${String(input.metadata.issuer)}`);
    }

    if (input.type === 'JSON_CREDENTIAL') {
      const shape = this.detectJsonShape(input.value);
      if (shape) signals.push(`json_shape:${shape}`);
    }

    const hint = candidateDomain
      ? DOMAIN_ISSUER_HINTS.find((h) => candidateDomain?.endsWith(h.domain))
      : undefined;

    const declaredIssuer =
      input.type === 'ISSUER_AND_ID' && typeof input.metadata?.issuer === 'string'
        ? (input.metadata.issuer as string)
        : null;

    return {
      candidateIssuer: hint?.issuer ?? declaredIssuer ?? null,
      candidateDomain,
      signals,
    };
  }

  private detectJsonShape(raw: string): 'w3c-vc' | 'open-badges' | null {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const context = parsed['@context'];
      const contextStr = Array.isArray(context) ? context.join(' ') : String(context ?? '');
      if (contextStr.includes('w3.org/2018/credentials') || parsed.proof) return 'w3c-vc';
      if (contextStr.includes('openbadges.org') || parsed.badge || parsed.type === 'Assertion') {
        return 'open-badges';
      }
      return null;
    } catch {
      return null;
    }
  }
}
