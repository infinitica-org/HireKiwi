'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BadgeCheck, Loader2, Plus, ShieldCheck } from 'lucide-react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import {
  CREDENTIAL_TYPES,
  type CredentialType,
  type ProfessionalCredentialDto,
} from '@hirekiwi/contracts';
import { CredentialDetailModal } from '@/components/profile/CredentialDetailModal';
import { CredentialEntryCard } from '@/components/profile/CredentialEntryCard';
import { PopupSection, ProfilePopup } from '@/components/profile/ProfilePopup';
import {
  experienceInputClass,
  experienceLabelClass,
} from '@/components/profile/work-experience/work-experience-ui';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import { api } from '@/lib/api';
import {
  profilePrimaryButtonSmClass,
  profileSecondaryButtonSmClass,
} from '@/lib/profile-ui-classes';
import { profileSectionMeta } from '@/lib/profile-sections';

// DEGREE is intentionally not offered here: CandidateEducation already owns
// degree verification, and this pipeline never resolves that type.
const SELECTABLE_CREDENTIAL_TYPES = CREDENTIAL_TYPES.filter((type) => type !== 'DEGREE');

const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  CERTIFICATION: 'Certification',
  LICENSE: 'License',
  DEGREE: 'Degree',
  BADGE: 'Badge',
  PROFESSIONAL_MEMBERSHIP: 'Professional membership',
};

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

/** The object key is `credential-documents/{studentId}/{uuid}-{original file name}` — strip the
 * storage prefix and the uuid so the student sees the name they actually picked. */
function fileNameFromObjectKey(objectKey: string): string {
  const last = objectKey.split('/').pop() ?? objectKey;
  const withoutUuidPrefix = last.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-(.+)$/iu,
  );
  return withoutUuidPrefix?.[1] ?? last;
}

type DocumentPreview = {
  objectUrl: string;
  fileName: string;
  isImage: boolean;
};

type NewCredentialForm = {
  issuer: string;
  credentialName: string;
  credentialType: CredentialType;
  externalCredentialId: string;
  verificationSource: string;
};

function emptyForm(): NewCredentialForm {
  return {
    issuer: '',
    credentialName: '',
    credentialType: 'CERTIFICATION',
    externalCredentialId: '',
    verificationSource: '',
  };
}

export function CredentialsSection() {
  const [credentials, setCredentials] = useState<ProfessionalCredentialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState<ProfessionalCredentialDto | null>(null);
  const [form, setForm] = useState<NewCredentialForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [documentPreviews, setDocumentPreviews] = useState<Record<string, DocumentPreview>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const documentUrlsRef = useRef<Record<string, string>>({});

  // Object URLs are only valid for this tab's lifetime — release them on unmount.
  useEffect(() => {
    return () => {
      for (const url of Object.values(documentUrlsRef.current)) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const loadCredentials = async () => {
    try {
      setError(null);
      const rows = await api.evidence.listCredentials();
      setCredentials(rows);
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not load credentials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCredentials();
  }, []);

  const handleCreate = async () => {
    if (!form.issuer.trim() || !form.credentialName.trim()) {
      setError('Issuer and credential name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.evidence.createCredential({
        issuer: form.issuer.trim(),
        credentialName: form.credentialName.trim(),
        credentialType: form.credentialType,
        externalCredentialId: form.externalCredentialId.trim() || undefined,
        verificationSource: form.verificationSource.trim() || undefined,
      });
      setForm(emptyForm());
      setShowForm(false);
      await loadCredentials();
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not add credential.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (credentialId: string, file: File) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setError('Use a PDF, JPG, or PNG file for the supporting document.');
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setError('The supporting document must be 5MB or smaller.');
      return;
    }
    setUploadingId(credentialId);
    setError(null);
    try {
      await api.evidence.uploadCredentialDocument(credentialId, file, file.name);

      const previousUrl = documentUrlsRef.current[credentialId];
      if (previousUrl) URL.revokeObjectURL(previousUrl);
      const objectUrl = URL.createObjectURL(file);
      documentUrlsRef.current[credentialId] = objectUrl;
      setDocumentPreviews((current) => ({
        ...current,
        [credentialId]: { objectUrl, fileName: file.name, isImage: file.type.startsWith('image/') },
      }));

      await loadCredentials();
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : 'Document upload failed.');
    } finally {
      setUploadingId(null);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm());
  };

  const meta = profileSectionMeta('credentials');

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4 font-[family-name:var(--tpo-font-sans)]"
      aria-label="Professional credentials"
    >
      <ProfileSectionHeader
        title={meta.title}
        evidenceType="CREDENTIAL"
        description={meta.description}
        action={
          !loading && credentials.length > 0 ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={`${profilePrimaryButtonSmClass} justify-center px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em]`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Add credential
            </button>
          ) : null
        }
      />

      {error ? (
        <ProfileSectionError>
          <span className="inline-flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </span>
        </ProfileSectionError>
      ) : null}

      <ProfilePopup
        open={showForm}
        size="lg"
        icon={<BadgeCheck className="size-5" />}
        title="Add credential"
        subtitle="A license, certification, badge or membership. We verify it against the issuer where we can."
        onClose={closeForm}
        footerAlign="between"
        footer={
          <>
            <button type="button" onClick={closeForm} className={profileSecondaryButtonSmClass}>
              Cancel
            </button>
            <button
              type="submit"
              form="credential-form"
              disabled={saving}
              className={`${profilePrimaryButtonSmClass} disabled:opacity-60`}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {saving ? 'Adding…' : 'Add credential'}
            </button>
          </>
        }
      >
        <form
          id="credential-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
          className="flex flex-col gap-5"
        >
          {error ? (
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          ) : null}

          <PopupSection title="Credential" description="What it is and who issued it.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="credential-issuer" className={experienceLabelClass}>
                  Issuer<span className="text-red-600"> *</span>
                </label>
                <input
                  id="credential-issuer"
                  type="text"
                  value={form.issuer}
                  onChange={(e) => setForm((f) => ({ ...f, issuer: e.target.value }))}
                  placeholder="e.g. Amazon Web Services"
                  className={experienceInputClass}
                />
              </div>
              <div>
                <label htmlFor="credential-name" className={experienceLabelClass}>
                  Credential name<span className="text-red-600"> *</span>
                </label>
                <input
                  id="credential-name"
                  type="text"
                  value={form.credentialName}
                  onChange={(e) => setForm((f) => ({ ...f, credentialName: e.target.value }))}
                  placeholder="e.g. AWS Certified Solutions Architect"
                  className={experienceInputClass}
                />
              </div>
              <div>
                <label htmlFor="credential-type" className={experienceLabelClass}>
                  Type
                </label>
                <select
                  id="credential-type"
                  value={form.credentialType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, credentialType: e.target.value as CredentialType }))
                  }
                  className={experienceInputClass}
                >
                  {SELECTABLE_CREDENTIAL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CREDENTIAL_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="credential-number" className={experienceLabelClass}>
                  Credential / license number
                </label>
                <input
                  id="credential-number"
                  type="text"
                  value={form.externalCredentialId}
                  onChange={(e) => setForm((f) => ({ ...f, externalCredentialId: e.target.value }))}
                  placeholder="Optional"
                  className={experienceInputClass}
                />
              </div>
            </div>
          </PopupSection>

          <PopupSection
            title="Verification"
            description="The issuer's public lookup page lets us check it automatically."
          >
            <div>
              <label htmlFor="credential-url" className={experienceLabelClass}>
                Public verification URL
              </label>
              <input
                id="credential-url"
                type="url"
                value={form.verificationSource}
                onChange={(e) => setForm((f) => ({ ...f, verificationSource: e.target.value }))}
                placeholder="Optional — the issuer's public lookup page for this credential"
                className={experienceInputClass}
              />
            </div>
          </PopupSection>
        </form>
      </ProfilePopup>

      {loading ? <p className="text-sm text-[var(--ds-text-muted)]">Loading credentials…</p> : null}

      {!loading && credentials.length === 0 && !showForm ? (
        <ProfileBentoEmptyPanel
          tipIcon={ShieldCheck}
          tipIconClassName="text-[#0284c7]"
          tipTitle="Licenses and professional IDs"
          tipBody="Upload supporting documents — we verify against the issuer where possible and keep pending items visible until confirmed."
          emptyIcon={BadgeCheck}
          emptyTitle="No credentials yet"
          emptyBody="Add a license, certification, badge, or membership to track verification here."
          actions={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={`${profilePrimaryButtonSmClass} justify-center px-5 py-2.5 text-[13px]`}
            >
              <Plus className="size-4" strokeWidth={2} aria-hidden />
              Add credential
            </button>
          }
        />
      ) : null}

      {!loading && credentials.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {credentials.map((credential, index) => {
            const preview = documentPreviews[credential.credentialId];
            const fileName =
              preview?.fileName ??
              (credential.documentObjectKey
                ? fileNameFromObjectKey(credential.documentObjectKey)
                : null);
            const busy = uploadingId === credential.credentialId;

            return (
              <CredentialEntryCard
                key={credential.credentialId}
                credential={credential}
                accentIndex={index}
                preview={preview}
                fileName={fileName}
                uploading={busy}
                onView={() => setViewing(credential)}
                onUploadClick={() => fileInputRefs.current[credential.credentialId]?.click()}
                fileInput={
                  <input
                    ref={(el) => {
                      fileInputRefs.current[credential.credentialId] = el;
                    }}
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUpload(credential.credentialId, file);
                      event.target.value = '';
                    }}
                  />
                }
              />
            );
          })}
        </div>
      ) : null}
      <CredentialDetailModal
        credential={viewing}
        fileName={
          viewing
            ? (documentPreviews[viewing.credentialId]?.fileName ??
              (viewing.documentObjectKey ? fileNameFromObjectKey(viewing.documentObjectKey) : null))
            : null
        }
        onClose={() => setViewing(null)}
      />
    </section>
  );
}
