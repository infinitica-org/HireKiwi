import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { notFound } from 'next/navigation';
import { HireKiwiApiError } from '@hirekiwi/api-client';
import type { PublicVerificationDto } from '@hirekiwi/contracts';
import Page from './page';

const mockVerify = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    certificates: {
      verify: (...args: unknown[]) => mockVerify(...args),
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

const mockValidCert: PublicVerificationDto = {
  certificateId: '11111111-1111-4111-8111-111111111111',
  candidateName: 'Aditya Sharma',
  trackName: 'Full Stack Engineering',
  issuedDate: '2026-09-29',
  highestLevelCleared: 3,
  headlineTier: 'GOLD',
  headlineTierLabel: 'Ready Now',
  tierTrail: [
    {
      levelNumber: 1,
      levelName: 'Foundation Knowledge',
      tier: 'GOLD',
      borderline: false,
      competenciesAssessed: ['Data Structures', 'TypeScript Core'],
    },
    {
      levelNumber: 2,
      levelName: 'Applied Execution',
      tier: 'GOLD',
      borderline: false,
      competenciesAssessed: ['REST API Development', 'Database Modeling'],
    },
    {
      levelNumber: 3,
      levelName: 'Communication & Domain Judgment',
      tier: 'SILVER',
      borderline: true,
      competenciesAssessed: ['System Architecture', 'Trade-off Analysis'],
    },
  ],
  confidenceNote: {
    trackCode: 'TECH_FULLSTACK',
    levelNumber: 3,
    calibrationStatus: 'PANEL_CALIBRATED',
    sampleSize: 120,
    reliabilityCoefficient: 0.85,
    panelistCount: 5,
    calibrationEmployers: ['Google', 'Microsoft', 'Amazon', 'Flipkart'],
    noteText: 'Calibrated ±1σ panel cut score by industry engineering leaders',
    downgraded: false,
    downgradeReason: null,
    placementCyclesObserved: 3,
    generatedAt: '2026-09-29T10:00:00.000Z',
  },
  calibrationEmployers: ['Google', 'Microsoft', 'Amazon', 'Flipkart'],
  methodologyUrl: 'https://hirekiwi.infinitica.io/methodology',
  signatureValid: true,
  status: 'ISSUED',
};

describe('Public Certificate Verification Page (/cert/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Test 1 — Valid credential: renders candidate name, track, headline tier, all five Tier Trail levels, confidence note, and employer calibration credits', async () => {
    mockVerify.mockResolvedValueOnce(mockValidCert);

    const jsx = await Page({
      params: Promise.resolve({ id: mockValidCert.certificateId }),
      searchParams: Promise.resolve({ sig: 'valid-sig-123' }),
    });
    render(jsx);

    // Candidate details
    expect(screen.getByText('Aditya Sharma')).toBeDefined();
    expect(screen.getByText('Full Stack Engineering')).toBeDefined();
    expect(screen.getAllByText(/Ready Now/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Level 3 of 5')).toBeDefined();
    expect(screen.getByText('2026-09-29')).toBeDefined();
    expect(screen.getByText(/Verified & Active/i)).toBeDefined();

    // 5-Level Tier Trail elements
    expect(screen.getByText('5-Level Tier Trail Progression')).toBeDefined();
    expect(screen.getAllByText('Foundation Knowledge').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Applied Execution').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Communication & Domain Judgment').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Verification Defense').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Capstone Project').length).toBeGreaterThanOrEqual(1);

    // Competencies and Borderline tag
    expect(screen.getByText('TypeScript Core')).toBeDefined();
    expect(screen.getByText('System Architecture')).toBeDefined();
    expect(screen.getByText('Borderline')).toBeDefined();

    // Confidence Note and Calibration credits
    expect(screen.getByText('Confidence Note')).toBeDefined();
    expect(
      screen.getByText('Calibrated ±1σ panel cut score by industry engineering leaders'),
    ).toBeDefined();
    expect(screen.getByText('Google')).toBeDefined();
    expect(screen.getByText('Microsoft')).toBeDefined();
    expect(screen.getByText('Amazon')).toBeDefined();
    expect(screen.getByText('Flipkart')).toBeDefined();
    expect(screen.getByText('View Assessment Methodology →')).toBeDefined();
  });

  it('Test 2 — Invalid signature / Tampered state: displays prominent cryptographic tamper warning', async () => {
    mockVerify.mockResolvedValueOnce({
      ...mockValidCert,
      signatureValid: false,
    });

    const jsx = await Page({
      params: Promise.resolve({ id: mockValidCert.certificateId }),
      searchParams: Promise.resolve({ sig: 'tampered-or-invalid-sig' }),
    });
    render(jsx);

    expect(screen.getByText('Cryptographic Tamper Warning')).toBeDefined();
    expect(screen.getByText(/CRYPTOGRAPHIC VERIFICATION FAILED/i)).toBeDefined();
    expect(
      screen.getByText(
        /This credential could not be cryptographically verified. The certificate ID or verification signature may have been modified/i,
      ),
    ).toBeDefined();
    expect(screen.getByText('Tampered / Invalid')).toBeDefined();
    expect(screen.queryByText(/All integrity checks passed/i)).toBeNull();
  });

  it('Test 3 — Revoked certificate: displays revoked alert state', async () => {
    mockVerify.mockResolvedValueOnce({
      ...mockValidCert,
      signatureValid: true,
      status: 'REVOKED',
    });

    const jsx = await Page({
      params: Promise.resolve({ id: mockValidCert.certificateId }),
      searchParams: Promise.resolve({ sig: 'sig-123' }),
    });
    render(jsx);

    expect(screen.getByText('Certificate Revoked')).toBeDefined();
    expect(
      screen.getByText(
        'This credential was revoked by the issuing authority and is no longer valid.',
      ),
    ).toBeDefined();
  });

  it('Test 4 — Superseded certificate: displays superseded alert state', async () => {
    mockVerify.mockResolvedValueOnce({
      ...mockValidCert,
      signatureValid: true,
      status: 'SUPERSEDED',
    });

    const jsx = await Page({
      params: Promise.resolve({ id: mockValidCert.certificateId }),
      searchParams: Promise.resolve({ sig: 'sig-123' }),
    });
    render(jsx);

    expect(screen.getByText('Certificate Superseded')).toBeDefined();
    expect(
      screen.getByText(
        'This credential has been superseded by a higher level or newer assessment attempt.',
      ),
    ).toBeDefined();
  });

  it('Test 5 — Not found: triggers Next.js notFound() on 404 API error', async () => {
    mockVerify.mockRejectedValueOnce(
      new HireKiwiApiError({
        error: 'not_found',
        message: 'Certificate not found.',
        statusCode: 404,
      }),
    );

    await Page({
      params: Promise.resolve({ id: 'non-existent-id' }),
      searchParams: Promise.resolve({}),
    });

    expect(notFound).toHaveBeenCalled();
  });

  it('Test 6 — Signature propagation: passes id and sig query param to API client', async () => {
    mockVerify.mockResolvedValueOnce(mockValidCert);

    const testId = '11111111-1111-4111-8111-111111111111';
    const testSig = '7f9c2d1b8e4a5f6e3c2d1b8e4a5f6e3c2d1b8e4a5f6e3c2d1b8e4a5f6e3c2d1b';

    await Page({
      params: Promise.resolve({ id: testId }),
      searchParams: Promise.resolve({ sig: testSig }),
    });

    expect(mockVerify).toHaveBeenCalledWith(testId, testSig);
  });

  it('Test 7 — Print behavior: navigation and action buttons have print:hidden styling', async () => {
    mockVerify.mockResolvedValueOnce(mockValidCert);

    const jsx = await Page({
      params: Promise.resolve({ id: mockValidCert.certificateId }),
      searchParams: Promise.resolve({}),
    });
    const { container } = render(jsx);

    const searchButton = screen.getByRole('button', { name: /← Return to Search/i });
    expect(searchButton.className).toContain('print:hidden');

    const printButton = screen.getByRole('button', { name: /Print \/ Save PDF/i });
    expect(printButton.className).toContain('print:hidden');

    const cards = container.querySelectorAll('.print\\:break-inside-avoid');
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
