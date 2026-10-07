'use client';

import { useRef } from 'react';
import { Camera, Loader2, CheckCircle2, Building2, Users, Briefcase, Award } from 'lucide-react';
import type { SchoolPublicProfile } from '../../lib/school-public-profile';
import { isInstitutionVerified } from '../../lib/school-public-profile';
import { bentoCardClass } from '../../lib/tpo-dashboard-ui';

const DEFAULT_BANNER_CLASS =
  'h-[150px] w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-zinc-900 md:h-[180px] relative overflow-hidden';

type SchoolProfileCardProps = {
  profile: SchoolPublicProfile;
  logoUrl: string | null;
  bannerUrl: string | null;
  employersRecruitingCount?: number | null;
  placementRatePercent?: number | null;
  uploadingLogo?: boolean;
  uploadingBanner?: boolean;
  onPickLogo: (file: File) => void;
  onPickBanner: (file: File) => void;
};

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Math.round(value)}%`;
}

export function SchoolProfileCard({
  profile,
  logoUrl,
  bannerUrl,
  employersRecruitingCount = null,
  placementRatePercent = null,
  uploadingLogo = false,
  uploadingBanner = false,
  onPickLogo,
  onPickBanner,
}: SchoolProfileCardProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const verified = isInstitutionVerified(profile.verificationStatus);
  const studentCount = profile.candidateUsage.toLocaleString('en-US');
  const employerStat =
    employersRecruitingCount != null ? employersRecruitingCount.toLocaleString('en-US') : '—';

  return (
    <article
      aria-labelledby="school-profile-heading"
      className={`${bentoCardClass} overflow-hidden !p-0 border border-zinc-200/80 bg-white shadow-xs rounded-2xl`}
    >
      {/* Header Banner */}
      <div className="relative group overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="h-[150px] w-full object-cover md:h-[180px]" />
        ) : (
          <div className={DEFAULT_BANNER_CLASS} aria-hidden>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_70%)]" />
          </div>
        )}
        <button
          type="button"
          disabled={uploadingBanner}
          aria-label={bannerUrl ? 'Change cover banner' : 'Upload cover banner'}
          onClick={() => bannerInputRef.current?.click()}
          className="absolute right-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-black/60 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer shadow-sm"
        >
          {uploadingBanner ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <Camera className="size-3.5" aria-hidden />
          )}
          {bannerUrl ? 'Change banner' : 'Add banner'}
        </button>
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onPickBanner(file);
            event.target.value = '';
          }}
        />
      </div>

      {/* Profile Details Container */}
      <div className="px-6 pb-6 pt-0 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          {/* Logo Badge */}
          <div className="relative -mt-12 size-[92px] shrink-0 sm:-mt-14 sm:size-[104px]">
            <div className="flex size-full items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-zinc-50 shadow-md">
              {logoUrl ? (
                <img src={logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400">
                  <Building2 className="size-8 stroke-[1.5]" />
                  <span className="mt-0.5 text-[10px] font-semibold tracking-wider uppercase text-zinc-400">
                    Logo
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={uploadingLogo}
              aria-label={logoUrl ? 'Change school logo' : 'Upload school logo'}
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-60 cursor-pointer"
            >
              {uploadingLogo ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-3.5" aria-hidden />
              )}
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onPickLogo(file);
                event.target.value = '';
              }}
            />
          </div>

          {/* Title & Metadata Badges */}
          <div className="min-w-0 flex-1 pt-2 sm:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                id="school-profile-heading"
                className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl"
              >
                {profile.institutionName}
              </h1>
              {verified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-600">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-700">
                <Users className="size-3.5 text-zinc-500" />
                {studentCount} students on HireKiwi
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-zinc-700">
                4-year institution
              </span>
            </div>
          </div>
        </div>

        {/* About Bio */}
        {profile.about ? (
          <p className="mt-5 text-sm leading-relaxed text-zinc-600 max-w-3xl">{profile.about}</p>
        ) : null}

        {/* Highlights / Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-2 max-w-md">
          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 transition hover:bg-zinc-50">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Award className="size-4 text-emerald-600" />
              <span>Placement Rate</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl font-mono">
              {formatPercent(placementRatePercent)}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 transition hover:bg-zinc-50">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Briefcase className="size-4 text-teal-600" />
              <span>Employers Recruiting</span>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl font-mono">
              {employerStat}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
