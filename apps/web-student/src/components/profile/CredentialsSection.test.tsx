import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '@/test/render-with-query-client';
import { CredentialsSection } from './CredentialsSection';

const listCredentials = vi.fn();
const createCredential = vi.fn();
const uploadCredentialDocument = vi.fn();
const getCredentialDeclaration = vi.fn();
const updateCredentialDeclaration = vi.fn();

vi.mock('@hirekiwi/api-client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    isHireKiwiApiError: () => false,
    isSmartApiError: () => false,
  };
});

vi.mock('@/lib/api', () => ({
  api: {
    evidence: {
      listCredentials: () => listCredentials(),
      createCredential: (...args: unknown[]) => createCredential(...args),
      uploadCredentialDocument: (...args: unknown[]) => uploadCredentialDocument(...args),
      getCredentialDeclaration: () => getCredentialDeclaration(),
      updateCredentialDeclaration: (...args: unknown[]) => updateCredentialDeclaration(...args),
    },
  },
}));

describe('CredentialsSection', () => {
  beforeEach(() => {
    listCredentials.mockReset();
    createCredential.mockReset();
    uploadCredentialDocument.mockReset();
    getCredentialDeclaration.mockReset();
    updateCredentialDeclaration.mockReset();
    listCredentials.mockResolvedValue([]);
    getCredentialDeclaration.mockResolvedValue({ hasNoCredentials: null });
    updateCredentialDeclaration.mockResolvedValue({ hasNoCredentials: true });
    // jsdom has no real blob storage; stub just enough for the preview thumbnail.
    URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('shows a pending-verification note explaining that verification runs on the backend', async () => {
    listCredentials.mockResolvedValue([
      {
        credentialId: 'cred-1',
        issuer: 'Amazon Web Services',
        credentialName: 'AWS Certified Solutions Architect',
        credentialType: 'CERTIFICATION',
        status: 'PENDING_VERIFICATION',
      },
    ]);

    renderWithQueryClient(<CredentialsSection />);
    expect(await screen.findByText(/all verification runs on our backend/i)).toBeDefined();
  });

  it('shows an empty state when there are no credentials', async () => {
    renderWithQueryClient(<CredentialsSection />);
    expect(await screen.findByText('No credentials yet')).toBeDefined();
  });

  it('creates a credential and always shows it as pending, never trusting a pre-set status', async () => {
    createCredential.mockResolvedValue({
      credentialId: 'cred-1',
      issuer: 'Amazon Web Services',
      credentialName: 'AWS Certified Solutions Architect',
      credentialType: 'CERTIFICATION',
      status: 'PENDING_VERIFICATION',
    });
    listCredentials.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        credentialId: 'cred-1',
        issuer: 'Amazon Web Services',
        credentialName: 'AWS Certified Solutions Architect',
        credentialType: 'CERTIFICATION',
        status: 'PENDING_VERIFICATION',
      },
    ]);

    renderWithQueryClient(<CredentialsSection />);
    await screen.findByText('No credentials yet');

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Add credential' }).at(-1) as HTMLElement,
    );
    fireEvent.change(screen.getByPlaceholderText('e.g. Amazon Web Services'), {
      target: { value: 'Amazon Web Services' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. AWS Certified Solutions Architect'), {
      target: { value: 'AWS Certified Solutions Architect' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Add credential' }),
    );

    await waitFor(() => {
      expect(createCredential).toHaveBeenCalledWith(
        expect.objectContaining({
          issuer: 'Amazon Web Services',
          credentialName: 'AWS Certified Solutions Architect',
        }),
      );
      expect(screen.getByText('Pending verification')).toBeDefined();
    });
  });

  it('uploads a supporting document for a pending credential', async () => {
    listCredentials.mockResolvedValue([
      {
        credentialId: 'cred-1',
        issuer: 'Amazon Web Services',
        credentialName: 'AWS Certified Solutions Architect',
        credentialType: 'CERTIFICATION',
        status: 'PENDING_VERIFICATION',
      },
    ]);
    uploadCredentialDocument.mockResolvedValue({});

    renderWithQueryClient(<CredentialsSection />);
    await screen.findByText('AWS Certified Solutions Architect');

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['fake-cert-bytes'], 'license.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadCredentialDocument).toHaveBeenCalledWith('cred-1', file, 'license.pdf');
      expect(screen.getByText('license.pdf')).toBeDefined();
    });
  });

  it('derives a readable file name from a previously uploaded document object key', async () => {
    listCredentials.mockResolvedValue([
      {
        credentialId: 'cred-1',
        issuer: 'Amazon Web Services',
        credentialName: 'AWS Certified Solutions Architect',
        credentialType: 'CERTIFICATION',
        status: 'PENDING_VERIFICATION',
        documentObjectKey:
          'credential-documents/student-1/3a60db1a-71bd-4673-b161-f98f38fe5886-attorney-license.pdf',
      },
    ]);

    renderWithQueryClient(<CredentialsSection />);
    expect(await screen.findByText('attorney-license.pdf')).toBeDefined();
  });

  const pendingCredential = {
    credentialId: 'cred-1',
    issuer: 'Amazon Web Services',
    credentialName: 'AWS Certified Solutions Architect',
    credentialType: 'CERTIFICATION',
    status: 'PENDING_VERIFICATION',
  };

  function uploadFile(file: File) {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [file] } });
  }

  it('rejects unsupported file types without calling the API', async () => {
    listCredentials.mockResolvedValue([pendingCredential]);
    renderWithQueryClient(<CredentialsSection />);
    await screen.findByText('AWS Certified Solutions Architect');

    uploadFile(new File(['x'], 'run.exe', { type: 'application/x-msdownload' }));

    expect(await screen.findByText(/Use a PDF, JPG, or PNG/i)).toBeDefined();
    expect(uploadCredentialDocument).not.toHaveBeenCalled();
  });

  it('rejects documents over 5MB without calling the API', async () => {
    listCredentials.mockResolvedValue([pendingCredential]);
    renderWithQueryClient(<CredentialsSection />);
    await screen.findByText('AWS Certified Solutions Architect');

    const big = new File(['x'], 'big.pdf', { type: 'application/pdf' });
    Object.defineProperty(big, 'size', { value: 5 * 1024 * 1024 + 1 });
    uploadFile(big);

    expect(await screen.findByText(/5MB or smaller/i)).toBeDefined();
    expect(uploadCredentialDocument).not.toHaveBeenCalled();
  });

  it('reports an upload failure and lets the student retry the same document', async () => {
    listCredentials.mockResolvedValue([pendingCredential]);
    uploadCredentialDocument.mockRejectedValueOnce(new Error('boom'));
    uploadCredentialDocument.mockResolvedValueOnce({});
    renderWithQueryClient(<CredentialsSection />);
    await screen.findByText('AWS Certified Solutions Architect');
    const file = new File(['cert'], 'license.pdf', { type: 'application/pdf' });

    uploadFile(file);
    expect(await screen.findByText('Document upload failed.')).toBeDefined();
    // The credential is still listed and still pending: nothing was lost.
    expect(screen.getByText('Pending verification')).toBeDefined();

    uploadFile(file);
    await waitFor(() => expect(uploadCredentialDocument).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByText('Document upload failed.')).toBeNull());
  });

  it('shows a revoked verification outcome instead of a pending state', async () => {
    listCredentials.mockResolvedValue([{ ...pendingCredential, status: 'REVOKED' }]);
    renderWithQueryClient(<CredentialsSection />);

    expect(await screen.findByText('Revoked')).toBeDefined();
    expect(screen.queryByText('Pending verification')).toBeNull();
  });

  it('shows declared no credentials state when hasNoCredentials is true', async () => {
    getCredentialDeclaration.mockResolvedValue({ hasNoCredentials: true });
    renderWithQueryClient(<CredentialsSection />);

    expect(await screen.findByText('No credentials')).toBeDefined();
    expect(
      screen.getByText("You've indicated that you don't currently have any credentials."),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: 'Change declaration' })).toBeDefined();
  });

  it('calls updateCredentialDeclaration when declaring no credentials', async () => {
    getCredentialDeclaration.mockResolvedValue({ hasNoCredentials: null });
    renderWithQueryClient(<CredentialsSection />);

    const button = await screen.findByRole('button', { name: "I don't have any credentials" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(updateCredentialDeclaration).toHaveBeenCalledWith({ hasNoCredentials: true });
    });
  });

  it('calls updateCredentialDeclaration with null when changing declaration', async () => {
    getCredentialDeclaration.mockResolvedValue({ hasNoCredentials: true });
    renderWithQueryClient(<CredentialsSection />);

    const button = await screen.findByRole('button', { name: 'Change declaration' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(updateCredentialDeclaration).toHaveBeenCalledWith({ hasNoCredentials: null });
    });
  });
});
