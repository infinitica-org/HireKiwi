'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Check, Plus, Sparkles, X } from 'lucide-react';
import {
  COMPANY_ABOUT_MAX_LENGTH,
  COMPANY_EMPLOYEE_COUNT_LABELS,
  COMPANY_INDUSTRIES,
  MAX_ADDITIONAL_LOCATIONS,
  type CompanyProfile,
} from '@smart/contracts';
import {
  Alert,
  ErrorState,
  FormErrorSummary,
  FormMessage,
  LoadingState,
  VerifiedBadge,
} from '@smart/ui';
import { isSmartApiError } from '@smart/api-client';
import { api } from '@/lib/api';
import {
  EMPLOYEE_COUNT_OPTIONS,
  SOCIAL_NETWORKS,
  createKeyTracker,
  fieldErrorsFromError,
  isVersionConflict,
  toFormState,
  toUpdateBody,
  validateProfileBody,
  type ProfileFormState,
} from '@/lib/company-profile-form';
import { buildAboutDraft } from '../../../lib/about-template';
import { LocationInput } from '../../../components/location-input';
import { PageHeader } from '../../../components/ui';
import { input, label, pageStack, primaryButton, secondaryButton, textarea } from '../../../lib/ui';

export const COMPANY_PROFILE_QUERY_KEY = ['employer', 'company'] as const;

const VERIFY_BASE_URL = process.env.NEXT_PUBLIC_VERIFY_URL ?? 'http://localhost:3004';

export default function CompanyProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery<CompanyProfile>({
    queryKey: COMPANY_PROFILE_QUERY_KEY,
    queryFn: () => api.employer.getCompany(),
    retry: false,
  });

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{
    tone: 'success' | 'warning' | 'danger';
    text: string;
  } | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const keys = useRef(createKeyTracker());

  const profile = profileQuery.data;

  // (Re)load the form whenever a new server version arrives.
  useEffect(() => {
    if (profile) {
      setForm(toFormState(profile));
      setLogoPreview(profile.logoUrl);
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async (state: ProfileFormState) => {
      if (!profile) throw new Error('Profile not loaded');
      const body = toUpdateBody(state);
      const key = keys.current.keyFor(JSON.stringify({ body, version: profile.version }));
      return api.employer.updateCompany({ body, version: profile.version, idempotencyKey: key });
    },
    onSuccess: (updated) => {
      keys.current.reset();
      queryClient.setQueryData(COMPANY_PROFILE_QUERY_KEY, updated);
      setErrors({});
      setBanner({ tone: 'success', text: 'Company profile saved.' });
    },
    onError: (error) => {
      const fieldErrors = fieldErrorsFromError(error);
      if (fieldErrors) {
        setErrors(fieldErrors);
        setBanner(null);
      } else if (isVersionConflict(error)) {
        setBanner({
          tone: 'warning',
          text: 'Someone else changed this profile. Reload the latest version before saving again.',
        });
      } else {
        setBanner({ tone: 'danger', text: 'Could not save the profile. Please try again.' });
      }
    },
  });

  const uploadLogo = useMutation({
    mutationFn: (file: File) => api.employer.uploadLogo(file),
    onSuccess: (uploaded) => {
      setForm((prev) => (prev ? { ...prev, logoFileId: uploaded.logoFileId } : prev));
      setLogoPreview(uploaded.previewUrl);
    },
    onError: () =>
      setErrors((prev) => ({ ...prev, logoFileId: 'Upload a JPG or PNG of 2MB or less.' })),
  });

  const preview = useMemo(() => (form && profile ? { form, profile } : null), [form, profile]);

  if (profileQuery.isPending) {
    return (
      <div className={pageStack}>
        <LoadingState message="Loading your company profile…" />
      </div>
    );
  }

  if (profileQuery.isError || !profile || !form || !preview) {
    return (
      <div className={pageStack}>
        <ErrorState
          title="Could not load the company profile"
          message={
            // Show the server's reason (e.g. "not linked to a company", "access deactivated")
            // instead of always blaming the connection.
            isSmartApiError(profileQuery.error) && profileQuery.error.statusCode !== 0
              ? profileQuery.error.message
              : 'Check your connection and try again.'
          }
          onRetry={() => void profileQuery.refetch()}
        />
      </div>
    );
  }

  const set = <K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form) return;
    const clientErrors = validateProfileBody(toUpdateBody(form));
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;
    setBanner(null);
    save.mutate(form);
  }

  const sizeLabel = form.employeeCount
    ? `${COMPANY_EMPLOYEE_COUNT_LABELS[form.employeeCount as keyof typeof COMPANY_EMPLOYEE_COUNT_LABELS]} employees`
    : '';

  return (
    <div className={pageStack}>
      <PageHeader
        title="Company profile"
        description="What students see on your public company page."
        actions={
          profile.isVerified ? (
            <a
              href={`${VERIFY_BASE_URL}/companies/${profile.slug}`}
              target="_blank"
              rel="noreferrer"
              className={secondaryButton}
            >
              View public page
            </a>
          ) : null
        }
      />

      {!profile.isVerified ? (
        <Alert tone="info" title="Your public page is not live yet">
          Your company page becomes public once SMART verifies your company. You can prepare it now.
        </Alert>
      ) : null}
      {banner ? (
        <Alert tone={banner.tone} role={banner.tone === 'danger' ? 'alert' : 'status'}>
          <span className="flex flex-wrap items-center gap-3">
            {banner.tone === 'success' ? <Check className="size-4" aria-hidden /> : null}
            {banner.text}
            {banner.tone === 'warning' ? (
              <button
                type="button"
                className="font-semibold underline"
                onClick={() => {
                  setBanner(null);
                  void profileQuery.refetch();
                }}
              >
                Reload latest
              </button>
            ) : null}
          </span>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="min-w-0 space-y-6">
          <FormErrorSummary errors={errors} />

          <ProfileSection
            title="Company basics"
            description="Your name, logo and the essentials students look for first."
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {logoPreview ? (
                // Signed storage URL; not routed through next/image.
                <img
                  src={logoPreview}
                  alt=""
                  className="size-16 shrink-0 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <span className="flex size-16 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <Building2 className="size-7" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <label htmlFor="logo" className={label}>
                  Logo (JPG or PNG, max 2MB)
                </label>
                <input
                  id="logo"
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={uploadLogo.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogo.mutate(file);
                  }}
                  className="block w-full text-xs text-zinc-500 file:mr-3 file:rounded-md file:border file:border-zinc-200 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-700 hover:file:bg-zinc-50 dark:file:border-zinc-700 dark:file:bg-zinc-800 dark:file:text-zinc-200"
                />
                {uploadLogo.isPending ? (
                  <p className="mt-1 text-xs text-zinc-500">Uploading…</p>
                ) : null}
                <FormMessage error={errors.logoFileId} />
              </div>
            </div>

            <Field id="displayName" text="Company name" error={errors.displayName}>
              <input
                id="displayName"
                className={input}
                value={form.displayName}
                onChange={(e) => set('displayName', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="industry" text="Industry" error={errors.industry}>
                <select
                  id="industry"
                  className={input}
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                >
                  <option value="">Select an industry</option>
                  {COMPANY_INDUSTRIES.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="employeeCount" text="Employees" error={errors.employeeCount}>
                <select
                  id="employeeCount"
                  className={input}
                  value={form.employeeCount}
                  onChange={(e) => set('employeeCount', e.target.value)}
                >
                  <option value="">Select a size</option>
                  {EMPLOYEE_COUNT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field id="website" text="Website" error={errors.website}>
              <input
                id="website"
                className={input}
                placeholder="https://"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
              />
            </Field>
          </ProfileSection>

          <ProfileSection title="Locations" description="Where your teams work.">
            <Field id="headquarters" text="Headquarters" error={errors.headquarters}>
              <LocationInput
                id="headquarters"
                value={form.headquarters}
                onChange={(next) => set('headquarters', next)}
                className={input}
              />
            </Field>

            <div className="space-y-2">
              <span className={label}>Additional locations</span>
              {form.additionalLocations.map((location, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="flex-1">
                    <LocationInput
                      value={location}
                      onChange={(next) =>
                        set(
                          'additionalLocations',
                          form.additionalLocations.map((l, i) => (i === index ? next : l)),
                        )
                      }
                      className={input}
                    />
                    <FormMessage error={errors[`additionalLocations.${index}`]} />
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove location ${index + 1}`}
                    className="flex size-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-rose-600 dark:border-zinc-700"
                    onClick={() =>
                      set(
                        'additionalLocations',
                        form.additionalLocations.filter((_, i) => i !== index),
                      )
                    }
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              {form.additionalLocations.length < MAX_ADDITIONAL_LOCATIONS ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
                  onClick={() => set('additionalLocations', [...form.additionalLocations, ''])}
                >
                  <Plus className="size-4" aria-hidden /> Add location
                </button>
              ) : null}
            </div>
          </ProfileSection>

          <ProfileSection
            title="About & benefits"
            description="Tell students what it is like to work with you."
          >
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="about" className={`${label} mb-0`}>
                  About the company
                </label>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  onClick={() =>
                    set(
                      'about',
                      buildAboutDraft({
                        name: form.displayName,
                        industry: form.industry,
                        size: sizeLabel,
                        location: form.headquarters,
                      }),
                    )
                  }
                >
                  <Sparkles className="size-3.5" aria-hidden />
                  Draft from my details
                </button>
              </div>
              <textarea
                id="about"
                rows={6}
                className={textarea}
                value={form.about}
                onChange={(e) => set('about', e.target.value)}
              />
              <div className="mt-1 flex justify-between text-xs text-zinc-400">
                <FormMessage error={errors.about} />
                <span className="ml-auto tabular-nums">
                  {form.about.length}/{COMPANY_ABOUT_MAX_LENGTH}
                </span>
              </div>
            </div>

            <Field id="benefits" text="Benefits (one per line)" error={errors.benefits}>
              <textarea
                id="benefits"
                rows={4}
                className={textarea}
                placeholder={'Health insurance\nFlexible hours\nLearning budget'}
                value={form.benefitsText}
                onChange={(e) => set('benefitsText', e.target.value)}
              />
            </Field>
          </ProfileSection>

          <ProfileSection title="Social links" description="Optional. Shown on your public page.">
            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <legend className="sr-only">Social links</legend>
              {SOCIAL_NETWORKS.map((network) => (
                <Field
                  key={network}
                  id={`social-${network}`}
                  text={network.charAt(0).toUpperCase() + network.slice(1)}
                  error={errors[`socialLinks.${network}`]}
                >
                  <input
                    id={`social-${network}`}
                    className={input}
                    placeholder="https://"
                    value={form.social[network]}
                    onChange={(e) => set('social', { ...form.social, [network]: e.target.value })}
                  />
                </Field>
              ))}
            </fieldset>
          </ProfileSection>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className={secondaryButton}
              onClick={() => {
                setForm(toFormState(profile));
                setLogoPreview(profile.logoUrl);
                setErrors({});
              }}
            >
              Reset
            </button>
            <button type="submit" className={primaryButton} disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>

        <aside
          aria-label="Live preview"
          className="h-fit overflow-hidden rounded-md border border-zinc-200/80 bg-white shadow-2xs lg:sticky lg:top-4 dark:border-zinc-800 dark:bg-[#161616]"
        >
          <div className="h-20 bg-[radial-gradient(ellipse_80%_100%_at_0%_0%,rgba(225,255,160,0.55),transparent_70%),radial-gradient(ellipse_80%_100%_at_100%_100%,rgba(180,248,220,0.55),transparent_70%)] dark:bg-zinc-900" />
          <div className="-mt-8 px-5 pb-5">
            {logoPreview ? (
              // Signed storage URL; not routed through next/image.
              <img
                src={logoPreview}
                alt=""
                className="size-16 rounded-md border-4 border-white object-cover shadow-sm dark:border-[#161616]"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-md border-4 border-white bg-zinc-950 text-white shadow-sm dark:border-[#161616]">
                <Building2 className="size-7" aria-hidden />
              </span>
            )}
            <p className="mt-3 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
              Live preview
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                {preview.form.displayName || 'Company name'}
              </h2>
              <VerifiedBadge verified={profile.isVerified} verifiedAt={profile.verifiedAt} />
            </div>
            <p className="mt-0.5 text-xs text-zinc-500">
              {[preview.form.industry, sizeLabel, preview.form.headquarters]
                .filter(Boolean)
                .join(' · ') || 'Industry · size · location'}
            </p>
            <p className="mt-4 line-clamp-6 text-sm leading-relaxed whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {preview.form.about || 'Your company description appears here.'}
            </p>
            {preview.form.additionalLocations.filter(Boolean).length > 0 ? (
              <p className="mt-3 text-xs text-zinc-500">
                Also in: {preview.form.additionalLocations.filter(Boolean).join(', ')}
              </p>
            ) : null}
          </div>
        </aside>
      </form>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-zinc-200/80 bg-white p-6 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
      <div className="mb-5 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  id,
  text,
  error,
  children,
}: {
  id: string;
  text: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {children}
      <FormMessage error={error} />
    </div>
  );
}
