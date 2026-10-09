'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isHireKiwiApiError, queryKeys } from '@hirekiwi/api-client';
import { useQueryClient } from '@hirekiwi/ui';
import type { ProfessionalCredentialDto } from '@hirekiwi/contracts';
import { api } from '@/lib/api';

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

/** The object key is `credential-documents/{studentId}/{uuid}-{original file name}` — strip the
 * storage prefix and the uuid so the student sees the name they actually picked. */
export function fileNameFromObjectKey(objectKey: string): string {
  const last = objectKey.split('/').pop() ?? objectKey;
  const withoutUuidPrefix = last.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(.+)$/iu,
  );
  return withoutUuidPrefix?.[1] ?? last;
}

export type DocumentPreview = {
  objectUrl: string;
  fileName: string;
  isImage: boolean;
};

/**
 * Supporting-document uploads for credentials: checks the file, uploads it, and keeps a local
 * preview for this tab. Errors go to `onError` so the page can show them in one place.
 */
export function useCredentialDocuments(onError: (message: string | null) => void) {
  const queryClient = useQueryClient();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, DocumentPreview>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const urlsRef = useRef<Record<string, string>>({});

  // Object URLs are only valid for this tab's lifetime — release them on unmount.
  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of Object.values(urls)) URL.revokeObjectURL(url);
    };
  }, []);

  const upload = useCallback(
    async (credentialId: string, file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        onError('Use a PDF, JPG, or PNG file for the supporting document.');
        return;
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        onError('The supporting document must be 5MB or smaller.');
        return;
      }
      setUploadingId(credentialId);
      onError(null);
      try {
        await api.evidence.uploadCredentialDocument(credentialId, file, file.name);
        const previousUrl = urlsRef.current[credentialId];
        if (previousUrl) URL.revokeObjectURL(previousUrl);
        const objectUrl = URL.createObjectURL(file);
        urlsRef.current[credentialId] = objectUrl;
        setPreviews((current) => ({
          ...current,
          [credentialId]: {
            objectUrl,
            fileName: file.name,
            isImage: file.type.startsWith('image/'),
          },
        }));
        await queryClient.invalidateQueries({ queryKey: queryKeys.myCredentials() });
      } catch (err: unknown) {
        onError(isHireKiwiApiError(err) ? err.message : 'Document upload failed.');
      } finally {
        setUploadingId(null);
      }
    },
    [onError, queryClient],
  );

  /** The name to show for a credential's document: what was just picked, else the stored name. */
  const fileNameFor = (credential: ProfessionalCredentialDto): string | null =>
    previews[credential.credentialId]?.fileName ??
    (credential.documentObjectKey ? fileNameFromObjectKey(credential.documentObjectKey) : null);

  return { uploadingId, previews, fileInputRefs, upload, fileNameFor };
}
