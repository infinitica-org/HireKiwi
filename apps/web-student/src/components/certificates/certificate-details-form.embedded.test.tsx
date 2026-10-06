import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CertificateDetailsForm } from './certificate-details-form';
import { CertificateGuidelinesBanner } from './certificate-guidelines-banner';

// Only the page layout uses the UI package's Button and Input; stub them so this test does not
// load the whole UI barrel.
vi.mock('@hirekiwi/ui', () => ({
  Button: ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button {...props}>{children}</button>
  ),
  Input: ({
    label,
    error,
    ...props
  }: React.ComponentProps<'input'> & { label?: string; error?: string }) => (
    <label>
      {label}
      <input {...props} />
      {error ? <span>{error}</span> : null}
    </label>
  ),
}));

afterEach(cleanup);

describe('CertificateDetailsForm (popup layout)', () => {
  it('saves the trimmed details from the footer button', () => {
    const onSubmit = vi.fn();
    render(<CertificateDetailsForm embedded onSubmit={onSubmit} submitLabel="Save & Continue" />);

    fireEvent.change(screen.getByLabelText(/Certification provider/i), {
      target: { value: '  Amazon Web Services ' },
    });
    fireEvent.change(screen.getByLabelText(/Certification name/i), {
      target: { value: 'AWS Certified Solutions Architect' },
    });
    fireEvent.change(screen.getByLabelText(/Direct verification/i), {
      target: { value: 'https://www.credly.com/badges/abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save & Continue' }));

    expect(onSubmit).toHaveBeenCalledWith({
      issuer: 'Amazon Web Services',
      title: 'AWS Certified Solutions Architect',
      certificateNumber: undefined,
      issueDate: undefined,
      expiryDate: undefined,
      verificationUrl: 'https://www.credly.com/badges/abc',
    });
  });

  it('shows what is missing instead of saving an incomplete form', () => {
    const onSubmit = vi.fn();
    render(<CertificateDetailsForm embedded onSubmit={onSubmit} submitLabel="Save & Continue" />);
    fireEvent.click(screen.getByRole('button', { name: 'Save & Continue' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Enter the issuing provider/)).toBeDefined();
    expect(screen.getByText(/Enter the certificate title/)).toBeDefined();
  });

  it('rejects a verification link that is not a URL', () => {
    const onSubmit = vi.fn();
    render(<CertificateDetailsForm embedded onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/Certification provider/i), {
      target: { value: 'AWS' },
    });
    fireEvent.change(screen.getByLabelText(/Certification name/i), {
      target: { value: 'Cloud Practitioner' },
    });
    fireEvent.change(screen.getByLabelText(/Direct verification/i), { target: { value: 'nope' } });
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/valid URL/)).toBeDefined();
  });

  it('Cancel calls onCancel and the popup has no duplicate page heading', () => {
    const onCancel = vi.fn();
    render(<CertificateDetailsForm embedded onSubmit={() => undefined} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  });

  it('disables saving and shows progress while pending, and shows a save error', () => {
    render(
      <CertificateDetailsForm
        embedded
        isPending
        error="Could not save."
        onSubmit={() => undefined}
      />,
    );
    expect((screen.getByRole('button', { name: /Saving/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(screen.getByText('Could not save.')).toBeDefined();
  });

  it('keeps the page layout unchanged when not in a popup', () => {
    render(<CertificateDetailsForm onSubmit={() => undefined} />);
    expect(screen.getByRole('heading', { level: 2, name: /Certificate Details/ })).toBeDefined();
  });
});

describe('CertificateGuidelinesBanner (compact)', () => {
  it('gives the same guidance in a smaller box', () => {
    render(<CertificateGuidelinesBanner compact />);
    expect(screen.getByText(/Certification upload guidelines/i)).toBeDefined();
    expect(screen.getByText(/Accepted:/)).toBeDefined();
    expect(screen.getByText(/Rejected:/)).toBeDefined();
  });
});
