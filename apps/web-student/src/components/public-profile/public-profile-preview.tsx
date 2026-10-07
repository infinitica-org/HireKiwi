'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { TierBadge, useQuery } from '@hirekiwi/ui';
import { PROFICIENCY_LEVEL_ORDER, type PublicCandidateProfileDto } from '@hirekiwi/contracts';
import {
  Award,
  Briefcase,
  CheckCircle2,
  Clock,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GraduationCap,
  Link2,
  Loader2,
  MessageSquare,
  Search,
  Share2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { CandidateAvatar } from '@/components/profile/CandidateAvatar';
import { SmartVerifiedBadge } from '@/components/profile/ProfileHeroBanner';
import { VisibilitySettingsCard } from '@/components/public-profile/visibility-settings-card';

const VERIFICATION_METHOD_LABELS: Record<string, string> = {
  ENDORSEMENT: 'Endorsed',
  LLM: 'AI-verified',
};

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  INTERNSHIP: 'Internship',
  CONTRACT: 'Contract',
};

type TabId = 'skills' | 'career' | 'projects' | 'certificates';

const TABS: { id: TabId; label: string }[] = [
  { id: 'skills', label: 'Skills' },
  { id: 'career', label: 'Career' },
  { id: 'projects', label: 'Projects' },
  { id: 'certificates', label: 'Certificates' },
];

function formatDate(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function titleCase(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(q));
}

/** Points for the strength chart: verified competency scores, else verified skill levels. */
function strengthPoints(profile: PublicCandidateProfileDto): { label: string; value: number }[] {
  if (profile.competencyEvidenceSummaries.length >= 3) {
    return profile.competencyEvidenceSummaries
      .slice(0, 6)
      .map((c) => ({ label: c.capabilityLabel, value: c.confidenceScore }));
  }
  const levels = PROFICIENCY_LEVEL_ORDER.length;
  return profile.skills.slice(0, 6).map((s) => ({
    label: s.skillName,
    value: (PROFICIENCY_LEVEL_ORDER.indexOf(s.proficiency) + 1) / levels,
  }));
}

function StrengthRadar({ points }: { points: { label: string; value: number }[] }) {
  const size = 220;
  const center = size / 2;
  const radius = 72;
  const angle = (i: number) => (Math.PI * 2 * i) / points.length - Math.PI / 2;
  const at = (i: number, r: number) =>
    `${String(center + r * Math.cos(angle(i)))},${String(center + r * Math.sin(angle(i)))}`;

  return (
    <svg
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      className="mx-auto w-full max-w-60"
      role="img"
      aria-label={`Skill strength: ${points.map((p) => `${p.label} ${String(Math.round(p.value * 100))}%`).join(', ')}`}
    >
      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={points.map((_, i) => at(i, radius * ring)).join(' ')}
          className="fill-none stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth="1"
        />
      ))}
      {points.map((_, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={center + radius * Math.cos(angle(i))}
          y2={center + radius * Math.sin(angle(i))}
          className="stroke-zinc-200 dark:stroke-zinc-700"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={points.map((p, i) => at(i, radius * Math.max(0.05, p.value))).join(' ')}
        className="fill-emerald-400/40 stroke-emerald-600"
        strokeWidth="1.5"
      />
      {points.map((p, i) => (
        <circle
          key={p.label}
          cx={center + radius * Math.max(0.05, p.value) * Math.cos(angle(i))}
          cy={center + radius * Math.max(0.05, p.value) * Math.sin(angle(i))}
          r="2.5"
          className="fill-emerald-700"
        />
      ))}
      {points.map((p, i) => {
        const x = center + (radius + 18) * Math.cos(angle(i));
        const y = center + (radius + 18) * Math.sin(angle(i));
        const anchor = Math.abs(x - center) < 4 ? 'middle' : x > center ? 'start' : 'end';
        return (
          <text
            key={p.label}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            className="fill-zinc-500 text-[9px] dark:fill-zinc-400"
          >
            {p.label.length > 14 ? `${p.label.slice(0, 13)}…` : p.label}
          </text>
        );
      })}
    </svg>
  );
}

function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
      {title ? (
        <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-white">{title}</h3>
      ) : null}
      {children}
    </div>
  );
}

function ItemCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200/80 bg-white p-4 dark:border-zinc-800 dark:bg-[#161616]">
      {children}
    </div>
  );
}

function Hidden() {
  return (
    <p className="text-sm italic text-zinc-400 dark:text-zinc-500">
      Hidden by your section privacy settings.
    </p>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{children}</p>;
}

function NoMatch({ query }: { query: string }) {
  return <Empty>Nothing here matches “{query}”.</Empty>;
}

function VerifiedPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
      <CheckCircle2 className="size-3.5" />
      {children}
    </span>
  );
}

/**
 * The student's public profile exactly as employers see it. Used by the /student/public-profile
 * page and (Th6-600) by the "Preview as recruiter" modal on the profile builder, where
 * `embedded` drops the page header, share buttons and visibility settings.
 */
export function PublicProfilePreview({ embedded = false }: { embedded?: boolean }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [tab, setTab] = useState<TabId>('skills');
  const [query, setQuery] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['me', 'public-profile'] as const,
    queryFn: () => api.users.getMyPublicProfile(),
  });
  const { data: link } = useQuery({
    queryKey: ['me', 'public-profile-link'] as const,
    queryFn: () => api.users.getPublicProfileLink(),
  });

  const trackLabel = profile
    ? [profile.trackCategory === 'MBA' ? 'MBA' : null, profile.trackName]
        .filter(Boolean)
        .join(' · ')
    : '';
  const headline = trackLabel ? `${trackLabel} candidate` : 'SMART candidate';

  const q = query.trim();
  const hidden = (section: string) => profile?.hiddenSections?.includes(section) ?? false;

  const filtered = useMemo(() => {
    if (!profile) return null;
    return {
      skills: profile.skills.filter((s) => matches(q, s.skillName, s.proficiency)),
      work: profile.workExperience.filter((w) => matches(q, w.role, w.companyName)),
      education: profile.education.filter((e) =>
        matches(q, e.institutionName, e.degree, e.fieldOfStudy),
      ),
      projects: profile.projects.filter((p) => matches(q, p.title, p.outcome, p.stack)),
      certificates: profile.externalCertificates.filter((c) =>
        matches(q, c.title, c.issuer, ...c.skills.map((s) => s.skillName)),
      ),
    };
  }, [profile, q]);

  const copyLink = async () => {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const shareLink = async () => {
    if (!link?.url) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.fullName ?? 'SMART candidate'}'s profile`,
          url: link.url,
        });
        return;
      } catch {
        // User dismissed the native share sheet — fall through to copy.
      }
    }
    void copyLink();
  };

  const points = profile ? strengthPoints(profile) : [];

  return (
    <div
      className={
        embedded
          ? 'w-full space-y-6 font-sans'
          : 'mx-auto w-full max-w-350 space-y-6 px-2 py-6 pb-16 font-sans sm:px-4 md:px-6'
      }
    >
      {/* Page header */}
      {!embedded ? (
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              Public Profile Preview
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                View Only
              </span>
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              This is exactly what an employer sees at your public link — no login required.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyLink()}
              disabled={!link?.url}
              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              <Link2 className="size-4" />
              {copyState === 'copied'
                ? 'Copied!'
                : copyState === 'error'
                  ? 'Copy failed'
                  : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={() => void shareLink()}
              disabled={!link?.url}
              className="inline-flex items-center gap-2 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-2xs hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              <Share2 className="size-4" />
              Share Profile
            </button>
          </div>
        </div>
      ) : null}

      {!embedded ? <VisibilitySettingsCard /> : null}

      {!profile || !filtered ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200/80 bg-white py-24 text-sm text-zinc-400 dark:border-zinc-800 dark:bg-[#161616]">
          <Loader2 className="size-4 animate-spin" /> Loading your profile…
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ── Left column: identity, strength, quick facts ── */}
          <aside className="space-y-4">
            <Panel>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                  {profile.fullName}
                </h2>
                {profile.skills.length > 0 ? (
                  <SmartVerifiedBadge role="img" aria-label="SMART verified" />
                ) : null}
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                {headline}
              </p>

              <div className="mt-4 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                <p className="flex items-center gap-2">
                  <MessageSquare className="size-3.5 text-zinc-400" />
                  {profile.acceptsEmployerMessages
                    ? 'Open to employer messages'
                    : 'Not accepting employer messages'}
                </p>
                {profile.lastUpdatedAt ? (
                  <p className="flex items-center gap-2">
                    <Clock className="size-3.5 text-zinc-400" />
                    Last updated {formatDate(profile.lastUpdatedAt)}
                  </p>
                ) : null}
              </div>

              {profile.certificate || profile.skills.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  {profile.certificate ? (
                    <TierBadge tier={profile.certificate.tier} showLabel />
                  ) : null}
                  {profile.skills.length > 0 ? <VerifiedPill>SMART Verified</VerifiedPill> : null}
                </div>
              ) : null}
            </Panel>

            <Panel title="Skill strength">
              {points.length >= 3 ? (
                <StrengthRadar points={points} />
              ) : (
                <Empty>Verify at least 3 skills to see your strength chart.</Empty>
              )}
            </Panel>

            <Panel title="At a glance">
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Verified skills', value: profile.skills.length },
                  { label: 'Projects', value: profile.projects.length },
                  { label: 'Experience', value: profile.workExperience.length },
                  { label: 'Certificates', value: profile.externalCertificates.length },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-900/60"
                  >
                    <dt className="text-[11px] text-zinc-500 dark:text-zinc-400">{stat.label}</dt>
                    <dd className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-white">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          </aside>

          {/* ── Right column: banner, tabs, search, content ── */}
          <section className="min-w-0 space-y-4">
            <div className="overflow-hidden rounded-lg border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
              <div className="relative h-36 bg-[#0d3b2e]">
                <p className="absolute right-6 bottom-5 text-sm font-medium text-emerald-100/90">
                  Verified skills · real projects · proven work
                </p>
              </div>
              <div className="relative px-6 pb-5">
                <div className="-mt-12 flex items-end gap-4">
                  <div
                    className={`relative size-24 shrink-0 rounded-full bg-white p-1 dark:bg-[#161616] ${
                      profile.acceptsEmployerMessages ? 'ring-4 ring-emerald-500' : ''
                    }`}
                  >
                    <CandidateAvatar
                      fullName={profile.fullName}
                      profilePhotoUrl={profile.profilePhotoUrl}
                      className="h-full w-full text-2xl font-bold"
                      fallbackClassName="rounded-full bg-zinc-100 text-2xl font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    />
                    {profile.acceptsEmployerMessages ? (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-white">
                        Open to work
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                role="tablist"
                aria-label="Profile sections"
                className="inline-flex gap-1 rounded-md border border-zinc-200/80 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
              >
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                    className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      tab === t.id
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950'
                        : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label className="relative block w-full sm:w-64">
                <span className="sr-only">Search this profile</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${TABS.find((t) => t.id === tab)?.label.toLowerCase() ?? ''}…`}
                  className="w-full rounded-md border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
              </label>
            </div>

            <Panel>
              {tab === 'skills' ? (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                    Verified Skills
                    <span className="font-normal text-zinc-400">
                      ({profile.skills.length} of {profile.declaredSkillsCount} declared)
                    </span>
                  </h3>
                  {hidden('skills') ? (
                    <Hidden />
                  ) : profile.skills.length === 0 ? (
                    <Empty>No verified skills yet.</Empty>
                  ) : filtered.skills.length === 0 ? (
                    <NoMatch query={q} />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filtered.skills.map((skill) => (
                        <span
                          key={skill.skillCode}
                          className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                        >
                          <CheckCircle2 className="size-3.5 text-emerald-600" />
                          <span className="text-sm font-medium text-zinc-900 dark:text-white">
                            {skill.skillName}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {titleCase(skill.proficiency)}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {tab === 'career' ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                      <Briefcase className="size-4 text-zinc-400" />
                      Work Experience
                    </h3>
                    {hidden('workExperience') ? (
                      <Hidden />
                    ) : profile.workExperience.length === 0 ? (
                      <Empty>No employer-verified work experience yet.</Empty>
                    ) : filtered.work.length === 0 ? (
                      <NoMatch query={q} />
                    ) : (
                      <div className="space-y-3">
                        {filtered.work.map((entry, idx) => (
                          <ItemCard key={`${entry.companyName}-${String(idx)}`}>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {entry.role} · {entry.companyName}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {EMPLOYMENT_TYPE_LABELS[entry.employmentType] ?? entry.employmentType}
                              {' · '}
                              {formatDate(entry.startDate)} –{' '}
                              {entry.isCurrent
                                ? 'Present'
                                : entry.endDate
                                  ? formatDate(entry.endDate)
                                  : '—'}
                            </p>
                          </ItemCard>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                      <GraduationCap className="size-4 text-zinc-400" />
                      Education
                    </h3>
                    {hidden('education') ? (
                      <Hidden />
                    ) : profile.education.length === 0 ? (
                      <Empty>No verified education entries yet.</Empty>
                    ) : filtered.education.length === 0 ? (
                      <NoMatch query={q} />
                    ) : (
                      <div className="space-y-3">
                        {filtered.education.map((entry, idx) => (
                          <ItemCard key={`${entry.institutionName}-${String(idx)}`}>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {entry.degree} {entry.fieldOfStudy ? `in ${entry.fieldOfStudy}` : ''}
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">
                              {entry.institutionName}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(entry.startDate)} –{' '}
                              {entry.current
                                ? 'Present'
                                : entry.endDate
                                  ? formatDate(entry.endDate)
                                  : '—'}
                              {entry.grade ? ` · Grade: ${entry.grade}` : ''}
                            </p>
                          </ItemCard>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              {tab === 'projects' ? (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                    <FolderGit2 className="size-4 text-zinc-400" />
                    Projects
                  </h3>
                  {hidden('projects') ? (
                    <Hidden />
                  ) : profile.projects.length === 0 ? (
                    <Empty>No projects submitted yet.</Empty>
                  ) : filtered.projects.length === 0 ? (
                    <NoMatch query={q} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                      {filtered.projects.map((project) => (
                        <ItemCard key={project.projectId}>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-zinc-900 dark:text-white">
                              {project.title}
                            </h4>
                            {project.status === 'VERIFIED' ? (
                              <VerifiedPill>
                                {project.score !== null
                                  ? `Verified · ${String(Math.round(project.score))}/100`
                                  : 'Verified'}
                              </VerifiedPill>
                            ) : null}
                            <div className="ml-auto flex items-center gap-2">
                              {project.githubUrl ? (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                  aria-label="GitHub repository"
                                >
                                  <GitBranch className="size-4" />
                                </a>
                              ) : null}
                              {project.liveUrl ? (
                                <a
                                  href={project.liveUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                                  aria-label="Live demo"
                                >
                                  <ExternalLink className="size-4" />
                                </a>
                              ) : null}
                            </div>
                          </div>
                          <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">
                            {project.outcome}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {project.stack
                              .split(',')
                              .map((tech) => tech.trim())
                              .filter(Boolean)
                              .map((tech) => (
                                <span
                                  key={tech}
                                  className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
                                >
                                  {tech}
                                </span>
                              ))}
                          </div>
                        </ItemCard>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {tab === 'certificates' ? (
                <>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                    <Award className="size-4 text-zinc-400" />
                    Certifications
                  </h3>
                  {hidden('certifications') ? (
                    <Hidden />
                  ) : profile.externalCertificates.length === 0 ? (
                    <Empty>No verified certifications yet.</Empty>
                  ) : filtered.certificates.length === 0 ? (
                    <NoMatch query={q} />
                  ) : (
                    <div className="space-y-3">
                      {filtered.certificates.map((cert, idx) => (
                        <ItemCard key={`${cert.title}-${String(idx)}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              {cert.title}
                            </p>
                            {cert.verificationMethod ? (
                              <VerifiedPill>
                                {VERIFICATION_METHOD_LABELS[cert.verificationMethod] ??
                                  cert.verificationMethod}
                              </VerifiedPill>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {cert.issuer}
                          </p>
                          {cert.skills.length > 0 ? (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {cert.skills.map((skill) => (
                                <span
                                  key={skill.skillName}
                                  className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                                >
                                  {skill.skillName} · {titleCase(skill.proficiency)}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </ItemCard>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </Panel>
          </section>
        </div>
      )}
    </div>
  );
}
