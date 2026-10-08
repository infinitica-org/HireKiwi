'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isSmartApiError } from '@hirekiwi/api-client';
import { SmartLogo } from '@hirekiwi/ui';
import { AuthSplitShell } from '../../components/auth-split-shell';
import {
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  MailIcon,
  PhoneIcon,
  UserIcon,
} from '../../components/auth-icons';
import { WelcomeIllustration } from '../../components/auth-illustrations';
import { PasswordStrength } from '../../components/password-strength';
import { evaluatePasswordRules, PasswordRulesChecklist } from '../../components/password-rules';
import { ResendVerification } from '../../components/resend-verification';
import { api } from '../../lib/api';

const fieldIconClass =
  'pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ca3af] transition-colors peer-focus:text-[#0f766e]';
const inputWithIconClass =
  'peer w-full rounded-xl border border-[#e5e7eb] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#111827] placeholder:text-[#9ca3af] transition focus:border-[#0f766e] focus:outline-none focus:ring-4 focus:ring-[#0f766e]/10';

const COUNTRY_CODES = [
  { label: 'IN +91', value: '+91' },
  { label: 'US +1', value: '+1' },
  { label: 'UK +44', value: '+44' },
  { label: 'SG +65', value: '+65' },
  { label: 'AE +971', value: '+971' },
  { label: 'AU +61', value: '+61' },
];

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCountryCode, setPhoneCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordRules = evaluatePasswordRules({
    password,
    firstName,
    lastName,
    phoneNumber,
  });

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError('Full Name is required.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!passwordRules.every((rule) => rule.met)) {
      setError('Your password does not meet the requirements below.');
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const registerFn = api.auth.registerStudent ?? api.auth.register;
      const result = await registerFn({
        email: cleanEmail,
        password,
        fullName,
      });
      // No session yet: the account is usable once the emailed link is confirmed.
      setRegisteredEmail(result.email);
    } catch (err) {
      if (isSmartApiError(err) && err.code === 'conflict') {
        setError('An account with this email already exists.');
      } else {
        setError(
          isSmartApiError(err) && err.message
            ? err.message
            : 'Could not create your account. Check your details and try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (registeredEmail) {
    return <CheckInbox email={registeredEmail} />;
  }

  return (
    <AuthSplitShell>
      <div className="flex h-dvh max-h-dvh w-full flex-1 flex-col justify-between overflow-y-auto bg-white px-6 py-4 font-sans text-[#111827] sm:px-12 sm:py-6">
        {/* Top Header Logo (mobile only — the split shell carries branding on lg+) */}
        <header className="mx-auto flex w-full max-w-5xl shrink-0 items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <SmartLogo tone="on-light" className="h-8 w-auto" />
          </div>
        </header>

        {/* Centered Main Form Container */}
        <main className="mx-auto my-auto w-full max-w-130 shrink-0 py-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0f766e]/8 px-3 py-1 text-xs font-semibold text-[#0f766e]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e]" />
            Student sign up
          </span>

          <div className="mt-4 flex items-center gap-4">
            <WelcomeIllustration className="h-14 w-auto shrink-0" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#111827] sm:text-[1.75rem]">
                Create an account
              </h1>
              <p className="mt-0.5 text-sm text-[#6b7280]">
                Build your skill profile. Get discovered by the right employers.
              </p>
            </div>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl border border-[#eef0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.08)] sm:p-6">
            <form onSubmit={onSubmit} className="space-y-4 text-left">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1 block text-[13px] font-medium text-[#374151]"
                  >
                    First name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className={fieldIconClass} />
                    <input
                      id="firstName"
                      type="text"
                      required
                      aria-label="Full Name"
                      autoComplete="given-name"
                      placeholder="Nikhil"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputWithIconClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="mb-1 block text-[13px] font-medium text-[#374151]"
                  >
                    Last name
                  </label>
                  <div className="relative">
                    <UserIcon className={fieldIconClass} />
                    <input
                      id="lastName"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Adam"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputWithIconClass}
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label
                  htmlFor="phoneNumber"
                  className="mb-1 block text-[13px] font-medium text-[#374151]"
                >
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-xl border border-[#e5e7eb] bg-white transition focus-within:border-[#0f766e] focus-within:ring-4 focus-within:ring-[#0f766e]/10">
                  <select
                    id="phoneCountryCode"
                    aria-label="Country code"
                    value={phoneCountryCode}
                    onChange={(e) => setPhoneCountryCode(e.target.value)}
                    className="cursor-pointer rounded-l-xl border-r border-[#e5e7eb] bg-transparent py-2.5 pl-3.5 pr-2 text-sm font-medium text-[#374151] outline-none hover:bg-slate-50"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-full">
                    <PhoneIcon className={fieldIconClass} />
                    <input
                      id="phoneNumber"
                      type="tel"
                      inputMode="numeric"
                      placeholder="6381730716"
                      value={phoneNumber}
                      onChange={(e) =>
                        setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      className="w-full rounded-r-xl py-2.5 pl-10 pr-3.5 text-sm text-[#111827] placeholder:text-[#9ca3af] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-[13px] font-medium text-[#374151]"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MailIcon className={fieldIconClass} />
                  <input
                    id="email"
                    type="email"
                    required
                    aria-label="Email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputWithIconClass}
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#9ca3af]">
                  Preferably your university email, for faster approval.
                </p>
              </div>

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1 block text-[13px] font-medium text-[#374151]"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LockIcon className={fieldIconClass} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      aria-label="Password"
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Min 8 chars"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputWithIconClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] hover:text-[#4b5563]"
                    >
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1 block text-[13px] font-medium text-[#374151]"
                  >
                    Confirm password
                  </label>
                  <div className="relative">
                    <LockIcon className={fieldIconClass} />
                    <input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={inputWithIconClass}
                    />
                  </div>
                  {confirmPassword && confirmPassword !== password ? (
                    <p className="mt-1.5 text-[11px] font-medium text-red-500">
                      Passwords don&apos;t match
                    </p>
                  ) : null}
                </div>
              </div>

              {password ? (
                <div className="rounded-xl bg-[#f9fafb] p-3">
                  <PasswordRulesChecklist rules={passwordRules} />
                </div>
              ) : null}

              {/* Primary CTA Button */}
              <button
                type="submit"
                disabled={loading}
                aria-label="Get started"
                className="mt-1 flex w-full items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.99] active:bg-neutral-900 disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>Creating account…</span>
                  </span>
                ) : (
                  'Get started'
                )}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <p className="mt-5 text-center text-[13px] text-[#6b7280]">
            Already have an account?{' '}
            <a href="/login" className="font-semibold text-[#111827] underline hover:text-black">
              Login
            </a>
            <span className="mx-2 text-[#d1d5db]">·</span>
            Hiring?{' '}
            <a
              href="/company/register"
              className="font-semibold text-[#111827] underline hover:text-black"
            >
              Register as an employer
            </a>
          </p>
        </main>

        {/* Bottom Page Footer */}
        <footer className="mx-auto w-full max-w-5xl shrink-0 text-left text-xs text-[#9ca3af]">
          © 2026 All Rights Reserved
        </footer>
      </div>
    </AuthSplitShell>
  );
}

/** Shown after registration: the account can't sign in until the emailed link is confirmed. */
function CheckInbox({ email }: { email: string }) {
  return (
    <AuthSplitShell>
      <div className="flex min-h-dvh w-full flex-1 flex-col bg-white px-6 py-8 text-[#111827] font-sans sm:px-12 sm:py-10">
        <header className="mx-auto flex w-full max-w-5xl items-center lg:hidden">
          <SmartLogo tone="on-light" className="h-8 w-auto" />
        </header>
        <main className="mx-auto my-auto w-full max-w-[460px] py-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827] sm:text-[2.25rem]">
            Check your inbox
          </h1>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[#6b7280]">
            We sent a verification link to <strong className="text-[#111827]">{email}</strong>. Open
            it to activate your account, then sign in.
          </p>
          <ResendVerification email={email} />
          <a
            href="/login"
            className="mt-8 flex h-11 w-full items-center justify-center rounded-[11px] bg-black px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
          >
            Go to sign in
          </a>
        </main>
      </div>
    </AuthSplitShell>
  );
}
