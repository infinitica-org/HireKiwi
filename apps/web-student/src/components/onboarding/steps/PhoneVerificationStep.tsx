'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronDown, RefreshCw, Zap } from 'lucide-react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import type { AuthenticatedUser } from '@hirekiwi/contracts';
import { api } from '@/lib/api';
import type { OnboardingProfileForm } from '@/lib/onboarding-form';
import { ErrorBanner, PrimaryButton, StepHeading, TextInput } from '../wizard-ui';

interface PhoneVerificationStepProps {
  formData: OnboardingProfileForm;
  updateField: <K extends keyof OnboardingProfileForm>(
    field: K,
    value: OnboardingProfileForm[K],
  ) => void;
  onContinue: () => void;
  initialUser?: AuthenticatedUser | null;
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-foreground">
      {children}
      {required ? <span className="text-rose-500"> *</span> : null}
    </span>
  );
}

export default function PhoneVerificationStep({
  formData,
  updateField,
  onContinue,
  initialUser,
}: PhoneVerificationStepProps) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(initialUser ?? null);
  const [emailVerified, setEmailVerified] = useState(Boolean(initialUser?.emailVerified));

  // Mobile OTP state
  const [otpCode, setOtpCode] = useState('123456');
  const [otpSent, setOtpSent] = useState(true);
  const [cooldown, setCooldown] = useState(0);

  // Email OTP state
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    'Demo OTP mode active: Use dummy code 123456.',
  );
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!initialUser && api.auth?.me) {
      api.auth
        .me()
        .then((user) => {
          if (!cancelled) {
            setCurrentUser(user);
            if (user.emailVerified) {
              setEmailVerified(true);
            }
          }
        })
        .catch(() => {
          // Dev fallback
        });
    }
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (emailCooldown > 0) {
      const timer = setTimeout(() => setEmailCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [emailCooldown]);

  // Set default dummy phone number if empty
  useEffect(() => {
    if (!formData.phoneNumber.trim()) {
      updateField('phoneNumber', '9876543210');
    }
  }, []);

  const otpInvalid = attempted && (!otpCode.trim() || !/^\d{6}$/.test(otpCode.trim()));
  const consentInvalid = attempted && !formData.dpdpConsent;

  const handleSendOrResendCode = () => {
    const cleanPhone = formData.phoneNumber.trim() || '9876543210';
    if (!formData.phoneNumber.trim()) {
      updateField('phoneNumber', '9876543210');
    }
    setError(null);
    setOtpSent(true);
    setOtpCode('123456');
    setCooldown(30);
    setSuccessMessage(
      `Demo OTP sent to ${formData.phoneCountryCode || '+91'} ${cleanPhone}. Code auto-filled: 123456.`,
    );
  };

  const handleSendEmailOtp = async () => {
    setEmailSending(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      await api.auth.sendEmailOtp();
      setEmailOtpSent(true);
      setEmailCooldown(60);
      setEmailSuccess('Verification code sent to your email.');
    } catch (err: unknown) {
      if (isHireKiwiApiError(err)) {
        setEmailError(err.message);
      } else {
        setEmailError('Could not send verification code. Please try again.');
      }
    } finally {
      setEmailSending(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const trimmed = emailOtpCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setEmailError('Please enter a 6-digit verification code.');
      return;
    }

    setEmailVerifying(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const res = await api.auth.verifyEmailOtp({ code: trimmed });
      if (res.verified) {
        setEmailVerified(true);
        setEmailSuccess('Email verified successfully.');
      }
    } catch (err: unknown) {
      if (isHireKiwiApiError(err)) {
        setEmailError(err.message);
      } else {
        setEmailError('Invalid verification code.');
      }
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleFillDemoCreds = () => {
    updateField('phoneNumber', '9876543210');
    updateField('dpdpConsent', true);
    setOtpCode('123456');
    setOtpSent(true);
    setEmailOtpCode('123456');
    setEmailVerified(true);
    setError(null);
    setSuccessMessage('Demo student phone number (9876543210) & OTP (123456) filled.');
  };

  const handleVerify = () => {
    setAttempted(true);
    setError(null);
    setSuccessMessage(null);

    const cleanPhone = formData.phoneNumber.trim();
    if (!cleanPhone || !/^\d{10}$/.test(cleanPhone)) {
      setError('Mobile number must contain exactly 10 digits.');
      return;
    }
    if (!otpCode.trim() || !/^\d{6}$/.test(otpCode.trim())) {
      setError('Please enter the 6-digit OTP code sent to your phone (Use 123456).');
      return;
    }
    if (!emailVerified) {
      setError('Please verify your email address to continue.');
      return;
    }
    if (!formData.dpdpConsent) {
      setError('You must agree to the DPDP consent terms to proceed.');
      return;
    }

    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      onContinue();
    }, 300);
  };

  return (
    <div data-testid="phone-verification-step">
      <StepHeading
        title="Create an account"
        subtitle={
          <span>
            Build your skill profile. Get discovered by the right employers.
            <span className="sr-only">Verify your mobile number</span>
          </span>
        }
      />

      <AnimatePresence>{error ? <ErrorBanner>{error}</ErrorBanner> : null}</AnimatePresence>

      {successMessage ? (
        <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={handleFillDemoCreds}
            className="inline-flex items-center gap-1 font-semibold text-foreground underline underline-offset-2 hover:opacity-70"
          >
            <Zap className="h-3 w-3" />
            Quick Fill Demo
          </button>
        </p>
      ) : null}

      <div className="space-y-6">
        {/* Email Verification Section */}
        {emailVerified ? (
          <div
            data-testid="email-verified-badge"
            className="flex items-center justify-between gap-3 border-b border-border pb-4"
          >
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-foreground">✓ Email verified</p>
              {currentUser?.email ? (
                <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
              ) : null}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verified
            </span>
          </div>
        ) : (
          <div
            data-testid="email-verification-section"
            className="rounded-[11px] border border-border bg-card p-3.5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <Label required>Email verification</Label>
                {currentUser?.email ? (
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                ) : null}
              </div>
              {emailCooldown > 0 ? (
                <span className="text-xs text-muted-foreground">Resend in {emailCooldown}s</span>
              ) : (
                <button
                  type="button"
                  data-testid="send-email-otp-btn"
                  onClick={() => void handleSendEmailOtp()}
                  disabled={emailSending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-2 hover:opacity-80 disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${emailSending ? 'animate-spin' : ''}`} />
                  {emailOtpSent ? 'Resend code' : 'Send verification code'}
                </button>
              )}
            </div>

            {emailError ? <p className="text-xs text-rose-600">{emailError}</p> : null}
            {emailSuccess ? <p className="text-xs text-emerald-600">{emailSuccess}</p> : null}

            {emailOtpSent ? (
              <div className="flex items-center gap-2">
                <TextInput
                  data-testid="email-otp-input"
                  type="text"
                  inputMode="numeric"
                  value={emailOtpCode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setEmailOtpCode(digits);
                  }}
                  placeholder="6-digit code"
                  maxLength={6}
                  className="rounded-lg bg-white font-mono text-sm tracking-[0.25em] shadow-xs"
                />
                <button
                  type="button"
                  data-testid="verify-email-otp-btn"
                  onClick={() => void handleVerifyEmailOtp()}
                  disabled={emailVerifying || emailOtpCode.trim().length !== 6}
                  className="shrink-0 rounded-[11px] bg-foreground px-4 py-2 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  {emailVerifying ? 'Verifying...' : 'Verify Email'}
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* Mobile Number with Country Code */}
        <div>
          <Label required>Mobile number</Label>
          <div className="flex h-11 overflow-hidden rounded-[8px] border bg-white  duration-150 focus-within:ring-[3px] border-zinc-300 focus-within:border-zinc-900 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:focus-within:border-white dark:focus-within:ring-white/10">
            <div className="relative flex shrink-0 items-center border-r border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50">
              <select
                aria-label="Country code"
                value={formData.phoneCountryCode || '+91'}
                onChange={(e) => updateField('phoneCountryCode', e.target.value)}
                className="h-full cursor-pointer appearance-none rounded-none border-0 bg-transparent py-0 pr-7 pl-3.5 text-sm font-medium text-foreground outline-none"
              >
                <option value="+91">IN +91</option>
                <option value="+1">US +1</option>
                <option value="+44">UK +44</option>
                <option value="+65">SG +65</option>
                <option value="+971">AE +971</option>
                <option value="+61">AU +61</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 h-4 w-4 text-zinc-400"
                aria-hidden
              />
            </div>
            <input
              data-testid="phone-number-input"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={formData.phoneNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                updateField('phoneNumber', digits);
              }}
              placeholder="6381730716"
              maxLength={10}
              className="w-full min-w-0 bg-transparent px-3.5 text-sm text-foreground placeholder:text-zinc-400 outline-none"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            10-digit number, without country code.
          </p>
        </div>

        {/* 6-Digit OTP */}
        <div>
          <div className="flex items-center justify-between">
            <Label required>Verification code</Label>
            {cooldown > 0 ? (
              <span className="text-xs text-muted-foreground">Resend code in {cooldown}s</span>
            ) : (
              <button
                type="button"
                data-testid="resend-otp-btn"
                onClick={handleSendOrResendCode}
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground underline underline-offset-2 hover:opacity-80"
              >
                <RefreshCw className="h-3 w-3" />
                {otpSent ? 'Resend code' : 'Get OTP code'}
              </button>
            )}
          </div>
          <div
            className={`flex h-11 overflow-hidden rounded-[8px] border bg-white transition-[border-color,box-shadow] duration-150 focus-within:ring-[3px] ${
              otpInvalid
                ? 'border-rose-500 focus-within:ring-rose-500/20'
                : 'border-zinc-300 focus-within:border-zinc-900 focus-within:ring-zinc-900/10 dark:border-zinc-700 dark:focus-within:border-white dark:focus-within:ring-white/10'
            }`}
          >
            <input
              data-testid="otp-code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(digits);
              }}
              aria-invalid={otpInvalid || undefined}
              aria-label="Verification code"
              placeholder="123456"
              maxLength={6}
              className="w-full min-w-0 bg-transparent px-3.5 font-mono text-sm tracking-[0.25em] text-foreground placeholder:text-zinc-400 outline-none"
            />
          </div>
        </div>

        {/* DPDP Consent */}
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-lg ${
            consentInvalid ? 'bg-rose-50 p-2 ring-1 ring-rose-300' : ''
          }`}
        >
          <input
            data-testid="dpdp-consent-checkbox"
            type="checkbox"
            checked={formData.dpdpConsent}
            onChange={(e) => updateField('dpdpConsent', e.target.checked)}
            className="mt-0.5 size-4 rounded border-border text-black accent-black focus:ring-black dark:accent-white"
          />
          <span className="text-[13px] leading-snug text-foreground/80">
            I consent to HireKiwi processing my personal data as described in the{' '}
            <Link
              href="/dpdp-policy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded font-medium text-foreground underline underline-offset-2 hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-black"
            >
              DPDP Act 2023 consent terms
            </Link>
            , so my profile can be shared with prospective employers.
          </span>
        </label>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <PrimaryButton
          data-testid="verify-phone-submit"
          onClick={handleVerify}
          loading={verifying}
          className="w-full"
        >
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
