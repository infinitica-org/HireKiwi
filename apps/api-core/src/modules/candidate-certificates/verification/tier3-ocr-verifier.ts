import { Inject, Injectable, Optional } from '@nestjs/common';
import { StorageService } from '../../../platform/storage/storage.service.js';
import type { TierVerificationResult } from './tier1-issuer-adapter.js';
import { CredentialVerifierClientAdapter } from './credential-verifier-client.js';
import {
  extractFileEvidence,
  linksFromText,
  type FileEvidence,
  type FoundLink,
  type FoundLinkSource,
} from './certificate-file-evidence.js';
import { textContainsPersonName } from './person-name-match.js';

export interface Tier3Input {
  certificateFileUrl?: string | null;
  fileMimeType?: string | null;
  candidateName?: string | null;
  title: string;
  issuer: string;
  certificateNumber?: string | null;
  verificationUrl?: string | null;
  extractedTextOverride?: string | null; // For unit test overriding
}

const SOURCE_LABELS: Record<FoundLinkSource, string> = {
  'qr-code': 'QR code',
  'pdf-link': 'link',
  'printed-text': 'printed verification link',
  'roll-number': 'roll number',
};

/** Links tried against the engine per file: enough for "QR + printed copy", bounded for latency. */
const MAX_LINKS_TRIED = 3;

/**
 * Uploaded certificate files. A document a student uploads proves nothing by its own text — it
 * is trivially edited — so this tier only ever verifies through the issuer: it pulls the
 * verification link out of the file (QR code, PDF link, printed URL, NPTEL roll number) and runs
 * it through the engine with the same identity check as a pasted link. Without such a link the
 * certificate goes to manual review; the text heuristics only annotate it for the reviewer.
 */
@Injectable()
export class Tier3OcrVerifier {
  constructor(
    @Optional() @Inject(StorageService) private readonly storageService?: StorageService,
    @Optional()
    @Inject(CredentialVerifierClientAdapter)
    private readonly engine?: CredentialVerifierClientAdapter,
  ) {}

  async verify(input: Tier3Input): Promise<TierVerificationResult> {
    const fileUrl = input.certificateFileUrl?.trim();
    if (!fileUrl && !input.extractedTextOverride) {
      return {
        status: 'UNAVAILABLE',
        tier: 'TIER_3_OCR_HEURISTIC',
        confidence: 0,
        reason: 'No certificate file URL attached for OCR analysis.',
      };
    }

    let evidence: FileEvidence;
    if (input.extractedTextOverride) {
      const text = input.extractedTextOverride.trim();
      evidence = { text, links: linksFromText(text) };
    } else {
      try {
        const buffer = await this.retrieveBuffer(fileUrl as string);
        if (input.fileMimeType === 'application/json') {
          return await this.verifyCredentialJson(buffer.toString('utf8'), input);
        }
        evidence = await extractFileEvidence(buffer, input.fileMimeType ?? 'application/pdf');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return this.review(
          `Could not read the certificate file: ${message}.`,
          "We couldn't read this file, so we'll review it by hand. A clear PDF or the certificate's verification link speeds this up.",
          {},
        );
      }
    }

    const hints = this.textHints(evidence.text, input);
    let unverifiable: FoundLink | null = null;
    for (const link of evidence.links.slice(0, MAX_LINKS_TRIED)) {
      const result = this.engine
        ? await this.engine.verify({
            title: input.title,
            issuer: input.issuer,
            verificationUrl: link.url,
            candidateName: input.candidateName,
          })
        : null;
      if (!result || result.status === 'UNAVAILABLE') {
        unverifiable ??= link;
        continue;
      }
      const via = SOURCE_LABELS[link.source];
      return {
        ...result,
        tier: 'TIER_3_OCR_HEURISTIC',
        reason: `Link from the uploaded file's ${via} (${link.url}): ${result.reason}`,
        studentMessage:
          result.status === 'VERIFIED'
            ? `We found the ${via} on your certificate and verified it. ${result.studentMessage ?? ''}`.trim()
            : result.studentMessage,
        metadata: {
          ...(result.metadata ?? {}),
          discoveredUrl: link.url,
          discoveredVia: link.source,
          ...hints,
        },
      };
    }

    if (unverifiable) {
      const host = new URL(unverifiable.url).hostname;
      return this.review(
        `Found ${unverifiable.url} in the uploaded file's ${SOURCE_LABELS[unverifiable.source]}, but no automated check covers it. Flagged for review.`,
        `We found a link to ${host} on your certificate but can't check that site automatically, so we'll review it by hand.`,
        { discoveredUrl: unverifiable.url, discoveredVia: unverifiable.source, ...hints },
      );
    }

    return this.review(
      `No verification link or QR code found in the uploaded file (candidate name in text: ${hints.candidateMatch}, title: ${hints.titleMatch}). Flagged for review.`,
      "We couldn't find a verification link or QR code on this certificate, so we'll review it by hand. Adding its verification link speeds this up.",
      hints,
    );
  }

  /** An Open Badges / W3C Verifiable Credential file is itself checkable: hand it to the engine. */
  private async verifyCredentialJson(
    json: string,
    input: Tier3Input,
  ): Promise<TierVerificationResult> {
    const result = this.engine
      ? await this.engine.verify({
          title: input.title,
          issuer: input.issuer,
          credentialJson: json,
          candidateName: input.candidateName,
        })
      : null;
    if (!result || result.status === 'UNAVAILABLE') {
      return this.review(
        `Uploaded credential JSON could not be verified automatically${result ? `: ${result.reason}` : '.'}`,
        "We couldn't check this credential file automatically, so we'll review it by hand.",
        {},
      );
    }
    return {
      ...result,
      tier: 'TIER_3_OCR_HEURISTIC',
      reason: `Uploaded credential file: ${result.reason}`,
    };
  }

  /** What the document's own text says — shown to reviewers, never used to decide. */
  private textHints(text: string, input: Tier3Input) {
    const normText = text.toLowerCase();
    return {
      candidateMatch: input.candidateName
        ? textContainsPersonName(text, input.candidateName)
        : false,
      titleMatch: normText.includes(input.title.toLowerCase().trim()),
      issuerMatch: normText.includes(input.issuer.toLowerCase().trim()),
      certNumberMatch: input.certificateNumber
        ? normText.includes(input.certificateNumber.toLowerCase().trim())
        : false,
    };
  }

  private review(
    reason: string,
    studentMessage: string,
    metadata: Record<string, unknown>,
  ): TierVerificationResult {
    return {
      status: 'AMBIGUOUS',
      tier: 'TIER_3_OCR_HEURISTIC',
      confidence: 0.3,
      reason,
      studentMessage,
      metadata,
    };
  }

  private async retrieveBuffer(fileUrl: string): Promise<Buffer> {
    if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(',');
      const base64Data = parts[1];
      if (!base64Data) throw new Error('Malformed data URI');
      return Buffer.from(base64Data, 'base64');
    }

    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuf = await res.arrayBuffer();
      return Buffer.from(arrayBuf);
    }

    if (this.storageService) {
      try {
        return await this.storageService.getObjectBuffer(fileUrl);
      } catch {
        // Fall through to fs
      }
    }

    const fs = await import('node:fs/promises');
    return fs.readFile(fileUrl);
  }
}
