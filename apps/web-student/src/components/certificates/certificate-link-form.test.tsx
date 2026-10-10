import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CertificateLinkForm } from './certificate-link-form';

const lookupLink = vi.fn();
vi.mock('@/lib/api', () => ({
  api: { candidateCertificates: { lookupLink: (...args: unknown[]) => lookupLink(...args) } },
}));

const BADGE = 'https://www.credly.com/badges/f7ae4be9-fd65-454d-874e-c6e2c3237d41';

function verified(overrides: Record<string, unknown> = {}) {
  return {
    outcome: 'verified',
    provider: 'Credly',
    title: 'Python Essentials 2',
    issuer: 'Cisco',
    holderName: 'Vishal V',
    nameMatches: true,
    issueDate: '2024-05-01',
    expiryDate: null,
    message: 'Credly confirms this certificate was issued to Vishal V.',
    ...overrides,
  };
}

describe('CertificateLinkForm', () => {
  beforeEach(() => lookupLink.mockReset());

  it('checks a pasted link with the issuer and fills in the name and issuer', async () => {
    lookupLink.mockResolvedValue(verified());
    render(<CertificateLinkForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Certificate link'), { target: { value: BADGE } });

    expect(
      await screen.findByText('Credly confirms this certificate was issued to Vishal V.'),
    ).toBeTruthy();
    expect(lookupLink).toHaveBeenCalledWith({ url: BADGE });
    expect((screen.getByLabelText(/^Certificate name/) as HTMLInputElement).value).toBe(
      'Python Essentials 2',
    );
    expect((screen.getByLabelText(/^Issued by/) as HTMLInputElement).value).toBe('Cisco');
  });

  it('never overwrites what the student typed', async () => {
    lookupLink.mockResolvedValue(verified());
    render(<CertificateLinkForm onSubmit={vi.fn()} />);

    fireEvent.change(screen.getByLabelText(/^Certificate name/), {
      target: { value: 'My own title' },
    });
    fireEvent.change(screen.getByLabelText('Certificate link'), { target: { value: BADGE } });

    await screen.findByText(/Credly confirms/);
    expect((screen.getByLabelText(/^Certificate name/) as HTMLInputElement).value).toBe(
      'My own title',
    );
  });

  it('warns, but still allows adding, when the badge names someone else', async () => {
    const onSubmit = vi.fn();
    lookupLink.mockResolvedValue(
      verified({
        holderName: 'Priya Sharma',
        nameMatches: false,
        message: 'Issued to "Priya Sharma".',
      }),
    );
    render(<CertificateLinkForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Certificate link'), { target: { value: BADGE } });
    await screen.findByText('Issued to "Priya Sharma".');
    fireEvent.click(screen.getByRole('button', { name: 'Add certificate' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ verificationUrl: BADGE });
  });

  it('asks for a link or a file before saving', async () => {
    const onSubmit = vi.fn();
    render(<CertificateLinkForm onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/^Certificate name/), { target: { value: 'AWS CCP' } });
    fireEvent.change(screen.getByLabelText(/^Issued by/), { target: { value: 'AWS' } });

    fireEvent.click(screen.getByRole('button', { name: 'Add certificate' }));

    expect(await screen.findByText("Paste the certificate's link or upload it.")).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
