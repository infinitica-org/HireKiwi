'use client';

import { useEffect, useState } from 'react';
import { isSmartApiError, queryKeys } from '@hirekiwi/api-client';
import { useQueryClient } from '@hirekiwi/ui';
import { Link2, Loader2, ArrowRight, Plus } from 'lucide-react';
import {
  applyServerDraft,
  buildProfessionalLinksSavePayload,
  emptyOnboardingForm,
  type OnboardingProfileForm,
} from '@/lib/onboarding-form';
import { api } from '@/lib/api';
import {
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import {
  CodingPlatformIntegrations,
  IntegrationCard,
} from '@/components/profile/CodingPlatformIntegrations';
import { profileSectionMeta } from '@/lib/profile-sections';
import { profilePrimaryButtonSmClass } from '@/lib/profile-ui-classes';
import { useOnboarding } from '@/lib/use-onboarding';
import type { FetchGithubProfileResponse } from '@hirekiwi/contracts';
import { AnimatePresence, motion } from 'motion/react';

// Brand SVG Icons
function GithubBrandIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className="size-9 shrink-0" fill="currentColor" {...props}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function LinkedinBrandIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className="size-9 shrink-0" fill="none" {...props}>
      <rect width="24" height="24" rx="4.8" fill="#0A66C2" />
      <path
        d="M19 19h-3.14v-4.92c0-1.17-.02-2.68-1.63-2.68-1.63 0-1.88 1.28-1.88 2.6v5H9.21V8.87h3.01v1.38h.04c.42-.8 1.45-1.63 2.98-1.63 3.19 0 3.77 2.1 3.77 4.83V19zM5.88 7.5a1.82 1.82 0 1 1 0-3.64 1.82 1.82 0 0 1 0 3.64zM7.45 19H4.31V8.87h3.14V19z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

type PlatformKey = 'github' | 'linkedin';

interface PlatformConfig {
  id: PlatformKey;
  name: string;
  description: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
  prefix: string;
  placeholder: string;
  defaultDomain: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Showcase your projects, contributions, and coding journey to recruiters.',
    icon: GithubBrandIcon,
    prefix: 'github.com/',
    placeholder: 'username',
    defaultDomain: 'https://github.com/',
  },
  // LinkedIn card hidden for now — uncomment to show it again.
  // {
  //   id: 'linkedin',
  //   name: 'LinkedIn',
  //   description: 'Connect your professional network and career accomplishments.',
  //   icon: LinkedinBrandIcon,
  //   prefix: 'linkedin.com/in/',
  //   placeholder: 'username',
  //   defaultDomain: 'https://linkedin.com/in/',
  // },
];

export function ProfessionalLinksSection() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error: queryError } = useOnboarding();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingProfileForm>(emptyOnboardingForm());
  const meta = profileSectionMeta('links');
  const [pickerOpen, setPickerOpen] = useState(false);

  const [activeModal, setActiveModal] = useState<PlatformKey | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [githubPreview, setGithubPreview] = useState<FetchGithubProfileResponse | null>(null);

  useEffect(() => {
    if (!data) return;
    const next = applyServerDraft(emptyOnboardingForm(), data.profile ?? data.draft);
    setFormData(next);
  }, [data]);

  useEffect(() => {
    if (isError) {
      setError(
        isSmartApiError(queryError)
          ? queryError.message
          : 'Could not load saved professional links.',
      );
    }
  }, [isError, queryError]);

  const getPlatformValue = (platformId: PlatformKey) => {
    if (platformId === 'github') return formData.githubUrl;
    if (platformId === 'linkedin') return formData.linkedinUrl;
    return '';
  };

  const isConnected = (platformId: PlatformKey) => {
    if (platformId === 'github') {
      return Boolean(formData.socialVerification.github?.verified || formData.githubUrl?.trim());
    }
    if (platformId === 'linkedin') {
      return Boolean(
        formData.socialVerification.linkedin?.verified || formData.linkedinUrl?.trim(),
      );
    }
    return false;
  };

  const isVerified = (platformId: PlatformKey) => {
    if (platformId === 'github') return Boolean(formData.socialVerification.github?.verified);
    if (platformId === 'linkedin') return Boolean(formData.socialVerification.linkedin?.verified);
    return false;
  };

  const handleOpenConnect = (platform: PlatformConfig) => {
    const currentVal = getPlatformValue(platform.id);
    let cleanVal = currentVal;
    if (cleanVal.startsWith(platform.defaultDomain)) {
      cleanVal = cleanVal.replace(platform.defaultDomain, '');
    } else if (cleanVal.startsWith('https://')) {
      cleanVal = cleanVal.replace('https://', '');
    }
    setInputValue(cleanVal);
    setModalError(null);
    setGithubPreview(null);
    setActiveModal(platform.id);
  };

  const handleSaveAll = async (updatedForm: OnboardingProfileForm) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildProfessionalLinksSavePayload(updatedForm);
      await api.users.saveOnboarding(payload);
      setFormData((current) => ({
        ...current,
        linkedinUrl: payload.linkedinUrl ?? '',
        githubUrl: payload.githubUrl ?? '',
      }));
      setSuccess('Professional links saved successfully.');
      await queryClient.invalidateQueries({ queryKey: queryKeys.myOnboarding() });
    } catch (err: unknown) {
      setError(isSmartApiError(err) ? err.message : 'Could not save professional links.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModal = async (platformId: PlatformKey) => {
    const trimmed = inputValue.trim();
    if (platformId === 'github') {
      const fullUrl = trimmed
        ? trimmed.startsWith('http')
          ? trimmed
          : `https://github.com/${trimmed}`
        : '';
      const nextForm = {
        ...formData,
        githubUrl: fullUrl,
        socialVerification: {
          ...formData.socialVerification,
          ...(fullUrl ? {} : { github: null }),
        },
      };
      setFormData(nextForm);
      await handleSaveAll(nextForm);
    } else if (platformId === 'linkedin') {
      const fullUrl = trimmed
        ? trimmed.startsWith('http')
          ? trimmed
          : `https://linkedin.com/in/${trimmed}`
        : '';
      const nextForm = {
        ...formData,
        linkedinUrl: fullUrl,
        socialVerification: {
          ...formData.socialVerification,
          ...(fullUrl ? {} : { linkedin: null }),
        },
      };
      setFormData(nextForm);
      await handleSaveAll(nextForm);
    }
    setActiveModal(null);
  };

  const handleDisconnect = async (platformId: PlatformKey) => {
    if (platformId === 'github') {
      const nextForm = {
        ...formData,
        githubUrl: '',
        socialVerification: {
          ...formData.socialVerification,
          github: null,
        },
      };
      setFormData(nextForm);
      await handleSaveAll(nextForm);
    } else if (platformId === 'linkedin') {
      const nextForm = {
        ...formData,
        linkedinUrl: '',
        socialVerification: {
          ...formData.socialVerification,
          linkedin: null,
        },
      };
      setFormData(nextForm);
      await handleSaveAll(nextForm);
    }
    setActiveModal(null);
  };

  const handleFetchGithub = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    const url = trimmed.startsWith('http') ? trimmed : `https://github.com/${trimmed}`;
    setActionLoading(true);
    setModalError(null);
    setGithubPreview(null);
    try {
      const profile = await api.users.fetchGithubProfile({ githubUrl: url });
      setGithubPreview(profile);
    } catch (err: unknown) {
      const message =
        isSmartApiError(err) && err.code === 'github_user_not_found'
          ? 'GitHub profile not found.'
          : 'Could not reach GitHub right now.';
      setModalError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmGithubProfile = async () => {
    if (!githubPreview) return;
    const fullUrl = `https://github.com/${githubPreview.login}`;
    const nextForm: OnboardingProfileForm = {
      ...formData,
      githubUrl: fullUrl,
      socialVerification: {
        ...formData.socialVerification,
        github: {
          verified: true,
          verifiedAt: new Date().toISOString(),
          login: githubPreview.login,
          name: githubPreview.name,
          avatarUrl: githubPreview.avatarUrl,
          publicRepoCount: githubPreview.publicRepoCount,
          selectedRepos: formData.socialVerification.github?.selectedRepos ?? [],
        },
      },
    };
    setFormData(nextForm);
    await handleSaveAll(nextForm);
    setActiveModal(null);
  };

  const handleVerifyLinkedin = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    setActionLoading(true);
    setModalError(null);
    try {
      const { url } = await api.users.linkedinOauthUrl();
      window.location.href = url;
    } catch {
      setModalError('Could not start LinkedIn verification right now.');
      setActionLoading(false);
    }
  };

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-3 font-sans select-none"
      aria-label="Professional links"
    >
      <ProfileSectionHeader
        title={meta.title}
        description={meta.description}
        action={
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`${profilePrimaryButtonSmClass} justify-center px-4 py-2.5 text-[13px] font-semibold tracking-[-0.01em]`}
          >
            <Plus className="size-4" strokeWidth={2} aria-hidden />
            Add integration
          </button>
        }
        evidenceType="PASSIVE_SIGNAL"
      />

      {isLoading ? <p className="text-sm text-zinc-500">Loading professional links…</p> : null}

      {!isLoading ? (
        <>
          {error ? <ProfileSectionError>{error}</ProfileSectionError> : null}
          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              {success}
            </div>
          ) : null}

          <div
            data-testid="integration-cards"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
          >
            {PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              const currentUrl = getPlatformValue(platform.id);
              const connected = isConnected(platform.id);
              return (
                <IntegrationCard
                  key={platform.id}
                  logo={<Icon />}
                  name={platform.name}
                  description={platform.description}
                  connected={connected}
                  verified={isVerified(platform.id)}
                  link={
                    connected && currentUrl
                      ? {
                          href: currentUrl.startsWith('http')
                            ? currentUrl
                            : `https://${currentUrl}`,
                          label: currentUrl.replace(/^https?:\/\//, ''),
                        }
                      : null
                  }
                  onAction={() => handleOpenConnect(platform)}
                />
              );
            })}
            <CodingPlatformIntegrations
              pickerOpen={pickerOpen}
              onPickerOpenChange={setPickerOpen}
            />
          </div>

          {/* Test and Automation Bridge */}
          <div data-testid="social-verification" className="hidden" aria-hidden="true" />

          {/* Connect Modal (Matching User Screenshot UI) */}
          <AnimatePresence>
            {activeModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 font-sans">
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  className="w-full max-w-[480px] rounded-md border border-zinc-200/90 bg-white p-7 sm:p-8 shadow-2xl dark:border-zinc-800 dark:bg-[#161616]"
                >
                  {(() => {
                    const isGh = activeModal === 'github';
                    const connected = isConnected(activeModal);
                    const modalTitle = isGh ? 'Connect with GitHub' : 'Connect with LinkedIn';
                    const modalSubtitle = isGh
                      ? 'Showcase your repositories, contributions, and activity heatmap.'
                      : 'Showcase your professional network, recommendations, and achievements.';
                    const inputLabel = isGh ? 'GitHub Username Or URL' : 'LinkedIn Profile Or URL';
                    const inputPlaceholder = isGh
                      ? 'username or https://github.com/username'
                      : 'username or https://linkedin.com/in/username';

                    return (
                      <div>
                        {/* Centered Top Brand Icon */}
                        <div className="mx-auto flex size-16 items-center justify-center rounded-md bg-zinc-50 border border-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-white">
                          {isGh ? (
                            <GithubBrandIcon className="size-10" />
                          ) : (
                            <LinkedinBrandIcon className="size-10" />
                          )}
                        </div>

                        {/* Centered Title & Subtitle */}
                        <h4 className="mt-4 text-center text-xl font-bold text-zinc-950 dark:text-white">
                          {modalTitle}
                        </h4>
                        <p className="mt-2 text-center text-sm text-zinc-500 leading-relaxed dark:text-zinc-400">
                          {modalSubtitle}
                        </p>

                        {/* Input Field */}
                        <div className="mt-6 text-left">
                          <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                            {inputLabel}
                          </label>
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={inputPlaceholder}
                            className="w-full h-12 rounded-md border border-zinc-200 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white"
                          />
                        </div>

                        {/* GitHub Specific Preview & Verification */}
                        {isGh && (
                          <div className="space-y-3 pt-3">
                            {!githubPreview && inputValue.trim() && (
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleFetchGithub}
                                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-3.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                              >
                                {actionLoading ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  <ArrowRight className="size-3.5" />
                                )}
                                Preview Profile Stats
                              </button>
                            )}

                            {modalError && (
                              <p className="text-xs text-rose-600 dark:text-rose-400">
                                {modalError}
                              </p>
                            )}

                            {githubPreview && (
                              <div className="flex items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
                                <img
                                  src={githubPreview.avatarUrl}
                                  alt=""
                                  className="size-10 rounded-full border border-emerald-300 object-cover"
                                />
                                <div className="min-w-0 flex-1 text-left">
                                  <p className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                                    {githubPreview.name || githubPreview.login}
                                  </p>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    @{githubPreview.login} · {githubPreview.publicRepoCount} public
                                    repos
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={confirmGithubProfile}
                                  className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                                >
                                  Confirm
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* LinkedIn OAuth button option */}
                        {!isGh && (
                          <div className="pt-2 text-left">
                            <button
                              type="button"
                              disabled={!inputValue.trim() || actionLoading}
                              onClick={handleVerifyLinkedin}
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-[#0a66c2]/30 bg-[#0a66c2]/10 px-3.5 text-xs font-semibold text-[#0a66c2] hover:bg-[#0a66c2]/15 disabled:opacity-50"
                            >
                              {actionLoading ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <LinkedinBrandIcon className="size-3.5" />
                              )}
                              Verify via LinkedIn OAuth
                            </button>
                            {modalError && (
                              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                {modalError}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Modal Action Buttons matching Screenshot */}
                        <div className="flex items-center justify-between mt-8 pt-2">
                          <button
                            type="button"
                            onClick={() => setActiveModal(null)}
                            className="rounded-md border border-zinc-200 bg-white px-6 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                          >
                            Cancel
                          </button>

                          <div className="flex items-center gap-2">
                            {connected && (
                              <button
                                type="button"
                                onClick={() => handleDisconnect(activeModal)}
                                className="text-xs font-semibold text-rose-600 hover:underline px-2"
                              >
                                Disconnect
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() => handleSaveModal(activeModal)}
                              className="rounded-md bg-[#6f8580] px-7 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-[#5f746f] active:scale-[0.99] disabled:opacity-50 transition"
                            >
                              {saving ? 'Connecting…' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      ) : null}
    </section>
  );
}
