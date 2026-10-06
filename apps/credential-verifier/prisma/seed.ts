import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/index.js';

config();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * Seeds the issuer/trust reference data from the Priority 0 research matrix.
 * Does NOT seed credentials/verifications — those are created by real
 * verification requests, not fixtures, since a fabricated "VERIFIED" row
 * would be exactly the kind of fake result this engine exists to avoid.
 */
async function main(): Promise<void> {
  const issuers = [
    {
      name: 'Credly',
      domain: 'credly.com',
      issuerType: 'platform',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'AWS',
      domain: 'aws.amazon.com',
      issuerType: 'corporate',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'Google Cloud',
      domain: 'cloud.google.com',
      issuerType: 'corporate',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'MongoDB',
      domain: 'mongodb.com',
      issuerType: 'corporate',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'Cisco',
      domain: 'cisco.com',
      issuerType: 'corporate',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'Linux Foundation',
      domain: 'linuxfoundation.org',
      issuerType: 'standards_body',
      trustStatus: 'TRUSTED' as const,
    },
    {
      name: 'Microsoft',
      domain: 'microsoft.com',
      issuerType: 'corporate',
      trustStatus: 'UNVERIFIED' as const,
    },
  ];

  const issuerRows = new Map<string, string>();
  for (const issuer of issuers) {
    const row = await prisma.issuer.upsert({
      where: { domain: issuer.domain },
      update: { name: issuer.name, issuerType: issuer.issuerType, trustStatus: issuer.trustStatus },
      create: issuer,
    });
    issuerRows.set(issuer.name, row.id);
  }

  const adapterConfigs: Array<{
    issuerName: string;
    adapterName: string;
    integrationType:
      | 'OFFICIAL_API'
      | 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT'
      | 'PUBLIC_CREDENTIAL_PLATFORM'
      | 'PUBLIC_ISSUER_VERIFICATION_PAGE'
      | 'USER_MEDIATED'
      | 'UNSUPPORTED';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    notes: string;
  }> = [
    {
      issuerName: 'Credly',
      adapterName: 'credly',
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
      confidence: 'MEDIUM',
      notes: 'Public badge page JSON-LD parse; no documented anonymous-lookup API.',
    },
    {
      issuerName: 'AWS',
      adapterName: 'credly',
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
      confidence: 'MEDIUM',
      notes:
        'Badges issued via Credly — routes through the Credly adapter, no separate AWS adapter.',
    },
    {
      issuerName: 'Google Cloud',
      adapterName: 'credly',
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
      confidence: 'MEDIUM',
      notes: 'Badges issued via Credly — routes through the Credly adapter.',
    },
    {
      issuerName: 'MongoDB',
      adapterName: 'credly',
      integrationType: 'PUBLIC_CREDENTIAL_PLATFORM',
      confidence: 'MEDIUM',
      notes: 'Badges issued via Credly — routes through the Credly adapter.',
    },
    {
      issuerName: 'Cisco',
      adapterName: 'issuer-page:cisco',
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
      confidence: 'MEDIUM',
      notes:
        'cp.certmetrics.com/cisco/en/public/verify/credential — form selectors not yet confirmed; adapter returns UNVERIFIABLE.',
    },
    {
      issuerName: 'Linux Foundation',
      adapterName: 'issuer-page:linux-foundation',
      integrationType: 'OFFICIAL_PUBLIC_VERIFICATION_ENDPOINT',
      confidence: 'MEDIUM',
      notes:
        'training.linuxfoundation.org/certification/verify — form selectors not yet confirmed; adapter returns UNVERIFIABLE.',
    },
    {
      issuerName: 'Microsoft',
      adapterName: 'user-mediated:microsoft',
      integrationType: 'USER_MEDIATED',
      confidence: 'MEDIUM',
      notes:
        'No public API; requires candidate to share their public Learn profile URL. Not yet implemented.',
    },
  ];

  for (const config of adapterConfigs) {
    const issuerId = issuerRows.get(config.issuerName);
    if (!issuerId) continue;
    const existing = await prisma.issuerAdapter.findFirst({
      where: { issuerId, adapterName: config.adapterName },
    });
    if (existing) {
      await prisma.issuerAdapter.update({
        where: { id: existing.id },
        data: {
          integrationType: config.integrationType,
          confidence: config.confidence,
          notes: config.notes,
          capabilities: {},
        },
      });
    } else {
      await prisma.issuerAdapter.create({
        data: {
          issuerId,
          adapterName: config.adapterName,
          integrationType: config.integrationType,
          confidence: config.confidence,
          notes: config.notes,
          capabilities: {},
        },
      });
    }
  }

  const trustEntries: Array<{
    platformName: string | null;
    issuerName: string | null;
    trustLevel: string;
    notes: string;
  }> = [
    {
      platformName: 'Credly',
      issuerName: null,
      trustLevel: 'TRUSTED',
      notes: 'Platform trust is independent of any one issuer using it.',
    },
    {
      platformName: null,
      issuerName: 'Cisco',
      trustLevel: 'TRUSTED',
      notes: 'Trusted issuer; automated verification not yet implemented.',
    },
    {
      platformName: null,
      issuerName: 'Linux Foundation',
      trustLevel: 'TRUSTED',
      notes: 'Trusted standards body; automated verification not yet implemented.',
    },
  ];

  for (const entry of trustEntries) {
    const issuerId = entry.issuerName ? issuerRows.get(entry.issuerName) : null;
    const existing = await prisma.trustRegistryEntry.findFirst({
      where: { platformName: entry.platformName, issuerId: issuerId ?? null },
    });
    if (!existing) {
      await prisma.trustRegistryEntry.create({
        data: {
          platformName: entry.platformName,
          issuerId: issuerId ?? null,
          trustLevel: entry.trustLevel,
          notes: entry.notes,
        },
      });
    }
  }

  console.log(
    `Seeded ${issuers.length} issuers, ${adapterConfigs.length} adapter configs, ${trustEntries.length} trust entries.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
