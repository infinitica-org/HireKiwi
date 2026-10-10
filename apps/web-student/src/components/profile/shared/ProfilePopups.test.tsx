import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CandidateCertificateDto, ProfessionalCredentialDto } from '@hirekiwi/contracts';
import { CertificateDetailModal } from '../certifications/CertificateDetailModal';
import { CredentialDetailModal } from '../certifications/CredentialDetailModal';
import { ProfilePopup } from './ProfilePopup';

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(cleanup);

describe('ProfilePopup', () => {
  it('renders nothing while closed', () => {
    render(
      <ProfilePopup open={false} title="Hidden" onClose={() => undefined}>
        body
      </ProfilePopup>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Esc, the X button and the backdrop, but not when the card is clicked', () => {
    const onClose = vi.fn();
    render(
      <ProfilePopup open title="Details" subtitle="Sub" onClose={onClose}>
        <p>content</p>
      </ProfilePopup>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Details' });

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('locks page scrolling while open and restores it after', () => {
    document.body.style.overflow = 'auto';
    const view = render(
      <ProfilePopup open title="Lock" onClose={() => undefined}>
        x
      </ProfilePopup>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    view.unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});

const certificate = {
  certificateId: '11111111-1111-4111-8111-111111111111',
  candidateId: '22222222-2222-4222-8222-222222222222',
  title: 'AWS Certified Solutions Architect',
  issuer: 'Amazon Web Services',
  status: 'VERIFIED',
  sourceStatus: 'source_verified',
  certificateNumber: 'AWS-12345678',
  issueDate: '2025-03-01',
  expiryDate: null,
  verificationUrl: 'https://www.credly.com/badges/abc',
  verificationMethod: null,
  certificateFileUrl: null,
  certificateFileName: null,
  fileMimeType: null,
  fileSizeBytes: null,
  learningDescription: 'Designing resilient cloud systems.',
  tools: ['Terraform', 'CloudFormation'],
  practicalApplied: true,
  practicalDescription: 'Moved a service to ECS.',
  skills: [{ skillCode: 'AWS', skillName: 'AWS Cloud', selfAssessedProficiency: 'INTERMEDIATE' }],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
} as unknown as CandidateCertificateDto;

describe('CertificateDetailModal', () => {
  it('shows the certificate details, and only the fields that have a value', () => {
    render(<CertificateDetailModal certificate={certificate} onClose={() => undefined} />);
    const dialog = screen.getByRole('dialog', { name: 'AWS Certified Solutions Architect' });
    expect(dialog.textContent).toContain('Amazon Web Services');
    expect(dialog.textContent).toContain('AWS-12345678');
    expect(dialog.textContent).toContain('Terraform, CloudFormation');
    expect(dialog.textContent).toContain('Moved a service to ECS.');
    expect(dialog.textContent).toContain('AWS Cloud');
    expect(screen.getByRole('link', { name: /Open issuer page/ }).getAttribute('href')).toBe(
      'https://www.credly.com/badges/abc',
    );
    // Expiry date is null, so its label is not rendered at all.
    expect(screen.queryByText('Expiry date')).toBeNull();
  });

  it('does not make a non-http verification link clickable', () => {
    render(
      <CertificateDetailModal
        certificate={{ ...certificate, verificationUrl: 'javascript:alert(1)' }}
        onClose={() => undefined}
      />,
    );
    expect(screen.queryByRole('link', { name: /Open issuer page/ })).toBeNull();
  });

  it('Manage opens the add/manage popup when a handler is given', () => {
    const onManage = vi.fn();
    render(
      <CertificateDetailModal
        certificate={certificate}
        onClose={() => undefined}
        onManage={onManage}
      />,
    );
    const buttons = screen.getAllByRole('button').filter((b) => b.textContent !== '');
    const manage = buttons.find((b) =>
      /manage|view|update|edit|continue/i.test(b.textContent ?? ''),
    );
    fireEvent.click(manage as HTMLElement);
    expect(onManage).toHaveBeenCalledTimes(1);
  });

  it('renders nothing without a certificate', () => {
    render(<CertificateDetailModal certificate={null} onClose={() => undefined} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

const credential = {
  credentialId: '33333333-3333-4333-8333-333333333333',
  issuer: 'Project Management Institute',
  credentialName: 'PMP',
  credentialType: 'CERTIFICATION',
  externalCredentialId: 'PMI-998',
  issueDate: '2024-06-15',
  status: 'PENDING_VERIFICATION',
  practicalComponent: false,
  coveredTopics: ['Scheduling', 'Risk'],
  coveredSkills: [],
  applicationEvidence: [],
  documentObjectKey: null,
} as unknown as ProfessionalCredentialDto;

describe('CredentialDetailModal', () => {
  it('shows the credential details with readable type and status', () => {
    render(
      <CredentialDetailModal
        credential={credential}
        fileName="pmp.pdf"
        onClose={() => undefined}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'PMP' });
    expect(dialog.textContent).toContain('Project Management Institute');
    expect(dialog.textContent).toContain('Pending verification');
    expect(dialog.textContent).toContain('Certification');
    expect(dialog.textContent).toContain('PMI-998');
    expect(dialog.textContent).toContain('Scheduling, Risk');
    expect(dialog.textContent).toContain('pmp.pdf');
  });

  it('closes from the footer button', () => {
    const onClose = vi.fn();
    render(<CredentialDetailModal credential={credential} fileName={null} onClose={onClose} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Close' }).at(-1) as HTMLElement);
    expect(onClose).toHaveBeenCalled();
  });
});
