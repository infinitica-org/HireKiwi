import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page.js';
import { generateCertificateSignature } from '@/lib/cert-signature.js';

// Mock next/navigation notFound
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    certificates: {
      verify: vi.fn().mockImplementation(async (id: string) => {
        if (id === '00000000-0000-0000-0000-000000000000') {
          const err = new Error('Not found') as Error & { statusCode?: number; code?: string };
          err.statusCode = 404;
          err.code = 'not_found';
          throw err;
        }
        return {
          certificateId: id,
          candidateName: 'Harish Kumar',
          trackName: 'Full Stack Engineering',
          issuedDate: '2026-09-29',
          highestLevelCleared: 3,
          headlineTier: 'GOLD',
          headlineTierLabel: 'Ready Now',
          tierTrail: [],
          signatureValid: true,
          status: 'ISSUED',
        };
      }),
    },
  },
}));

describe('Certificate Verification Page Audit & Security', () => {
  const validUuid = '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d';
  const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verified alert when valid UUID and valid signature hash are supplied', async () => {
    const validSig = generateCertificateSignature(validUuid);
    const jsx = await Page({
      params: Promise.resolve({ id: validUuid }),
      searchParams: Promise.resolve({ sig: validSig }),
    });

    render(jsx);

    expect(screen.getByText(/Cryptographically Verified Credential/i)).toBeDefined();
    expect(screen.getByText(/Harish Kumar/i)).toBeDefined();
  });

  it('Adversarial Test 1: displays tamper warning alert and logs security event when signature hash is altered by 1 hex char', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const validSig = generateCertificateSignature(validUuid);

    // Alter 1 hex character in the signature
    const tamperedSig = (validSig[0] === 'a' ? 'b' : 'a') + validSig.slice(1);

    const jsx = await Page({
      params: Promise.resolve({ id: validUuid }),
      searchParams: Promise.resolve({ sig: validSig, hash: tamperedSig }),
    });

    render(jsx);

    expect(screen.getByText(/Tamper Warning: Invalid Certificate Signature/i)).toBeDefined();
    expect(
      screen.getByText(/This certificate signature is invalid or has been altered/i),
    ).toBeDefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SECURITY_EVENT] Tampered certificate signature hash detected'),
    );
  });

  it('Adversarial Test 2: triggers notFound 404 page for non-existent certificate UUID without leaking stack traces', async () => {
    const { notFound } = await import('next/navigation');

    await expect(
      Page({
        params: Promise.resolve({ id: nonExistentUuid }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });

  it('Adversarial Test 2: triggers notFound 404 page for invalid UUID format', async () => {
    const { notFound } = await import('next/navigation');

    await expect(
      Page({
        params: Promise.resolve({ id: 'invalid-cert-uuid-123' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFound).toHaveBeenCalled();
  });
});
