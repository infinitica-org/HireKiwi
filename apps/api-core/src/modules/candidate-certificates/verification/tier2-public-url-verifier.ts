import { Injectable } from '@nestjs/common';
import type { TierVerificationResult } from './tier1-issuer-adapter.js';
import { textContainsPersonName } from './person-name-match.js';
import {
  isTrustedVerificationHost,
  TRUSTED_VERIFICATION_HOSTS,
} from './trusted-verification-hosts.js';

export interface Tier2Input {
  verificationUrl?: string | null;
  candidateName?: string | null;
  title: string;
  issuer: string;
  certificateNumber?: string | null;
  rawHtmlOverride?: string | null; // Used for deterministic testing
}

/**
 * Last-resort check of a verification link the engine has no adapter for.
 *
 * Page text is only evidence when the page can't have been written by the student, so this tier
 * auto-verifies solely on hosts in TRUSTED_VERIFICATION_HOSTS. Any other link — including a page
 * the student published themselves saying "Jane Doe, AWS Certified" — goes to manual review and
 * isn't fetched at all.
 */
@Injectable()
export class Tier2PublicUrlVerifier {
  private readonly DEFAULT_TIMEOUT_MS = 5_000;
  /** Overridable in tests; production uses the reviewed list. */
  trustedHosts: readonly string[] = TRUSTED_VERIFICATION_HOSTS;

  async verify(input: Tier2Input): Promise<TierVerificationResult> {
    const url = input.verificationUrl?.trim();
    if (!url) {
      return {
        status: 'UNAVAILABLE',
        tier: 'TIER_2_PUBLIC_URL',
        confidence: 0,
        reason: 'No public verification URL supplied.',
      };
    }

    const parsed = this.parsePublicUrl(url);
    if (!parsed) {
      return {
        status: 'FAILED',
        tier: 'TIER_2_PUBLIC_URL',
        confidence: 1.0,
        reason: `Invalid or untrusted verification URL: ${url}. URL must be an absolute http or https link.`,
        studentMessage: 'This link is not a valid public web address.',
      };
    }

    if (!isTrustedVerificationHost(parsed.hostname, this.trustedHosts)) {
      return {
        status: 'AMBIGUOUS',
        tier: 'TIER_2_PUBLIC_URL',
        confidence: 0.3,
        reason: `${parsed.hostname} is not a recognised verification site, so its page content is not accepted as proof. Flagged for review.`,
        studentMessage: `We can't check ${parsed.hostname} automatically, so we'll review this certificate by hand.`,
        metadata: { url, host: parsed.hostname, trustedHost: false },
      };
    }

    let pageText = '';
    if (input.rawHtmlOverride) {
      pageText = this.stripHtml(input.rawHtmlOverride);
    } else {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.DEFAULT_TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'HireKiwi-Certificate-Verifier/1.0',
            Accept: 'text/html,application/xhtml+xml,text/plain',
          },
          redirect: 'follow',
        });
        clearTimeout(timeoutId);

        // A redirect off the trusted host would make the page text untrusted again.
        const finalHost = response.url ? new URL(response.url).hostname : parsed.hostname;
        if (!isTrustedVerificationHost(finalHost, this.trustedHosts)) {
          return {
            status: 'AMBIGUOUS',
            tier: 'TIER_2_PUBLIC_URL',
            confidence: 0.3,
            reason: `Verification link redirected to untrusted host ${finalHost}. Flagged for review.`,
            metadata: { url, host: finalHost, trustedHost: false },
          };
        }

        if (!response.ok) {
          return {
            status: 'FAILED',
            tier: 'TIER_2_PUBLIC_URL',
            confidence: 0.9,
            reason: `Verification URL fetch failed with HTTP status ${response.status}.`,
            studentMessage: `${parsed.hostname} could not find this certificate (error ${response.status}).`,
          };
        }

        const html = await response.text();
        pageText = this.stripHtml(html);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          status: 'AMBIGUOUS',
          tier: 'TIER_2_PUBLIC_URL',
          confidence: 0.2,
          reason: `Failed to fetch public verification URL: ${message}.`,
        };
      }
    }

    if (!pageText || pageText.length < 20) {
      return {
        status: 'AMBIGUOUS',
        tier: 'TIER_2_PUBLIC_URL',
        confidence: 0.3,
        reason: 'Verification page retrieved empty or insufficient content.',
      };
    }

    const normPageText = pageText.toLowerCase();
    const normTitle = input.title.toLowerCase().trim();
    const normIssuer = input.issuer.toLowerCase().trim();
    const normCertNumber = input.certificateNumber
      ? input.certificateNumber.toLowerCase().trim()
      : '';

    const candidateMatch = input.candidateName
      ? textContainsPersonName(pageText, input.candidateName)
      : false;
    const certNumberMatch = normCertNumber ? normPageText.includes(normCertNumber) : false;
    const titleMatch = normPageText.includes(normTitle);
    const issuerMatch = normPageText.includes(normIssuer);
    const matches = { url, candidateMatch, certNumberMatch, titleMatch, issuerMatch };

    // Strict positive match: must match candidate name AND (cert number OR title/issuer)
    if (candidateMatch && (certNumberMatch || titleMatch || issuerMatch)) {
      return {
        status: 'VERIFIED',
        tier: 'TIER_2_PUBLIC_URL',
        confidence: certNumberMatch ? 0.95 : 0.85,
        reason: `Verification page on ${parsed.hostname} names "${input.candidateName}" and matches the certificate details.`,
        studentMessage: `Verified on ${parsed.hostname}.`,
        metadata: matches,
      };
    }

    return {
      status: 'AMBIGUOUS',
      tier: 'TIER_2_PUBLIC_URL',
      confidence: 0.5,
      reason: `Verification page retrieved but failed strict matching (Candidate match: ${candidateMatch}, Cert# match: ${certNumberMatch}, Title match: ${titleMatch}). Flagged for review.`,
      studentMessage: `The page on ${parsed.hostname} doesn't clearly show your name and this certificate, so we'll review it by hand.`,
      metadata: matches,
    };
  }

  private parsePublicUrl(url: string): URL | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      // Basic SSRF defense: block localhost & private IP addresses
      const hostname = parsed.hostname.toLowerCase();
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
      .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
