import type { CompanyDuplicateSignal } from '@hirekiwi/contracts';
import type { Prisma } from '../../generated/prisma/index.js';
import type { PrismaService } from '../../platform/prisma/prisma.service.js';
import { extractDomain, normalizeCompanyName } from '../work-experience/company-name.util.js';

/**
 * S6-VV-110 (#347): near-duplicate company registrations become reviewer signals, not blocks.
 *
 * A registration that exactly repeats an approved company (same GSTIN or website) is still refused
 * in the onboarding service. Everything fuzzier (the same name with a different legal suffix, the
 * same brand on another TLD, a name a TPO already typed into its placement employer list) is
 * legitimately ambiguous: a subsidiary, a regional entity, or a first-time signup. Those submissions
 * go through to review with the matches attached, and the reviewer decides.
 */

/** Second-level public suffixes common in our markets; the label before them is the brand. */
const TWO_LEVEL_SUFFIXES = new Set([
  'co.in',
  'org.in',
  'net.in',
  'firm.in',
  'gen.in',
  'ind.in',
  'ac.in',
  'co.uk',
  'org.uk',
  'com.au',
  'net.au',
  'com.sg',
  'co.nz',
  'co.jp',
  'com.my',
  'co.za',
  'com.br',
  'com.hk',
]);

/** "careers.acme.co.in" -> "acme"; "acme.com" -> "acme". Labels under 3 characters are too noisy. */
export function registrableRoot(host: string | null | undefined): string | null {
  if (!host) return null;
  const labels = host
    .toLowerCase()
    .replace(/^www\./, '')
    .split('.')
    .filter(Boolean);
  if (labels.length < 2) return null;
  const suffixLabels = TWO_LEVEL_SUFFIXES.has(labels.slice(-2).join('.')) ? 2 : 1;
  const root = labels[labels.length - suffixLabels - 1];
  return root && root.length >= 3 ? root : null;
}

const CANDIDATE_LIMIT = 50;

type Db = PrismaService | Prisma.TransactionClient;

export async function findCompanyDuplicateSignals(
  prisma: Db,
  input: {
    /** The submitting company on a resubmission, so it never matches itself. */
    companyId: string | null;
    displayName: string;
    legalName: string;
    website: string | null | undefined;
  },
): Promise<CompanyDuplicateSignal[]> {
  const names = new Set(
    [normalizeCompanyName(input.displayName), normalizeCompanyName(input.legalName)].filter(
      (name) => name.length > 0,
    ),
  );
  const host = extractDomain(input.website);
  const root = registrableRoot(host);
  const notSelf = input.companyId ? { id: { not: input.companyId } } : {};
  const signals: CompanyDuplicateSignal[] = [];
  const seen = new Set<string>();
  const add = (signal: CompanyDuplicateSignal) => {
    const key = `${signal.kind}:${signal.matchedCompanyId ?? signal.matchedName}`;
    if (seen.has(key)) return;
    seen.add(key);
    signals.push(signal);
  };

  // Names: narrow in SQL by the first word, then compare with legal suffixes stripped in code.
  const firstWords = [...names].map((name) => name.split(' ')[0]).filter((w) => w && w.length >= 3);
  if (firstWords.length > 0) {
    const candidates = await prisma.company.findMany({
      where: {
        ...notSelf,
        verificationStatus: { in: ['PENDING', 'APPROVED'] },
        OR: firstWords.map((word) => ({ name: { contains: word, mode: 'insensitive' as const } })),
      },
      select: { id: true, name: true, verificationStatus: true },
      take: CANDIDATE_LIMIT,
    });
    for (const company of candidates) {
      if (names.has(normalizeCompanyName(company.name))) {
        add({
          kind: 'NAME_MATCH',
          matchedCompanyId: company.id,
          matchedName: company.name,
          matchedStatus: company.verificationStatus,
        });
      }
    }
  }

  // The same brand on another TLD or subdomain: acme.com vs acme.in vs careers.acme.co.in.
  if (root) {
    const candidates = await prisma.company.findMany({
      where: {
        ...notSelf,
        verificationStatus: { in: ['PENDING', 'APPROVED'] },
        website: { contains: root, mode: 'insensitive' },
      },
      select: { id: true, name: true, website: true, verificationStatus: true },
      take: CANDIDATE_LIMIT,
    });
    for (const company of candidates) {
      if (registrableRoot(extractDomain(company.website)) === root) {
        add({
          kind: 'DOMAIN_ROOT_MATCH',
          matchedCompanyId: company.id,
          matchedName: company.name,
          matchedStatus: company.verificationStatus,
        });
      }
    }
  }

  // A TPO already lists this employer; not an account, but worth linking when approving.
  if (names.size > 0) {
    const placement = await prisma.placementEmployer.findFirst({
      where: { normalizedName: { in: [...names] } },
      select: { name: true },
    });
    if (placement) {
      add({
        kind: 'PLACEMENT_EMPLOYER_MATCH',
        matchedCompanyId: null,
        matchedName: placement.name,
        matchedStatus: null,
      });
    }
  }

  return signals;
}
