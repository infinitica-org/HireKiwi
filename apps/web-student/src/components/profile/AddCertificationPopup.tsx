'use client';

import { useState } from 'react';
import { isHireKiwiApiError, queryKeys } from '@hirekiwi/api-client';
import { useQueryClient } from '@hirekiwi/ui';
import type { CredentialType } from '@hirekiwi/contracts';
import { CertificateDetailsForm } from '@/components/certificates/certificate-details-form';
import { CertificateWizard } from '@/components/certificates/certificate-wizard';
import { ViviVerificationShell } from '@/components/vivi-verification/ViviVerificationShell';
import { useViviReady } from '@/components/vivi-verification/useViviReady';
import { VIVI_FIELD, VIVI_LABEL } from '@/components/vivi-verification/vivi-field-classes';
import { StyledSelect } from '@/components/ui/styled-select';
import { api } from '@/lib/api';

type Kind = 'CERTIFICATE' | Exclude<CredentialType, 'CERTIFICATION' | 'DEGREE'>;

const KINDS: { id: Kind; label: string; noun: string }[] = [
  { id: 'CERTIFICATE', label: 'Certificate (course or certification)', noun: 'certificate' },
  { id: 'LICENSE', label: 'License', noun: 'license' },
  { id: 'BADGE', label: 'Badge', noun: 'badge' },
  { id: 'PROFESSIONAL_MEMBERSHIP', label: 'Professional membership', noun: 'membership' },
];

/**
 * One popup, one form, for everything in this section. The Type field comes first. A certificate
 * carries on through the certificate steps (document, skills, assessment); a license, badge or
 * membership is saved from the same details form. Managing an existing certificate has no Type.
 */
export function AddCertificationPopup({
  certificateId,
  onClose,
  onCredentialAdded,
}: {
  /** Certificate to manage, or null to add something new. */
  certificateId: string | null;
  onClose: () => void;
  onCredentialAdded: () => void;
}) {
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<Kind>('CERTIFICATE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const ready = useViviReady(true);
  const adding = certificateId === null;
  const noun = KINDS.find((item) => item.id === kind)?.noun ?? 'certificate';

  const typeField = adding ? (
    <div>
      <label htmlFor="cert-kind" className={VIVI_LABEL}>
        Type<span className="text-red-600"> *</span>
      </label>
      <StyledSelect
        id="cert-kind"
        value={kind}
        onChange={(event) => {
          setKind(event.target.value as Kind);
          setError(null);
        }}
        className={VIVI_FIELD}
      >
        {KINDS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </StyledSelect>
    </div>
  ) : null;

  const saveCredential = async (details: {
    title: string;
    issuer: string;
    certificateNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    verificationUrl?: string;
  }) => {
    if (kind === 'CERTIFICATE') return;
    setSaving(true);
    setError(null);
    try {
      await api.evidence.createCredential({
        issuer: details.issuer,
        credentialName: details.title,
        credentialType: kind,
        externalCredentialId: details.certificateNumber,
        issueDate: details.issueDate,
        expiryDate: details.expiryDate,
        verificationSource: details.verificationUrl,
      });
      queryClient.setQueryData(queryKeys.myCredentialDeclaration(), { hasNoCredentials: false });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.myCredentials() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.myCredentialDeclaration() }),
      ]);
      onCredentialAdded();
      onClose();
    } catch (err: unknown) {
      setError(isHireKiwiApiError(err) ? err.message : `Could not add this ${noun}.`);
    } finally {
      setSaving(false);
    }
  };

  const headings: [string, string][] = [
    adding
      ? [
          'Add certificate or credential',
          'Choose the type and add the details. We verify it for you.',
        ]
      : ['Manage certificate', 'Add the provider, credential details and a verification link.'],
    ['Add proof', 'Upload the document or give a public verification link.'],
    ['What did you learn?', 'Pick the skills and describe what you learned.'],
    ['Verification', 'Where this certificate stands and what is left to do.'],
  ];
  const [heading = '', description = ''] =
    headings[adding && kind !== 'CERTIFICATE' ? 0 : stage] ?? [];

  return (
    <ViviVerificationShell
      open
      loading={!ready}
      onClose={onClose}
      titleId="add-certification-title"
      title="Certificate Verification"
      steps={['Details', 'Proof', 'Skills', 'Verify']}
      stepIndex={kind === 'CERTIFICATE' ? stage : 0}
      selectedHeading="What you are adding"
      selectedHint="A course or certificate, or a license, badge or membership. We verify it for you."
      selectedEmpty={<p>Choose the type in the form to begin.</p>}
      selected={
        adding ? [{ code: kind, label: KINDS.find((item) => item.id === kind)?.label ?? '' }] : []
      }
      heading={heading}
      description={description}
      actions={null}
    >
      {!adding || kind === 'CERTIFICATE' ? (
        <CertificateWizard
          key={certificateId ?? 'new'}
          embedded={{ certificateId, onClose, topField: typeField, onStageChange: setStage }}
        />
      ) : (
        <CertificateDetailsForm
          key={kind}
          embedded
          topField={typeField}
          labels={{
            issuer: 'Issuer',
            title: 'Name',
            number: `${noun.charAt(0).toUpperCase()}${noun.slice(1)} number`,
          }}
          onSubmit={(details) => void saveCredential(details)}
          isPending={saving}
          error={error}
          submitLabel="Add"
          onCancel={onClose}
        />
      )}
    </ViviVerificationShell>
  );
}
