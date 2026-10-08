'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { EMAIL_NOT_VERIFIED_ERROR } from '@hirekiwi/contracts';
import { EyeIcon, EyeOffIcon } from '../../components/auth-icons';
import {
  CompanyIllustration,
  StudentIllustration,
  WelcomeIllustration,
} from '../../components/auth-illustrations';
import { ResendVerification } from '../../components/resend-verification';
import { api, buildGoogleOauthUrl, redirectForRole, storeSession } from '../../lib/api';
import { oauthErrorMessage } from '../../lib/oauth-error-message';

const inputClass =
  'w-full h-12 rounded-md border border-[#e5e7eb] bg-white px-3.5 text-sm text-[#111827] placeholder:text-[#9ca3af] transition-[border-color,box-shadow] duration-150 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10';

type Stage = 'identify' | 'password' | 'choose-signup';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<Stage>('identify');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(
    oauthErrorMessage(searchParams.get('oauthError')),
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onGoogleClick() {
    window.location.href = buildGoogleOauthUrl(searchParams.get('returnTo'));
  }

  async function onIdentifySubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { exists } = await api.auth.identify({ email: email.trim().toLowerCase() });
      setStage(exists ? 'password' : 'choose-signup');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function onPasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail(null);
    try {
      const result = await api.auth.login({ email, password });
      storeSession(result.accessToken);
      redirectForRole(result.user.role, result.accessToken, searchParams.get('returnTo'));
    } catch (err) {
      if (isHireKiwiApiError(err) && err.code === EMAIL_NOT_VERIFIED_ERROR) {
        setError(err.message);
        setUnverifiedEmail(email);
      } else if (
        isHireKiwiApiError(err) &&
        (err.code === 'institution_held' ||
          err.code === 'institution_deactivated' ||
          err.code === 'account_held')
      ) {
        setError(err.message);
      } else {
        setError('Login failed. Check your password.');
      }
    } finally {
      setLoading(false);
    }
  }

  function backToIdentify() {
    setStage('identify');
    setPassword('');
    setError(null);
    setUnverifiedEmail(null);
  }

  return (
    <section className="flex w-full flex-1 flex-col items-center justify-between text-center">
      <div className="my-auto flex w-full flex-col items-center justify-center pt-14 ">
        {stage === 'choose-signup' ? (
          <WelcomeIllustration className="h-20 w-auto" />
        ) : (
          <img src="/icon.png" alt="HireKiwi" className="mx-auto h-11 w-11 object-contain" />
        )}

        <h1 className="mt-4 text-[1.65rem] font-bold leading-tight tracking-tight text-[#111827] sm:text-[1.85rem]">
          {stage === 'choose-signup' ? "Let's get you set up" : 'Log in or sign up'}
        </h1>

        {error ? (
          <p
            role="alert"
            className="mt-5 w-full max-w-[420px] rounded-[11px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-left text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}

        {unverifiedEmail ? <ResendVerification email={unverifiedEmail} /> : null}

        {stage === 'identify' ? (
          <>
            <div className="mt-8 w-full max-w-[420px] space-y-4">
              <button
                type="button"
                onClick={onGoogleClick}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#e5e7eb] bg-white px-4 text-md font-semibold text-[#111827]  transition hover:bg-slate-50 active:scale-[0.99]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="w-full border-t border-[#e5e7eb]" />
                <span className="absolute bg-white px-3 text-xs font-medium text-[#9ca3af]">
                  or continue with Email
                </span>
              </div>
            </div>

            <form
              onSubmit={onIdentifySubmit}
              className="mt-2 w-full max-w-[420px] space-y-4 text-center mx-auto"
            >
              <div className="w-full">
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black px-5 text-md font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
              >
                <span>{loading ? 'Checking…' : 'Continue'}</span>
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : null}
              </button>
            </form>
          </>
        ) : null}

        {stage === 'password' ? (
          <form
            onSubmit={onPasswordSubmit}
            className="mt-8 w-full max-w-[420px] space-y-4 text-center mx-auto"
          >
            <div className="flex w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-slate-50 px-3.5 py-2.5 text-left text-sm text-[#111827]">
              <span className="truncate">{email}</span>
              <button
                type="button"
                onClick={backToIdentify}
                className="ml-3 shrink-0 text-xs font-medium text-[#111827] underline-offset-4 hover:underline"
              >
                Not you?
              </button>
            </div>

            <div className="w-full">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#9ca3af] transition hover:text-[#4b5563] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-black px-5 text-md font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
            >
              <span>{loading ? 'Signing in…' : 'Continue'}</span>
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : null}
            </button>

            <div className="flex items-center justify-end pt-1 text-[13px] w-full">
              <a
                href="/forgot-password"
                className="font-medium text-[#111827] underline-offset-4 transition hover:underline"
              >
                Forgot Password?
              </a>
            </div>
          </form>
        ) : null}

        {stage === 'choose-signup' ? (
          <div className="mt-8 w-full max-w-2xl space-y-6 text-center mx-auto">
            <p className="text-sm text-[#6b7280]">
              We couldn&apos;t find an account for <span className="font-medium">{email}</span>. How
              would you like to join HireKiwi?
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href={`/register?email=${encodeURIComponent(email)}`}
                className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0f766e]/40 hover:shadow-xl hover:shadow-[#0f766e]/10"
              >
                <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#0f766e]/5 transition-transform duration-300 group-hover:scale-125" />
                <StudentIllustration className="h-20 w-20" />
                <span className="mt-4 text-lg font-semibold text-[#111827]">
                  I&apos;m a student
                </span>
                <span className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                  Build a skill profile, get matched on real evidence, and get discovered by
                  verified employers.
                </span>

                <ul className="mt-3 space-y-1.5">
                  {['Evidence-backed profile', 'Matched to verified employers'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                      <svg
                        className="h-3 w-3 shrink-0 text-[#0f766e]"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#0f766e] px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#0b5c54]">
                  Create student account
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>

              <Link
                href={`/company/register?email=${encodeURIComponent(email)}`}
                className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#4338ca]/40 hover:shadow-xl hover:shadow-[#4338ca]/10"
              >
                <span className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#4338ca]/5 transition-transform duration-300 group-hover:scale-125" />
                <CompanyIllustration className="h-20 w-20" />
                <span className="mt-4 text-lg font-semibold text-[#111827]">I&apos;m hiring</span>
                <span className="mt-1 text-xs leading-relaxed text-[#6b7280]">
                  Source from a verified, evidence-backed talent pool and run your pipeline end to
                  end.
                </span>

                <ul className="mt-3 space-y-1.5">
                  {['Verified talent pool', 'End-to-end pipeline'].map((item) => (
                    <li key={item} className="flex items-center gap-1.5 text-[11px] text-[#4b5563]">
                      <svg
                        className="h-3 w-3 shrink-0 text-[#4338ca]"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#4338ca] px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-[#362ea3]">
                  Create company account
                  <svg
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={backToIdentify}
              className="text-xs font-medium text-[#6b7280] underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : null}
      </div>

      {/* Footer Legal Disclaimer */}
      <footer className="mx-auto mt-auto w-full max-w-2xl px-4 pt-6 text-center text-[12px] leading-relaxed text-neutral-400">
        By creating an account, you accept ou{' '}
        <Link
          href="/terms"
          className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-600 decoration-blue-400/50"
        >
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy"
          className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-600 decoration-blue-400/50"
        >
          Privacy Policy
        </Link>
        .We’ll send you periodic product news, career opportunities, and platform updates. You can
        easily unsubscribe at any time.
      </footer>
    </section>
  );
}
