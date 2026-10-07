'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { describeApiError } from '@hirekiwi/api-client';
import {
  COMPANY_SIZE_BANDS,
  COMPANY_SIZE_BAND_LABELS,
  COMPANY_WORK_EMAIL_REQUIRED_MESSAGE,
  isFreeMailDomain,
  type CompanySizeBand,
} from '@hirekiwi/contracts';
import { SmartLogo } from '@hirekiwi/ui';
import { api } from '../../../lib/api';
import { sanitizePhoneInput } from '../../../lib/phone-input';
import {
  clearCompanyOnboardingSessionToken,
  readCompanyOnboardingSessionToken,
  writeCompanyOnboardingSessionToken,
} from '../../../lib/company-onboarding-session';
import {
  companyQueryFromEmail,
  requestToJoinCompany,
  searchCompanies,
  type CompanySearchResult,
} from '../../../lib/company-directory';

const inputClass =
  'w-full h-11 rounded-[11px] border border-[#e5e7eb] bg-white px-3.5 text-sm text-[#111827] placeholder:text-[#9ca3af] transition-[border-color,box-shadow] duration-150 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10';

const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#6b7280]';

type Step =
  'account' | 'search' | 'join-sent' | 'details' | 'email' | 'documents' | 'submit' | 'done';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; items: readonly CompanySearchResult[] };

const STAGES = [
  { label: 'Account', steps: ['account'] },
  { label: 'Company', steps: ['search', 'details'] },
  { label: 'Verification', steps: ['join-sent', 'email', 'documents', 'submit', 'done'] },
] as const satisfies readonly { label: string; steps: readonly Step[] }[];

function errorMessage(err: unknown, fallback: string): string {
  return describeApiError(err, fallback);
}

export function CompanyRegisterWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('account');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState('');

  const [fullName, setFullName] = useState('');
  const [workEmail, setWorkEmail] = useState(searchParams.get('email') ?? '');
  const [website, setWebsite] = useState('https://');

  const [companyQuery, setCompanyQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [joinedCompany, setJoinedCompany] = useState<CompanySearchResult | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [sector, setSector] = useState('Software');
  const [mode, setMode] = useState<'PRODUCT' | 'SERVICE'>('PRODUCT');
  const [sizeBand, setSizeBand] = useState<CompanySizeBand>('51-200');
  const [publicEmail, setPublicEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('IN');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [relationship, setRelationship] = useState<
    'HR' | 'FOUNDER' | 'RECRUITER' | 'DIRECTOR' | 'OTHER'
  >('HR');
  const [taxId, setTaxId] = useState('');
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<{
    reason: string | null;
    rejectedDocuments: { documentId: string; fileName: string; reviewReason: string | null }[];
  } | null>(null);

  const resumeSession = useCallback(async (token: string) => {
    const session = await api.public.getCompanyOnboardingSession(token);
    setSessionToken(token);
    writeCompanyOnboardingSessionToken(token);
    if (session.representative.fullName) setFullName(session.representative.fullName);
    if (session.representative.workEmail) setWorkEmail(session.representative.workEmail);
    if (session.profile.displayName) setDisplayName(session.profile.displayName);
    if (session.profile.legalName) setLegalName(session.profile.legalName);
    if (session.profile.website) setWebsite(session.profile.website);
    setReviewFeedback(
      session.onboardingStatus === 'RESUBMISSION_ALLOWED'
        ? {
            reason: session.verificationReason ?? null,
            rejectedDocuments: session.documents.filter((doc) => doc.reviewStatus === 'REJECTED'),
          }
        : null,
    );
    if (session.onboardingStatus === 'PENDING_REVIEW' || session.onboardingStatus === 'SUBMITTED') {
      setStep('done');
      return;
    }
    if (
      session.onboardingStatus === 'EMAIL_VERIFIED' ||
      session.onboardingStatus === 'RESUBMISSION_ALLOWED'
    ) {
      setStep('documents');
      return;
    }
    if (session.onboardingStatus === 'EMAIL_VERIFICATION_PENDING') {
      setStep('email');
      return;
    }
    setStep('details');
  }, []);

  useEffect(() => {
    // The "changes needed" email links here with ?session=<token>; it wins over a stored token.
    const url = new URL(window.location.href);
    const fromLink = url.searchParams.get('session');
    if (fromLink) {
      url.searchParams.delete('session');
      window.history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    const existing = fromLink ?? readCompanyOnboardingSessionToken();
    if (!existing) return;
    resumeSession(existing).catch((err: unknown) => {
      clearCompanyOnboardingSessionToken();
      if (fromLink) {
        setError(errorMessage(err, 'This link has expired. Start a new registration below.'));
      }
    });
  }, [resumeSession]);

  useEffect(() => {
    if (step !== 'search') return;
    const query = companyQuery.trim();
    if (query.length < 2) {
      setSearch({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearch({ status: 'loading' });
      searchCompanies(query, controller.signal)
        .then((outcome) =>
          setSearch(
            outcome.available
              ? { status: 'ready', items: outcome.items }
              : { status: 'unavailable' },
          ),
        )
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setSearch({ status: 'ready', items: [] });
          setError(errorMessage(err, 'Company search failed. You can still create your company.'));
        });
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [step, companyQuery]);

  // Only flag a finished address, so the hint doesn't flash while the domain is still being typed.
  const personalEmailError =
    workEmail.includes('@') && workEmail.trim().includes('.') && isFreeMailDomain(workEmail)
      ? COMPANY_WORK_EMAIL_REQUIRED_MESSAGE
      : null;

  function onAccount(event: React.FormEvent) {
    event.preventDefault();
    if (isFreeMailDomain(workEmail)) {
      setError(COMPANY_WORK_EMAIL_REQUIRED_MESSAGE);
      return;
    }
    setError(null);
    setCompanyQuery((current) => current || companyQueryFromEmail(workEmail));
    setStep('search');
  }

  async function onCreateCompany() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.public.startCompanyOnboarding({
        representative: { fullName: fullName.trim(), workEmail: workEmail.trim() },
        website: website.trim().length > 8 ? website.trim() : undefined,
      });
      writeCompanyOnboardingSessionToken(result.sessionToken);
      setSessionToken(result.sessionToken);
      if (!displayName && companyQuery.trim()) setDisplayName(companyQuery.trim());
      setStep('details');
    } catch (err) {
      setError(errorMessage(err, 'Could not start registration.'));
    } finally {
      setLoading(false);
    }
  }

  async function onRequestJoin(company: CompanySearchResult) {
    setLoading(true);
    setError(null);
    try {
      await requestToJoinCompany(company.orgId, {
        fullName: fullName.trim(),
        workEmail: workEmail.trim(),
      });
      setJoinedCompany(company);
      setStep('join-sent');
    } catch (err) {
      setError(errorMessage(err, `Could not send a join request to ${company.displayName}.`));
    } finally {
      setLoading(false);
    }
  }

  async function onSaveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      await api.public.updateCompanyOnboardingDraft(sessionToken, {
        profile: {
          displayName: displayName.trim(),
          legalName: legalName.trim(),
          website: website.trim(),
          sector: sector.trim(),
          mode,
          sizeBand,
          publicEmail: publicEmail.trim() || workEmail.trim(),
          address: {
            line1: addressLine1.trim(),
            city: city.trim(),
            country: country.trim().toUpperCase(),
          },
        },
        representative: {
          phone: phone.trim(),
          jobTitle: jobTitle.trim(),
          relationship,
        },
        verification: {
          registrationCountry: country.trim().toUpperCase(),
          legalName: legalName.trim(),
          registeredAddress: {
            line1: addressLine1.trim(),
            city: city.trim(),
            country: country.trim().toUpperCase(),
          },
          taxId: taxId.trim() || undefined,
          businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
        },
      });
      await api.public.sendCompanyOnboardingEmailVerification(sessionToken);
      setStep('email');
    } catch (err) {
      setError(errorMessage(err, 'Could not save company details.'));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyEmail(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      await api.public.verifyCompanyOnboardingEmail(sessionToken, { code: emailCode.trim() });
      setStep('documents');
    } catch (err) {
      setError(errorMessage(err, 'Verification failed. Check the code in Mailpit (local dev).'));
    } finally {
      setLoading(false);
    }
  }

  async function onResendCode() {
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      await api.public.sendCompanyOnboardingEmailVerification(sessionToken);
    } catch (err) {
      setError(errorMessage(err, 'Could not resend code.'));
    } finally {
      setLoading(false);
    }
  }

  async function onUploadAndContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      if (documentFile) {
        await api.public.uploadCompanyOnboardingDocument(
          sessionToken,
          documentFile,
          'BUSINESS_REGISTRATION',
        );
      }
      setStep('submit');
    } catch (err) {
      setError(errorMessage(err, 'Document upload failed.'));
    } finally {
      setLoading(false);
    }
  }

  async function onSubmitApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionToken) return;
    setLoading(true);
    setError(null);
    try {
      await api.public.submitCompanyOnboarding(sessionToken, {
        attestations: { authorizedToRepresent: true, informationAccurate: true },
      });
      clearCompanyOnboardingSessionToken();
      setStep('done');
    } catch (err) {
      setError(errorMessage(err, 'Could not submit application.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="flex flex-col items-center text-center">
        <SmartLogo kind="text" tone="on-light" className="h-8 w-auto" title="SMART" />
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-[#111827]">
          Register your company
        </h1>
        <p className="mt-2 text-sm text-[#6b7280]">
          Create your master account, find your company or add it, then verify. After review, you
          will receive an invite to set your password.
        </p>
      </div>

      <StageIndicator step={step} />

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-[#f3c8cc] bg-[#fff1f2] px-4 py-3 text-sm text-[#c24141]"
        >
          {error}
        </p>
      ) : null}

      {step === 'account' ? (
        <form onSubmit={onAccount} className="mt-8 space-y-4">
          <p className="text-sm text-[#64748b]">
            This is the master login for your company on SMART. You can invite teammates later.
          </p>
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Your full name
            </label>
            <input
              id="fullName"
              required
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="workEmail" className={labelClass}>
              Work email
            </label>
            <input
              id="workEmail"
              type="email"
              required
              className={inputClass}
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              aria-invalid={personalEmailError ? true : undefined}
              aria-describedby={personalEmailError ? 'workEmail-error' : undefined}
            />
            {personalEmailError ? (
              <p id="workEmail-error" className="mt-1.5 text-xs text-[#c24141]">
                {personalEmailError}
              </p>
            ) : null}
          </div>
          <WizardActions loading={loading} primaryLabel="Continue" />
        </form>
      ) : null}

      {step === 'search' ? (
        <div className="mt-8 space-y-4">
          <div>
            <label htmlFor="companySearch" className={labelClass}>
              Find your company
            </label>
            <input
              id="companySearch"
              type="search"
              autoComplete="organization"
              placeholder="Company name or website"
              className={inputClass}
              value={companyQuery}
              onChange={(e) => setCompanyQuery(e.target.value)}
            />
          </div>

          <CompanySearchResults
            search={search}
            loading={loading}
            onJoin={(company) => void onRequestJoin(company)}
          />

          <div className="rounded-[11px] border border-dashed border-[#d1d5db] p-4">
            <p className="text-sm font-semibold text-[#111827]">Company not listed?</p>
            <p className="mt-1 text-sm text-[#6b7280]">
              Create it and become its first admin. SMART verifies every new company before it can
              post jobs.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => void onCreateCompany()}
                className="rounded-[11px] bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? 'Please wait…' : 'Create a new company'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep('account')}
                className="rounded-[11px] border border-[#e5e7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#111827] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {step === 'join-sent' && joinedCompany ? (
        <VerificationPanel
          title="Join request sent"
          items={[
            { label: 'Master account created', detail: workEmail, state: 'done' },
            { label: `Request sent to ${joinedCompany.displayName}`, state: 'done' },
            {
              label: 'Company admin approval',
              detail: 'An admin of this company reviews your request.',
              state: 'current',
            },
            {
              label: 'Portal invite',
              detail: 'Once approved, we email you a link to set your password.',
              state: 'todo',
            },
          ]}
        />
      ) : null}

      {step === 'details' ? (
        <form onSubmit={onSaveDetails} className="mt-8 space-y-4">
          <FieldGroup title="Company profile">
            <input
              required
              placeholder="Display name"
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <input
              required
              placeholder="Legal name"
              className={inputClass}
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
            />
            <input
              required
              type="url"
              aria-label="Company website"
              placeholder="Company website (https://…)"
              className={inputClass}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
            <input
              required
              placeholder="Sector"
              className={inputClass}
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                className={inputClass}
                value={mode}
                onChange={(e) => setMode(e.target.value as 'PRODUCT' | 'SERVICE')}
              >
                <option value="PRODUCT">Product company</option>
                <option value="SERVICE">Service company</option>
              </select>
              <select
                required
                aria-label="Number of employees"
                className={inputClass}
                value={sizeBand}
                onChange={(e) => setSizeBand(e.target.value as CompanySizeBand)}
              >
                {COMPANY_SIZE_BANDS.map((band) => (
                  <option key={band} value={band}>
                    {COMPANY_SIZE_BAND_LABELS[band]}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="email"
              placeholder="Public contact email"
              className={inputClass}
              value={publicEmail}
              onChange={(e) => setPublicEmail(e.target.value)}
            />
            <input
              required
              placeholder="Address line 1"
              className={inputClass}
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                required
                placeholder="City"
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <input
                required
                placeholder="Country (IN)"
                maxLength={2}
                className={inputClass}
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
              />
            </div>
          </FieldGroup>
          <FieldGroup title="Your role">
            <input
              required
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={16}
              pattern="\+?[0-9]{8,15}"
              title="Digits only, 8 to 15 digits, with an optional leading +"
              placeholder="Phone (digits only, e.g. +919876543210)"
              aria-label="Phone number"
              className={inputClass}
              value={phone}
              onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
            />
            <input
              required
              placeholder="Job title"
              className={inputClass}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <select
              className={inputClass}
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as typeof relationship)}
            >
              <option value="HR">HR</option>
              <option value="FOUNDER">Founder</option>
              <option value="RECRUITER">Recruiter</option>
              <option value="DIRECTOR">Director</option>
              <option value="OTHER">Other</option>
            </select>
          </FieldGroup>
          <FieldGroup title="Verification">
            <input
              placeholder="Tax / GST ID"
              className={inputClass}
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
            />
            <input
              placeholder="Business registration number"
              className={inputClass}
              value={businessRegistrationNumber}
              onChange={(e) => setBusinessRegistrationNumber(e.target.value)}
            />
          </FieldGroup>
          <WizardActions loading={loading} primaryLabel="Save and verify email" />
        </form>
      ) : null}

      {step === 'email' ? (
        <form onSubmit={onVerifyEmail} className="mt-8 space-y-4">
          <p className="text-sm text-[#64748b]">
            We sent a verification code to <strong>{workEmail}</strong>. In local dev, open{' '}
            <a
              href="http://localhost:8025"
              className="text-[#0f9f8f] underline"
              target="_blank"
              rel="noreferrer"
            >
              Mailpit
            </a>
            .
          </p>
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Verification code"
            className={inputClass}
            value={emailCode}
            onChange={(e) => setEmailCode(e.target.value)}
          />
          <WizardActions loading={loading} primaryLabel="Verify email" />
          <button
            type="button"
            disabled={loading}
            onClick={onResendCode}
            className="text-sm text-[#64748b] underline"
          >
            Resend code
          </button>
        </form>
      ) : null}

      {step === 'documents' && reviewFeedback ? (
        <div className="mt-8 space-y-2 rounded-lg border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#92400e]">
          <p className="font-semibold">Changes requested by the SMART review team</p>
          {reviewFeedback.reason ? <p>{reviewFeedback.reason}</p> : null}
          {reviewFeedback.rejectedDocuments.length > 0 ? (
            <>
              <p>Please upload these documents again:</p>
              <ul className="list-disc space-y-1 pl-5">
                {reviewFeedback.rejectedDocuments.map((doc) => (
                  <li key={doc.documentId}>
                    {doc.fileName}
                    {doc.reviewReason ? `: ${doc.reviewReason}` : ''}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}

      {step === 'documents' ? (
        <form onSubmit={onUploadAndContinue} className="mt-8 space-y-4">
          <p className="text-sm text-[#64748b]">
            Upload a business registration document (PDF, JPG, or PNG, max 5MB). You can skip and
            continue.
          </p>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className={inputClass}
            onChange={(e) => setDocumentFile(e.target.files?.[0] ?? null)}
          />
          <WizardActions
            loading={loading}
            primaryLabel="Continue"
            secondaryLabel="Skip"
            onSecondary={() => setStep('submit')}
          />
        </form>
      ) : null}

      {step === 'submit' ? (
        <form onSubmit={onSubmitApplication} className="mt-8 space-y-4">
          <p className="text-sm text-[#64748b]">
            By submitting, you confirm you are authorized to represent this company and that the
            information provided is accurate.
          </p>
          <WizardActions loading={loading} primaryLabel="Submit for review" />
        </form>
      ) : null}

      {step === 'done' ? (
        <VerificationPanel
          title="Application submitted"
          items={[
            { label: 'Master account created', detail: workEmail || undefined, state: 'done' },
            { label: 'Company details and work email verified', state: 'done' },
            {
              label: 'SMART verification review',
              detail: 'Our team checks your company details and documents.',
              state: 'current',
            },
            {
              label: 'Portal invite',
              detail: 'When approved, we email you a link to set your password and sign in.',
              state: 'todo',
            },
          ]}
        />
      ) : null}

      <p className="mt-10 text-center text-sm text-[#6b7280]">
        Already have an account?{' '}
        <Link
          href="/company/login"
          className="font-semibold text-[#111827] underline hover:text-black"
        >
          Sign in
        </Link>
      </p>
    </section>
  );
}

function StageIndicator({ step }: { step: Step }) {
  const current = STAGES.findIndex((stage) => (stage.steps as readonly Step[]).includes(step));
  return (
    <ol className="mt-8 flex items-center gap-2" aria-label="Registration progress">
      {STAGES.map((stage, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo';
        return (
          <li key={stage.label} className="flex flex-1 flex-col gap-1.5">
            <span
              className={`h-1 rounded-full ${state === 'todo' ? 'bg-[#e5e7eb]' : 'bg-black'}`}
            />
            <span
              aria-current={state === 'current' ? 'step' : undefined}
              className={`text-xs font-semibold ${state === 'todo' ? 'text-[#9ca3af]' : 'text-[#111827]'}`}
            >
              {stage.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function CompanySearchResults({
  search,
  loading,
  onJoin,
}: {
  search: SearchState;
  loading: boolean;
  onJoin: (company: CompanySearchResult) => void;
}) {
  if (search.status === 'idle') {
    return <p className="text-sm text-[#6b7280]">Type at least 2 characters to search.</p>;
  }
  if (search.status === 'loading') {
    return <p className="text-sm text-[#6b7280]">Searching…</p>;
  }
  if (search.status === 'unavailable') {
    return (
      <p className="rounded-[11px] bg-[#f8fafc] px-4 py-3 text-sm text-[#64748b]">
        Company search isn&apos;t available yet. Create your company below.
      </p>
    );
  }
  if (search.items.length === 0) {
    return <p className="text-sm text-[#6b7280]">No companies match that search.</p>;
  }
  return (
    <ul className="divide-y divide-[#e5e7eb] rounded-[11px] border border-[#e5e7eb]">
      {search.items.map((company) => (
        <li key={company.orgId} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#111827]">
              {company.displayName}
              {company.verified ? (
                <span className="ml-2 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-semibold text-[#047857]">
                  Verified
                </span>
              ) : null}
            </p>
            <p className="truncate text-xs text-[#6b7280]">
              {[company.website, company.city].filter(Boolean).join(' · ')}
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => onJoin(company)}
            className="shrink-0 rounded-[11px] border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-semibold text-[#111827] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98] disabled:opacity-70"
          >
            Request to join
          </button>
        </li>
      ))}
    </ul>
  );
}

function VerificationPanel({
  title,
  items,
}: {
  title: string;
  items: { label: string; detail?: string; state: 'done' | 'current' | 'todo' }[];
}) {
  return (
    <div className="mt-8 space-y-5 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6 text-sm text-[#334155]">
      <p className="text-base font-semibold text-[#172033]">{title}</p>
      <ol className="space-y-4">
        {items.map((item) => (
          <li key={item.label} className="flex gap-3">
            <span
              aria-hidden
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                item.state === 'done'
                  ? 'bg-black text-white'
                  : item.state === 'current'
                    ? 'border-2 border-black bg-white'
                    : 'border border-[#d1d5db] bg-white'
              }`}
            >
              {item.state === 'done' ? '✓' : ''}
            </span>
            <div>
              <p
                className={item.state === 'todo' ? 'text-[#9ca3af]' : 'font-medium text-[#172033]'}
              >
                {item.label}
                {item.state === 'current' ? (
                  <span className="ml-2 text-xs font-semibold text-[#b45309]">In progress</span>
                ) : null}
              </p>
              {item.detail ? <p className="mt-0.5 text-[#64748b]">{item.detail}</p> : null}
            </div>
          </li>
        ))}
      </ol>
      <Link
        href="/company/login"
        className="inline-block font-semibold text-black underline hover:opacity-80"
      >
        Back to sign in
      </Link>
    </div>
  );
}

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 rounded-[11px] border border-[#e5e7eb] p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function WizardActions({
  loading,
  primaryLabel,
  secondaryLabel,
  onSecondary,
}: {
  loading: boolean;
  primaryLabel: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        type="submit"
        disabled={loading}
        className="rounded-[11px] bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70"
      >
        {loading ? 'Please wait…' : primaryLabel}
      </button>
      {secondaryLabel && onSecondary ? (
        <button
          type="button"
          disabled={loading}
          onClick={onSecondary}
          className="rounded-[11px] border border-[#e5e7eb] bg-white px-5 py-3 text-sm font-semibold text-[#111827] shadow-sm transition-all hover:bg-slate-50 active:scale-[0.98]"
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
