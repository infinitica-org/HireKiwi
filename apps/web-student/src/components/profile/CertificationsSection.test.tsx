import { fireEvent, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chooseOption } from '@/test-utils/styled-select';
import { renderWithQueryClient } from '@/test/render-with-query-client';
import { CertificationsSection } from './CertificationsSection';

const listCertificates = vi.fn();
const getCertificateDeclaration = vi.fn();
const updateCertificateDeclaration = vi.fn();
const listCredentials = vi.fn();
const createCredential = vi.fn();
const uploadCredentialDocument = vi.fn();
const getCredentialDeclaration = vi.fn();
const updateCredentialDeclaration = vi.fn();

vi.mock('@hirekiwi/api-client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, isHireKiwiApiError: () => false, isSmartApiError: () => false };
});

vi.mock('@/lib/api', () => ({
  api: {
    candidateCertificates: {
      listMine: () => listCertificates(),
      getDeclaration: () => getCertificateDeclaration(),
      updateDeclaration: (...args: unknown[]) => updateCertificateDeclaration(...args),
    },
    evidence: {
      listCredentials: () => listCredentials(),
      createCredential: (...args: unknown[]) => createCredential(...args),
      uploadCredentialDocument: (...args: unknown[]) => uploadCredentialDocument(...args),
      getCredentialDeclaration: () => getCredentialDeclaration(),
      updateCredentialDeclaration: (...args: unknown[]) => updateCredentialDeclaration(...args),
    },
  },
}));

vi.mock('@/components/certificates/certificate-wizard', () => ({
  CertificateWizard: ({ embedded }: { embedded?: { topField?: React.ReactNode } }) => (
    <div>
      Certificate steps
      {embedded?.topField}
    </div>
  ),
}));

const certificate = {
  certificateId: '00000000-0000-4000-8000-000000000001',
  candidateId: '00000000-0000-4000-8000-000000000002',
  title: 'Google Data Analytics',
  issuer: 'Google',
  status: 'VERIFIED',
  sourceStatus: 'source_verified',
  certificateNumber: 'G-123',
  issueDate: '2025-01-15',
  expiryDate: null,
  verificationUrl: null,
  verificationMethod: 'ENDORSEMENT',
  certificateFileUrl: null,
  certificateFileName: 'cert.pdf',
  fileMimeType: 'application/pdf',
  fileSizeBytes: 1024,
  learningDescription: null,
  tools: [],
  practicalApplied: null,
  practicalDescription: null,
  skills: [{ skillCode: 'SKILL_1', skillName: 'SQL', selfAssessedProficiency: 'INTERMEDIATE' }],
  skillsClaimedSnapshot: null,
  trackCode: null,
  agendaLines: [],
  retryAvailableAt: null,
  lockedUntil: null,
  taxonomyVersionSnapshot: null,
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const license = {
  credentialId: 'cred-1',
  issuer: 'Bar Council',
  credentialName: 'Advocate license',
  credentialType: 'LICENSE',
  status: 'PENDING_VERIFICATION',
};

describe('CertificationsSection (certificates and credentials together)', () => {
  beforeEach(() => {
    listCertificates.mockReset().mockResolvedValue({ certificates: [] });
    getCertificateDeclaration.mockReset().mockResolvedValue({ hasNoCertifications: null });
    updateCertificateDeclaration.mockReset().mockResolvedValue({ hasNoCertifications: true });
    listCredentials.mockReset().mockResolvedValue([]);
    getCredentialDeclaration.mockReset().mockResolvedValue({ hasNoCredentials: null });
    updateCredentialDeclaration.mockReset().mockResolvedValue({ hasNoCredentials: true });
    createCredential.mockReset();
    uploadCredentialDocument.mockReset();
    // jsdom has no real blob storage; stub just enough for the preview thumbnail.
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('shows one empty state with a single add action', async () => {
    renderWithQueryClient(<CertificationsSection />);
    expect(await screen.findByText('Nothing added yet')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^Add/i })).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Certifications & Credentials' })).toBeTruthy();
  });

  it('lists certificates and credentials together', async () => {
    listCertificates.mockResolvedValue({ certificates: [certificate] });
    listCredentials.mockResolvedValue([license]);
    renderWithQueryClient(<CertificationsSection />);

    expect(await screen.findByText('Google Data Analytics')).toBeTruthy();
    expect(await screen.findByText('Advocate license')).toBeTruthy();
    expect(screen.queryByText('Nothing added yet')).toBeNull();
  });

  it('opens one popup with a Type field; Certificate shows the certificate steps', async () => {
    renderWithQueryClient(<CertificationsSection />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add/i })).at(-1) as HTMLElement,
    );

    expect(await screen.findByText('Add certificate or credential')).toBeTruthy();
    const type = screen.getByLabelText(/^Type/);
    fireEvent.click(type);
    for (const label of [
      'Certificate (course or certification)',
      'License',
      'Badge',
      'Professional membership',
    ]) {
      expect(screen.getByRole('option', { name: label })).toBeTruthy();
    }
    fireEvent.click(type);
    expect(screen.getByText(/Certificate steps/)).toBeTruthy();
  });

  it('shows the same details form for a license, badge or membership', async () => {
    renderWithQueryClient(<CertificationsSection />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add/i })).at(-1) as HTMLElement,
    );
    chooseOption(await screen.findByLabelText(/^Type/), 'LICENSE');

    expect(await screen.findByLabelText(/^Issuer/)).toBeTruthy();
    expect(screen.getByLabelText(/^Name/)).toBeTruthy();
    expect(screen.getByLabelText(/^License number/)).toBeTruthy();
    expect(screen.getByLabelText(/Issue date/)).toBeTruthy();
    expect(screen.getByLabelText(/Valid through/)).toBeTruthy();
    expect(screen.queryByText(/Certificate steps/)).toBeNull();
  });

  it('adds a credential of the chosen type and shows it', async () => {
    createCredential.mockResolvedValue(license);
    renderWithQueryClient(<CertificationsSection />);
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add/i })).at(-1) as HTMLElement,
    );
    chooseOption(await screen.findByLabelText(/^Type/), 'BADGE');

    fireEvent.change(await screen.findByLabelText(/^Issuer/), { target: { value: 'Bar Council' } });
    fireEvent.change(screen.getByLabelText(/^Name/), { target: { value: 'Advocate license' } });
    listCredentials.mockResolvedValue([license]);
    // The popup's save button is the last "Add" on the page.
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /^Add/i })).at(-1) as HTMLElement,
    );

    await waitFor(() => expect(createCredential).toHaveBeenCalledTimes(1));
    expect(createCredential.mock.calls[0]?.[0]).toMatchObject({
      issuer: 'Bar Council',
      credentialName: 'Advocate license',
      credentialType: 'BADGE',
    });
    expect(await screen.findByText('Advocate license')).toBeTruthy();
  });

  it('records "I don\'t have any" on both certificates and credentials', async () => {
    renderWithQueryClient(<CertificationsSection />);
    fireEvent.click(await screen.findByRole('button', { name: /I don't have any/i }));

    await waitFor(() => {
      expect(updateCertificateDeclaration).toHaveBeenCalledWith({ hasNoCertifications: true });
      expect(updateCredentialDeclaration).toHaveBeenCalledWith({ hasNoCredentials: true });
    });
  });

  it('shows the declared state, and clears both declarations when changed', async () => {
    getCertificateDeclaration.mockResolvedValue({ hasNoCertifications: true });
    getCredentialDeclaration.mockResolvedValue({ hasNoCredentials: true });
    renderWithQueryClient(<CertificationsSection />);

    expect(await screen.findByText('No certifications or credentials')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Change declaration/i }));

    await waitFor(() => {
      expect(updateCertificateDeclaration).toHaveBeenCalledWith({ hasNoCertifications: null });
      expect(updateCredentialDeclaration).toHaveBeenCalledWith({ hasNoCredentials: null });
    });
  });

  it('uploads a supporting document for a pending credential', async () => {
    listCredentials.mockResolvedValue([license]);
    uploadCredentialDocument.mockResolvedValue({});
    renderWithQueryClient(<CertificationsSection />);
    await screen.findByText('Advocate license');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-bytes'], 'license.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadCredentialDocument).toHaveBeenCalledWith('cred-1', file, 'license.pdf');
      expect(screen.getByText('license.pdf')).toBeTruthy();
    });
  });

  it('rejects unsupported file types and documents over 5MB without calling the API', async () => {
    listCredentials.mockResolvedValue([license]);
    renderWithQueryClient(<CertificationsSection />);
    await screen.findByText('Advocate license');
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, {
      target: { files: [new File(['x'], 'run.exe', { type: 'application/x-msdownload' })] },
    });
    expect(await screen.findByText(/Use a PDF, JPG, or PNG/i)).toBeTruthy();

    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(input, { target: { files: [big] } });
    expect(await screen.findByText(/5MB or smaller/i)).toBeTruthy();
    expect(uploadCredentialDocument).not.toHaveBeenCalled();
  });

  it('shows the real message when the list cannot be loaded', async () => {
    listCertificates.mockRejectedValue(new Error('Boom: certificates are down'));
    renderWithQueryClient(<CertificationsSection />);
    expect(await screen.findByText(/certificates are down/i)).toBeTruthy();
  });
});
