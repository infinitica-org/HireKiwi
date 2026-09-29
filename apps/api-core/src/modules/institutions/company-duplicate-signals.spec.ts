import { describe, expect, it, vi } from 'vitest';
import { findCompanyDuplicateSignals, registrableRoot } from './company-duplicate-signals.js';

const ACME_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_ID = '55555555-5555-4555-8555-555555555555';

describe('registrableRoot (S6-VV-110)', () => {
  it.each([
    ['acme.com', 'acme'],
    ['www.acme.in', 'acme'],
    ['careers.acme.co.in', 'acme'],
    ['acme.co.uk', 'acme'],
    ['ab.com', null],
    ['localhost', null],
    [null, null],
  ])('%s -> %s', (host, root) => {
    expect(registrableRoot(host)).toBe(root);
  });
});

describe('findCompanyDuplicateSignals (S6-VV-110)', () => {
  function prismaWith(companies: object[], placement: object | null = null) {
    return {
      company: { findMany: vi.fn().mockResolvedValue(companies) },
      placementEmployer: { findFirst: vi.fn().mockResolvedValue(placement) },
    };
  }

  it('matches a name that differs only by legal suffix and punctuation', async () => {
    const prisma = prismaWith([
      { id: ACME_ID, name: 'Acme Labs Limited', website: null, verificationStatus: 'APPROVED' },
      { id: OTHER_ID, name: 'Acme Labsworks', website: null, verificationStatus: 'PENDING' },
    ]);

    const signals = await findCompanyDuplicateSignals(prisma as never, {
      companyId: null,
      displayName: 'Acme Labs',
      legalName: 'Acme Labs Pvt. Ltd.',
      website: null,
    });

    expect(signals).toEqual([
      {
        kind: 'NAME_MATCH',
        matchedCompanyId: ACME_ID,
        matchedName: 'Acme Labs Limited',
        matchedStatus: 'APPROVED',
      },
    ]);
  });

  it('matches the same brand on another TLD but not a different brand containing it', async () => {
    const prisma = prismaWith([]);
    prisma.company.findMany
      .mockResolvedValueOnce([]) // names
      .mockResolvedValueOnce([
        { id: ACME_ID, name: 'Acme', website: 'https://acme.com', verificationStatus: 'APPROVED' },
        { id: OTHER_ID, name: 'Acmeware', website: 'acmeware.io', verificationStatus: 'PENDING' },
      ]);

    const signals = await findCompanyDuplicateSignals(prisma as never, {
      companyId: null,
      displayName: 'Acme India',
      legalName: 'Acme India Private Limited',
      website: 'https://www.acme.co.in',
    });

    expect(signals).toEqual([
      {
        kind: 'DOMAIN_ROOT_MATCH',
        matchedCompanyId: ACME_ID,
        matchedName: 'Acme',
        matchedStatus: 'APPROVED',
      },
    ]);
  });

  it('flags a placement-employer entry without a company id, and excludes the company itself', async () => {
    const prisma = prismaWith([], { name: 'ACME LABS' });

    const signals = await findCompanyDuplicateSignals(prisma as never, {
      companyId: ACME_ID,
      displayName: 'Acme Labs',
      legalName: 'Acme Labs Pvt Ltd',
      website: null,
    });

    expect(signals).toEqual([
      {
        kind: 'PLACEMENT_EMPLOYER_MATCH',
        matchedCompanyId: null,
        matchedName: 'ACME LABS',
        matchedStatus: null,
      },
    ]);
    expect(prisma.company.findMany.mock.calls[0]?.[0].where.id).toEqual({ not: ACME_ID });
  });
});
