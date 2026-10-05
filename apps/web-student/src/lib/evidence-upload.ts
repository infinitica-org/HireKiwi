import {
  EVIDENCE_FILE_ACCEPT,
  EVIDENCE_FILE_MAX_BYTES,
  type CandidateEducationDocumentDto,
  type WorkExperienceDocumentDto,
} from '@smart/contracts';
import { uploadEvidenceFile, validateEvidenceFile } from '@smart/api-client';
import { api } from '@/lib/api';

/**
 * Th6-600 — one upload path for every evidence file (education, experience, project):
 * presigned PUT to storage, then attach, where the server verifies the real bytes.
 */
export const EVIDENCE_ACCEPT = EVIDENCE_FILE_ACCEPT;
export const EVIDENCE_MAX_MB = EVIDENCE_FILE_MAX_BYTES / (1024 * 1024);
export const EVIDENCE_HINT = `PDF or PNG, up to ${String(EVIDENCE_MAX_MB)} MB`;
export { validateEvidenceFile };

export async function uploadEducationProof(
  educationId: string,
  documentType: CandidateEducationDocumentDto['documentType'],
  file: File,
) {
  const uploaded = await uploadEvidenceFile(file, (body) =>
    api.users.createEducationDocumentUploadUrl(educationId, body),
  );
  return api.users.attachEducationDocument(educationId, {
    documentType,
    fileUrl: uploaded.objectKey,
    fileName: uploaded.fileName,
    fileSizeBytes: uploaded.fileSizeBytes,
    mimeType: uploaded.mimeType,
  });
}

export async function uploadWorkExperienceProof(
  experienceId: string,
  documentType: WorkExperienceDocumentDto['documentType'],
  file: File,
) {
  const uploaded = await uploadEvidenceFile(file, (body) =>
    api.users.createWorkExperienceDocumentUploadUrl(experienceId, body),
  );
  return api.users.attachWorkExperienceDocument(experienceId, {
    documentType,
    fileUrl: uploaded.objectKey,
    fileName: uploaded.fileName,
    fileSizeBytes: uploaded.fileSizeBytes,
    mimeType: uploaded.mimeType,
  });
}

export async function uploadProjectEvidence(projectId: string, file: File) {
  const uploaded = await uploadEvidenceFile(file, (body) =>
    api.projects.createDocumentUploadUrl(projectId, body),
  );
  return api.projects.attachDocument(projectId, uploaded);
}
