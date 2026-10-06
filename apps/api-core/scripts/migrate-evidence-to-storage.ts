/**
 * Th6-600 — move legacy education / work-experience proofs into object storage.
 *
 * Before Th6-600, proofs were saved with `fileUrl` holding either an inline data URI or, for
 * education, a placeholder path (`storage/education-proofs/<name>`) with no bytes behind it.
 * This script uploads every data-URI proof to storage under the per-entry evidence prefix and
 * rewrites `fileUrl` to the object key, so downloads go through 15-minute presigned URLs.
 *
 *   Dry run (default — no writes):  pnpm --filter @hirekiwi/api-core exec tsx scripts/migrate-evidence-to-storage.ts
 *   Apply:                          ... scripts/migrate-evidence-to-storage.ts --apply
 *
 * Rows it cannot migrate are reported, never deleted:
 *   - placeholder paths with no file content (the student must re-upload),
 *   - data URIs whose bytes are not a real PDF/PNG.
 */
import 'reflect-metadata';
import '../src/platform/config/load-dotenv.bootstrap.js';
import { EVIDENCE_FILE_MAX_BYTES } from '@hirekiwi/contracts';
import { PrismaService } from '../src/platform/prisma/prisma.service.js';
import { StorageService } from '../src/platform/storage/storage.service.js';
import { detectEvidenceMimeType } from '../src/platform/storage/evidence-file.js';
import { EDUCATION_PROOF_NAMESPACE } from '../src/modules/candidate-education/candidate-education.service.js';
import { WORK_EXPERIENCE_PROOF_NAMESPACE } from '../src/modules/work-experience/work-experience.service.js';

const APPLY = process.argv.includes('--apply');

type Outcome = 'migrated' | 'already_in_storage' | 'no_file_content' | 'invalid_file' | 'too_large';

function decodeDataUri(value: string): Buffer | null {
  const match = /^data:[^;,]*(;base64)?,(.*)$/s.exec(value.trim());
  if (!match) return null;
  return match[1]
    ? Buffer.from(match[2] ?? '', 'base64')
    : Buffer.from(decodeURIComponent(match[2] ?? ''), 'utf8');
}

function classify(fileUrl: string, namespace: string): Outcome | 'data_uri' {
  if (fileUrl.startsWith(`${namespace}/`)) return 'already_in_storage';
  if (fileUrl.startsWith('data:')) return 'data_uri';
  return 'no_file_content';
}

async function migrateRow(
  storage: StorageService,
  namespace: string,
  row: { fileUrl: string; fileName: string },
): Promise<{ outcome: Outcome; objectKey?: string; mimeType?: string; size?: number }> {
  const kind = classify(row.fileUrl, namespace);
  if (kind !== 'data_uri') return { outcome: kind };
  const bytes = decodeDataUri(row.fileUrl);
  if (!bytes || bytes.byteLength === 0) return { outcome: 'invalid_file' };
  if (bytes.byteLength > EVIDENCE_FILE_MAX_BYTES) return { outcome: 'too_large' };
  const mimeType = detectEvidenceMimeType(bytes);
  if (!mimeType) return { outcome: 'invalid_file' };
  if (!APPLY) return { outcome: 'migrated', mimeType, size: bytes.byteLength };
  const objectKey = await storage.upload({
    buffer: bytes,
    namespace,
    fileName: row.fileName,
    contentType: mimeType,
  });
  return { outcome: 'migrated', objectKey, mimeType, size: bytes.byteLength };
}

async function main(): Promise<void> {
  const prisma = new PrismaService();
  const storage = new StorageService();
  if (APPLY) await storage.onModuleInit();
  const counts: Record<string, Record<Outcome, number>> = {};
  const bump = (table: string, outcome: Outcome) => {
    counts[table] ??= {
      migrated: 0,
      already_in_storage: 0,
      no_file_content: 0,
      invalid_file: 0,
      too_large: 0,
    };
    counts[table][outcome] += 1;
  };

  const eduDocs = await prisma.candidateEducationDocument.findMany({
    include: { education: { select: { studentId: true } } },
  });
  for (const doc of eduDocs) {
    const namespace = `${EDUCATION_PROOF_NAMESPACE}/${doc.education.studentId}/${doc.educationId}`;
    const result = await migrateRow(storage, namespace, doc);
    bump('candidate_education_documents', result.outcome);
    if (result.outcome !== 'migrated' && result.outcome !== 'already_in_storage') {
      console.log(`  education doc ${doc.id}: ${result.outcome}`);
    }
    if (APPLY && result.outcome === 'migrated' && result.objectKey) {
      await prisma.candidateEducationDocument.update({
        where: { id: doc.id },
        data: {
          fileUrl: result.objectKey,
          mimeType: result.mimeType,
          fileSizeBytes: result.size,
        },
      });
    }
  }

  const expDocs = await prisma.workExperienceDocument.findMany({
    include: { experience: { select: { studentId: true } } },
  });
  for (const doc of expDocs) {
    const namespace = `${WORK_EXPERIENCE_PROOF_NAMESPACE}/${doc.experience.studentId}/${doc.experienceId}`;
    // Pre-Th6-600 multipart uploads used `work-experience-proofs/<student>/…`; those are in storage.
    const legacyStored = doc.fileUrl.startsWith(
      `${WORK_EXPERIENCE_PROOF_NAMESPACE}/${doc.experience.studentId}/`,
    );
    const result = legacyStored
      ? { outcome: 'already_in_storage' as const }
      : await migrateRow(storage, namespace, doc);
    bump('work_experience_documents', result.outcome);
    if (result.outcome !== 'migrated' && result.outcome !== 'already_in_storage') {
      console.log(`  work-experience doc ${doc.id}: ${result.outcome}`);
    }
    if (APPLY && result.outcome === 'migrated' && 'objectKey' in result && result.objectKey) {
      await prisma.workExperienceDocument.update({
        where: { id: doc.id },
        data: {
          fileUrl: result.objectKey,
          mimeType: result.mimeType,
          fileSizeBytes: result.size,
        },
      });
    }
  }

  console.log(
    `\nTh6-600 evidence migration — ${APPLY ? 'APPLIED' : 'DRY RUN (no changes written)'}`,
  );
  console.table(counts);
  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
