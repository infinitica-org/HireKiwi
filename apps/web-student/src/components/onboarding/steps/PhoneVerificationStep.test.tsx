import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PhoneVerificationStep from './PhoneVerificationStep';
import { emptyOnboardingForm } from '@/lib/onboarding-form';

const mockMe = vi.fn();
const mockSendEmailOtp = vi.fn();
const mockVerifyEmailOtp = vi.fn();

vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: (...args: unknown[]) => mockMe(...args),
      sendEmailOtp: (...args: unknown[]) => mockSendEmailOtp(...args),
      verifyEmailOtp: (...args: unknown[]) => mockVerifyEmailOtp(...args),
    },
  },
}));

describe('PhoneVerificationStep', () => {
  const onContinue = vi.fn();
  const updateField = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockMe.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      emailVerified: true,
    });
    mockSendEmailOtp.mockResolvedValue({
      resendAvailableAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(),
    });
    mockVerifyEmailOtp.mockResolvedValue({ verified: true });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders phone number input, country code, 6-digit OTP code, and DPDP checkbox', () => {
    render(
      <PhoneVerificationStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    expect(screen.getByText('Verify your mobile number')).toBeDefined();
    expect(screen.getByTestId('phone-number-input')).toBeDefined();
    expect(screen.getByTestId('otp-code-input')).toBeDefined();
    expect(screen.getByTestId('dpdp-consent-checkbox')).toBeDefined();
    expect(screen.getByTestId('verify-phone-submit')).toBeDefined();
  });

  it('shows error when phone is invalid or DPDP is not checked', async () => {
    const emptyForm = { ...emptyOnboardingForm(), phoneNumber: '' };
    render(
      <PhoneVerificationStep
        formData={emptyForm}
        updateField={updateField}
        onContinue={onContinue}
      />,
    );

    fireEvent.change(screen.getByTestId('phone-number-input'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('verify-phone-submit'));

    await waitFor(() => {
      expect(screen.getByText(/Mobile number must contain|agree to the DPDP/i)).toBeDefined();
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('sends OTP code and enables resend cooldown', async () => {
    const form = {
      ...emptyOnboardingForm(),
      phoneNumber: '9876543210',
    };

    render(
      <PhoneVerificationStep formData={form} updateField={updateField} onContinue={onContinue} />,
    );

    fireEvent.click(screen.getByTestId('resend-otp-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Resend code in/i)).toBeDefined();
    });
  });

  it('displays "✓ Email verified" badge when user email is pre-verified', async () => {
    render(
      <PhoneVerificationStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
        initialUser={
          {
            id: 'user-1',
            email: 'student@example.com',
            emailVerified: true,
          } as never
        }
      />,
    );

    expect(screen.getByTestId('email-verified-badge')).toBeDefined();
    expect(screen.getByText(/✓ Email verified/i)).toBeDefined();
  });

  it('handles email OTP send and verification when unverified', async () => {
    render(
      <PhoneVerificationStep
        formData={emptyOnboardingForm()}
        updateField={updateField}
        onContinue={onContinue}
        initialUser={
          {
            id: 'user-1',
            email: 'student@example.com',
            emailVerified: false,
          } as never
        }
      />,
    );

    expect(screen.getByTestId('email-verification-section')).toBeDefined();
    expect(screen.queryByTestId('email-verified-badge')).toBeNull();

    fireEvent.click(screen.getByTestId('send-email-otp-btn'));

    await waitFor(() => {
      expect(mockSendEmailOtp).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('email-otp-input')).toBeDefined();
    });

    fireEvent.change(screen.getByTestId('email-otp-input'), { target: { value: '654321' } });
    fireEvent.click(screen.getByTestId('verify-email-otp-btn'));

    await waitFor(() => {
      expect(mockVerifyEmailOtp).toHaveBeenCalledWith({ code: '654321' });
      expect(screen.getByTestId('email-verified-badge')).toBeDefined();
    });
  });

  it('blocks continue when email is not verified', async () => {
    const form = {
      ...emptyOnboardingForm(),
      phoneNumber: '9876543210',
      dpdpConsent: true,
    };

    render(
      <PhoneVerificationStep
        formData={form}
        updateField={updateField}
        onContinue={onContinue}
        initialUser={
          {
            id: 'user-1',
            email: 'student@example.com',
            emailVerified: false,
          } as never
        }
      />,
    );

    fireEvent.click(screen.getByTestId('verify-phone-submit'));

    await waitFor(() => {
      expect(screen.getByText(/Please verify your email address to continue/i)).toBeDefined();
    });
    expect(onContinue).not.toHaveBeenCalled();
  });

  it('submits successfully when phone, OTP, email, and DPDP consent are valid', async () => {
    const form = {
      ...emptyOnboardingForm(),
      phoneNumber: '9876543210',
      dpdpConsent: true,
    };

    render(
      <PhoneVerificationStep
        formData={form}
        updateField={updateField}
        onContinue={onContinue}
        initialUser={
          {
            id: 'user-1',
            email: 'student@example.com',
            emailVerified: true,
          } as never
        }
      />,
    );

    fireEvent.change(screen.getByTestId('otp-code-input'), { target: { value: '123456' } });
    fireEvent.click(screen.getByTestId('verify-phone-submit'));

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled();
    });
  });
});
