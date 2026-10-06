import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { Tier1IssuerRegistry } from './tier1-issuer-registry.js';
import { CredentialVerifierClientAdapter } from './credential-verifier-client.js';
import { Tier2PublicUrlVerifier } from './tier2-public-url-verifier.js';
import { Tier3OcrVerifier } from './tier3-ocr-verifier.js';
import { CertificateSourceVerificationService } from './certificate-source-verification.service.js';

describe('Tier 1 Issuer Registry (bridges to the standalone credential-verifier engine)', () => {
  let registry: Tier1IssuerRegistry;

  beforeEach(() => {
    registry = new Tier1IssuerRegistry(new CredentialVerifierClientAdapter());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes every issuer through the single CredentialVerifier adapter', () => {
    const adapter = registry.getAdapter('Amazon Web Services');
    expect(adapter).not.toBeNull();
    expect(adapter?.name).toBe('CredentialVerifier');
    expect(registry.getAdapter('Any Other Issuer')?.name).toBe('CredentialVerifier');
  });

  it('returns UNAVAILABLE for an empty issuer string', () => {
    expect(registry.getAdapter('')).toBeNull();
  });

  it('returns UNAVAILABLE without calling the engine when there is nothing to route (no URL or certificate number)', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await registry.verify({
      title: 'Local Academy Certificate',
      issuer: 'Unregistered Local Academy',
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.tier).toBe('TIER_1_ISSUER_API');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns UNAVAILABLE (never throws) when the engine is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));

    const result = await registry.verify({
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      certificateNumber: 'AWS-12345',
    });

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.reason).toContain('Could not reach the verification engine');
  });

  it('maps a VERIFIED engine result to VERIFIED', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ verificationId: 'v-1' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              verificationId: 'v-1',
              credentialId: 'c-1',
              status: 'VERIFIED',
              verificationLevel: 'CRYPTOGRAPHICALLY_VERIFIED',
              method: 'W3C_VC',
              provider: 'w3c-vc:did-key-ed25519',
              verifiedAt: new Date().toISOString(),
              checks: [{ checkName: 'issuer', result: 'PASS', detail: 'Signature verified.' }],
              evidence: [],
              evidenceUrl: null,
            }),
        }),
    );

    const result = await registry.verify({
      title: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      certificateNumber: 'AWS-12345',
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.confidence).toBe(0.99);
  });

  it('maps an EXPIRED engine result to FAILED', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ verificationId: 'v-2' }) })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              verificationId: 'v-2',
              credentialId: 'c-2',
              status: 'EXPIRED',
              verificationLevel: 'ISSUER_RECORD_MATCH',
              method: 'OPEN_BADGES',
              provider: 'open-badges-2.0',
              verifiedAt: null,
              checks: [{ checkName: 'expiration', result: 'FAIL', detail: 'Expired 2020-01-01.' }],
              evidence: [],
              evidenceUrl: null,
            }),
        }),
    );

    const result = await registry.verify({
      title: 'Some Badge',
      issuer: 'Some Issuer',
      certificateNumber: 'ID-1',
    });

    expect(result.status).toBe('FAILED');
  });
});

describe('Tier 2 Public URL Verifier', () => {
  let verifier: Tier2PublicUrlVerifier;

  beforeEach(() => {
    verifier = new Tier2PublicUrlVerifier();
  });

  it('returns UNAVAILABLE when no URL is supplied', async () => {
    const result = await verifier.verify({
      title: 'AWS Solutions Architect',
      issuer: 'AWS',
    });
    expect(result.status).toBe('UNAVAILABLE');
  });

  it('rejects invalid or unsafe protocols (SSRF protection)', async () => {
    const result = await verifier.verify({
      verificationUrl: 'http://localhost/cert-secret',
      title: 'AWS Solutions Architect',
      issuer: 'AWS',
    });
    expect(result.status).toBe('FAILED');
    expect(result.reason).toContain('Invalid or untrusted verification URL');
  });

  it('verifies successfully when candidate name and certificate details are found in page HTML', async () => {
    const rawHtmlOverride = `
      <html>
        <body>
          <h1>Certificate of Completion</h1>
          <p>This certifies that <strong>Jane Manager</strong> has successfully earned</p>
          <p>AWS Certified Solutions Architect - Credential AWS-987654</p>
        </body>
      </html>
    `;

    const result = await verifier.verify({
      verificationUrl: 'https://aws.amazon.com/verify/987654',
      candidateName: 'Jane Manager',
      title: 'AWS Certified Solutions Architect',
      issuer: 'AWS',
      certificateNumber: 'AWS-987654',
      rawHtmlOverride,
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('flags as AMBIGUOUS when page HTML exists but candidate name does not match', async () => {
    const rawHtmlOverride = `
      <html>
        <body>
          <p>Certificate issued to John Smith for AWS Certified Solutions Architect</p>
        </body>
      </html>
    `;

    const result = await verifier.verify({
      verificationUrl: 'https://aws.amazon.com/verify/987654',
      candidateName: 'Jane Manager',
      title: 'AWS Certified Solutions Architect',
      issuer: 'AWS',
      rawHtmlOverride,
    });

    expect(result.status).toBe('AMBIGUOUS');
    expect(result.confidence).toBeLessThan(0.85);
  });
});

describe('Tier 3 OCR & Heuristic Verifier', () => {
  let verifier: Tier3OcrVerifier;

  beforeEach(() => {
    verifier = new Tier3OcrVerifier();
  });

  it('returns UNAVAILABLE when no file URL or text override is present', async () => {
    const result = await verifier.verify({
      title: 'Python Specialist',
      issuer: 'Coursera',
    });
    expect(result.status).toBe('UNAVAILABLE');
  });

  it('verifies when candidate name and certificate title match extracted text with high confidence', async () => {
    const extractedTextOverride =
      'Certificate of Completion awarded to Jane Manager for Python Specialist by Coursera.';

    const result = await verifier.verify({
      candidateName: 'Jane Manager',
      title: 'Python Specialist',
      issuer: 'Coursera',
      extractedTextOverride,
    });

    expect(result.status).toBe('VERIFIED');
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
  });

  it('fails completely when none of candidate name, title, issuer match OCR text', async () => {
    const extractedTextOverride = 'Completely unrelated invoice document from Acme Supplies Inc.';

    const result = await verifier.verify({
      candidateName: 'Jane Manager',
      title: 'Python Specialist',
      issuer: 'Coursera',
      extractedTextOverride,
    });

    expect(result.status).toBe('FAILED');
  });

  it('flags as AMBIGUOUS for partial matches without full candidate name confirmation', async () => {
    const extractedTextOverride = 'Python Specialist Coursera completion badge';

    const result = await verifier.verify({
      candidateName: 'Jane Manager',
      title: 'Python Specialist',
      issuer: 'Coursera',
      extractedTextOverride,
    });

    expect(result.status).toBe('AMBIGUOUS');
    expect(result.confidence).toBeLessThan(0.85);
  });
});

describe('CertificateSourceVerificationService Orchestrator', () => {
  it('updates database to SOURCE_VERIFIED when Tier 2 succeeds', async () => {
    const mockPrisma = {
      candidateCertificate: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'cert-1',
          title: 'AWS Certified Solutions Architect',
          issuer: 'Amazon Web Services',
          certificateNumber: 'AWS-100',
          verificationUrl: 'https://aws.amazon.com/verify/100',
          candidate: { fullName: 'Alice Smith' },
        }),
        update: vi.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'cert-1',
            sourceStatus: data.sourceStatus,
            status: data.status,
          }),
        ),
      },
      certificateVerificationEvent: {
        create: vi.fn().mockResolvedValue({ id: 'event-1' }),
      },
    };

    const mockTier1 = new Tier1IssuerRegistry(new CredentialVerifierClientAdapter());
    const mockTier2 = new Tier2PublicUrlVerifier();
    const mockTier3 = new Tier3OcrVerifier();

    // Tier 1 is a real HTTP-backed adapter — stub it out here so this test
    // exercises only what it's named for (the Tier 2 success path), not a
    // real network call to the verification engine.
    vi.spyOn(mockTier1, 'verify').mockResolvedValue({
      status: 'UNAVAILABLE',
      tier: 'TIER_1_ISSUER_API',
      confidence: 0,
      reason: 'stubbed for this test',
    });

    vi.spyOn(mockTier2, 'verify').mockResolvedValue({
      status: 'VERIFIED',
      tier: 'TIER_2_PUBLIC_URL',
      confidence: 0.95,
      reason: 'Verified public page',
    });

    const service = new CertificateSourceVerificationService(
      mockPrisma as any,
      mockTier1,
      mockTier2,
      mockTier3,
    );

    const res = await service.runVerification('cert-1');
    expect(res.sourceStatus).toBe('source_verified');
    expect(res.status).toBe('IN_VERIFICATION');
    expect(mockPrisma.candidateCertificate.update).toHaveBeenCalledWith({
      where: { id: 'cert-1' },
      data: { sourceStatus: 'source_verified', status: 'IN_VERIFICATION' },
    });
  });
});
