'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  Briefcase,
  Check,
  CircleCheck,
  Plus,
  Search,
  SlidersHorizontal,
  Target,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { cn, VerifiedBadge } from '@hirekiwi/ui';
import { tintFor } from '@/components/dashboard/OpportunityFeed';
import { motion } from 'motion/react';
import { useProfileProgress } from '@/lib/use-profile-progress';
import { canVerifySkills } from '@/lib/profile-progress';
import { api, apiClient } from '@/lib/api';
import { API_PREFIX, type StudentJobCard } from '@hirekiwi/contracts';
import { queryKeys } from '@hirekiwi/api-client';
import { useQuery } from '@hirekiwi/ui';

export interface JobMatch {
  id: string;
  title: string;
  company: string;
  logoText: string;
  location: string;
  type: 'Full-time' | 'Internship' | 'Part-time' | 'Contract';
  salary: string;
  matchScore: number;
  matchReason: string;
  tags: string[];
  description: string;
  companyAbout: string;
  companyProfileUrl: string;
  requiredSkills: { name: string; level: string; met: boolean; note: string }[];
  postedDaysAgo: number;
  deadline?: string;
  /** True when the student has already applied to this opening. */
  applied?: boolean;
  /** Remote, Hybrid or On-site, when the company said. */
  mode?: string;
  /** Years of experience asked for, e.g. "0–2 years". */
  experience?: string;
  openings?: number;
  /** The first few required skills, by name. */
  skills: string[];
}

type TabType = 'jobs' | 'applied' | 'saved';
type SortOption = 'best-match' | 'newest' | 'pay';
type JobTypeFilter = 'all' | 'Full-time' | 'Internship' | 'Part-time';

interface AppliedApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  logoText: string;
  location: string;
  salary: string;
  appliedDate: string;
  status: 'Applied' | 'Viewed' | 'Interviewing' | 'Rejected' | 'Hired';
  companyVerified?: boolean;
  companyVerifiedAt?: string | null;
}

const EMPLOYMENT_LABELS: Record<string, JobMatch['type']> = {
  INTERNSHIP: 'Internship',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
};
const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'On-site',
};

function experienceLabel(min: number | null, max: number | null): string | undefined {
  if (min === null && max === null) return undefined;
  const low = min ?? 0;
  const high = max ?? low;
  if (high === 0) return 'Fresher';
  return low === high ? `${low} years` : `${low}–${high} years`;
}

/** One real job card from the API as a card on this page. Only facts the API gave us. */
function jobCardToMatch(job: StudentJobCard): JobMatch {
  const posted = Date.parse(job.postedAt);
  const postedDaysAgo = Number.isNaN(posted)
    ? 0
    : Math.max(0, Math.floor((Date.now() - posted) / 86_400_000));
  return {
    id: job.id,
    title: job.roleTitle,
    company: job.companyName,
    logoText: job.companyName.slice(0, 2).toUpperCase(),
    location: job.location ?? '',
    type: EMPLOYMENT_LABELS[job.employmentType ?? ''] ?? 'Full-time',
    salary: job.salary ?? '',
    matchScore: job.fit?.matchPercent ?? 0,
    matchReason: job.fit?.topReason ?? '',
    tags: job.tags,
    skills: job.skills,
    mode: job.workMode ? (WORK_MODE_LABELS[job.workMode] ?? job.workMode) : undefined,
    experience: experienceLabel(job.minYearsExperience, job.maxYearsExperience),
    openings: job.openings ?? undefined,
    description: '',
    companyAbout: '',
    companyProfileUrl: '#',
    requiredSkills: [],
    postedDaysAgo,
    deadline: job.lastDateToApply ? `Apply by ${job.lastDateToApply}` : undefined,
    applied: job.applied,
  };
}

export default function MatchesPage() {
  const router = useRouter();
  const { progress, loading: profileLoading } = useProfileProgress();
  const profilePercent = progress?.percent ?? 33;
  const isVerified = canVerifySkills(profilePercent);

  const [activeTab, setActiveTab] = useState<TabType>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState<JobTypeFilter>('all');
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('best-match');

  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: queryKeys.myApplications(),
    queryFn: () => api.placement.listMyApplications(),
  });

  // Map real database applications to applied tracking rows
  const realDbApplications = appsData?.applications ?? [];

  const appliedApplications: AppliedApplication[] = useMemo(() => {
    return realDbApplications.map((app) => ({
      id: app.applicationId,
      jobId: app.applicationId,
      title: app.roleTitle || 'Untitled role',
      company: app.companyName || 'Company',
      companyVerified: app.companyVerified === true,
      companyVerifiedAt: app.companyVerifiedAt ?? null,
      logoText: (app.companyName || 'CO').slice(0, 2).toUpperCase(),
      location: app.location || '',
      salary: '',
      appliedDate: 'Active',
      status: (app.stage as AppliedApplication['status']) || 'Applied',
    }));
  }, [realDbApplications]);

  // Every open job the student can see, from the real job feed (company jobs and university jobs).
  const {
    data: jobsData,
    isLoading: jobsLoading,
    error: jobsError,
  } = useQuery({
    queryKey: ['student', 'jobs', 'matches-page'] as const,
    queryFn: () => api.studentJobs.list({ fit: 'ALL', limit: 50 }),
    retry: false,
  });

  const liveMatches: JobMatch[] = useMemo(
    () => (jobsData?.jobs ?? []).map((job) => jobCardToMatch(job)),
    [jobsData],
  );

  // Start from what the server says is saved, then follow the student's clicks.
  useEffect(() => {
    if (!jobsData) return;
    setSavedJobIds(new Set(jobsData.jobs.filter((job) => job.saved).map((job) => job.id)));
  }, [jobsData]);

  const toggleSave = (jobId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const wasSaved = savedJobIds.has(jobId);
    const apply = (saved: boolean) =>
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
    apply(!wasSaved);
    const call = wasSaved ? api.studentJobs.unsave(jobId) : api.studentJobs.save(jobId);
    call.catch(() => apply(wasSaved));
  };

  const [matchFeedback, setMatchFeedback] = useState<Record<string, 'RELEVANT' | 'NOT_RELEVANT'>>(
    {},
  );

  const handleMatchFeedback = async (
    jobId: string,
    rating: 'RELEVANT' | 'NOT_RELEVANT',
    e?: React.MouseEvent,
  ) => {
    e?.stopPropagation();
    setMatchFeedback((prev) => ({ ...prev, [jobId]: rating }));
    // Only real openings carry a UUID; synthesised match cards (match-<claimId>)
    // have no opening to attach feedback to, so skip the API call rather than
    // sending a non-UUID that the server rejects.
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(jobId);
    if (!isUuid) return;
    try {
      await apiClient.post(`${API_PREFIX}/placement/feedback/student`, {
        openingId: jobId,
        rating,
      });
    } catch {
      // Ignore network errors on feedback
    }
  };

  const handleApply = (job: JobMatch, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // The job page owns eligibility checks and the real application.
    router.push(`/student/jobs/${job.id}?apply=1`);
  };

  // Every open job, best fits first (see the sort below).
  const jobs = liveMatches;
  const savedJobs = useMemo(
    () => liveMatches.filter((j) => savedJobIds.has(j.id)),
    [liveMatches, savedJobIds],
  );

  const filteredAndSortedJobs = useMemo(() => {
    let list: JobMatch[] = [];
    if (activeTab === 'jobs') list = jobs;
    else if (activeTab === 'saved') list = savedJobs;
    else return [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)) ||
          j.matchReason.toLowerCase().includes(q),
      );
    }

    if (jobTypeFilter !== 'all') {
      list = list.filter((j) => j.type === jobTypeFilter);
    }

    if (remoteOnly) {
      list = list.filter((j) => j.location.toLowerCase().includes('remote') || j.mode === 'Remote');
    }

    const sorted = [...list];
    if (sortBy === 'best-match') {
      sorted.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortBy === 'newest') {
      sorted.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    } else if (sortBy === 'pay') {
      sorted.sort((a, b) => b.salary.localeCompare(a.salary));
    }

    return sorted;
  }, [activeTab, jobs, savedJobs, searchQuery, jobTypeFilter, remoteOnly, sortBy]);

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-16 pt-2 font-sans select-none">
      {/* 🚀 Top Header */}
      <section className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              Jobs
            </h1>
            <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
              Open jobs from verified companies and your university, best fit first
            </p>
          </div>
        </div>
      </section>

      {/* ⚠️ Unverified State Gate */}
      {!isVerified && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-amber-200 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-bold">Verify your profile to unlock matches</p>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                You currently have {profilePercent}% profile readiness. Complete your experiences
                and verify skills to unlock match ranking.
              </p>
            </div>
          </div>
          <Link
            href="/student/profile"
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-amber-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-amber-800 dark:bg-amber-400 dark:text-zinc-950 shrink-0"
          >
            Go to verification
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* 🧭 Top Bar: Tabs & Search */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/student/jobs"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            All jobs
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
          {/* Animated Tabs */}
          <div className="flex w-full items-center gap-2 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none] dark:border-zinc-800 [&::-webkit-scrollbar]:hidden">
            {[
              { key: 'jobs', label: 'Jobs', count: jobs.length },
              { key: 'applied', label: 'Applied', count: appliedApplications.length },
              { key: 'saved', label: 'Saved', count: savedJobs.length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key as TabType)}
                className={cn(
                  'relative -mb-px flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150',
                  activeTab === tab.key
                    ? 'font-semibold text-zinc-950 dark:text-white'
                    : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white',
                )}
              >
                {activeTab === tab.key && (
                  <motion.span
                    layoutId="active-matches-tab"
                    className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-zinc-900 dark:bg-white"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                    tab.key === 'jobs'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by role, company, skill..."
              className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        </div>

        {/* Filters & Sort Controls */}
        {activeTab !== 'applied' && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-zinc-100 py-3 dark:border-zinc-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
                <SlidersHorizontal className="size-3.5" />
                Filters:
              </span>

              <select
                value={jobTypeFilter}
                onChange={(e) => setJobTypeFilter(e.target.value as JobTypeFilter)}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="all">All Job Types</option>
                <option value="Full-time">Full-time</option>
                <option value="Internship">Internship</option>
                <option value="Part-time">Part-time</option>
              </select>

              <button
                type="button"
                onClick={() => setRemoteOnly(!remoteOnly)}
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors shadow-2xs',
                  remoteOnly
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                )}
              >
                Remote Only
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-500 dark:text-zinc-400">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-2xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                <option value="best-match">Best Match</option>
                <option value="newest">Newest</option>
                <option value="pay">Highest Pay</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* 📦 Main Content Area */}
      {activeTab === 'applied' ? (
        /* Applied Tab Content */
        <div className="space-y-4">
          {appliedApplications.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <Briefcase className="mx-auto size-8 text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No applications submitted yet
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Browse your matched jobs and submit verified applications with one click.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              >
                Explore Jobs
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {appliedApplications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-md border border-zinc-200/80 bg-white p-4 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100 font-bold text-xs text-zinc-800 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                      {app.logoText}
                    </div>
                    <div>
                      <h3 className="font-heading text-sm font-bold text-zinc-950 dark:text-white">
                        {app.title}
                      </h3>
                      <p className="flex flex-wrap items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {app.company}
                        <VerifiedBadge
                          verified={app.companyVerified === true}
                          verifiedAt={app.companyVerifiedAt}
                          variant="icon"
                        />
                        · {app.location} · {app.salary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
                        app.status === 'Applied' &&
                          'border border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300',
                        app.status === 'Viewed' &&
                          'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300',
                        app.status === 'Interviewing' &&
                          'border border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-900 dark:bg-purple-950/50 dark:text-purple-300',
                        app.status === 'Hired' &&
                          'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300',
                        app.status === 'Rejected' &&
                          'border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
                      )}
                    >
                      ● {app.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Matches Grid */
        <div className="space-y-4">
          {jobsError ? (
            <p
              role="alert"
              className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              Could not load jobs right now. Please refresh the page.
            </p>
          ) : null}
          {profileLoading || appsLoading || jobsLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400">Loading jobs…</div>
          ) : filteredAndSortedJobs.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <Target className="mx-auto size-8 text-zinc-400 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No matching opportunities in this filter
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Add more skills or projects to improve matches.
              </p>
              <Link
                href="/student/skills"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              >
                <Plus className="size-3.5" />
                Add More Skills
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredAndSortedJobs.map((job) => {
                const isSaved = savedJobIds.has(job.id);
                const isApplied =
                  job.applied === true || appliedApplications.some((a) => a.jobId === job.id);

                return (
                  <article
                    key={job.id}
                    onClick={() => router.push(`/student/jobs/${job.id}`)}
                    className="group flex h-full cursor-pointer flex-col rounded-lg border border-zinc-200/80 bg-white p-5 font-sans shadow-2xs transition-colors hover:border-zinc-300 sm:p-6 dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3.5">
                        <span
                          aria-hidden
                          className={cn(
                            'flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold',
                            tintFor(job.company),
                          )}
                        >
                          {job.company.trim().charAt(0).toUpperCase() || '?'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm text-zinc-900 dark:text-white">
                            <span className="font-semibold">{job.company}</span>
                            {job.location ? (
                              <span className="ml-1.5 text-zinc-400">{job.location}</span>
                            ) : null}
                          </p>
                          {job.matchScore > 0 ? (
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                              {job.matchScore}% skills match
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => toggleSave(job.id, e)}
                        aria-pressed={isSaved}
                        title={isSaved ? 'Remove from saved' : 'Save job'}
                        aria-label={isSaved ? 'Remove from saved' : 'Save job'}
                        className={cn(
                          'flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                          isSaved
                            ? 'bg-amber-50 text-amber-500 dark:bg-amber-950/40'
                            : 'bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:bg-zinc-800 dark:hover:text-white',
                        )}
                      >
                        <Bookmark className={cn('size-4', isSaved && 'fill-current')} />
                      </button>
                    </div>

                    <h3 className="mt-4 text-lg font-medium tracking-tight text-zinc-950 dark:text-white">
                      {job.title}
                    </h3>

                    {job.tags.length > 0 || job.skills.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {job.tags.map((tag) => (
                          <span
                            key={`tag-${tag}`}
                            className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          >
                            {tag}
                          </span>
                        ))}
                        {job.skills.map((skill) => (
                          <span
                            key={`skill-${skill}`}
                            className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-auto space-y-4 pt-4">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                        {job.matchScore >= 70 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CircleCheck className="size-3.5" />
                            Matches your profile
                          </span>
                        ) : null}
                        {[
                          job.type,
                          job.mode,
                          job.salary,
                          job.experience,
                          job.openings
                            ? `${job.openings} opening${job.openings === 1 ? '' : 's'}`
                            : undefined,
                          job.deadline,
                        ]
                          .filter((text) => Boolean(text))
                          .map((text) => (
                            <span key={text} className="inline-flex items-center gap-3">
                              <span aria-hidden>·</span>
                              {text}
                            </span>
                          ))}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleMatchFeedback(job.id, 'RELEVANT', e)}
                            title="Relevant match (I377)"
                            aria-label="Relevant match"
                            className={cn(
                              'flex size-8 items-center justify-center rounded-md transition-colors',
                              matchFeedback[job.id] === 'RELEVANT'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-emerald-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-emerald-400',
                            )}
                          >
                            <ThumbsUp className="size-4" strokeWidth={1.75} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleMatchFeedback(job.id, 'NOT_RELEVANT', e)}
                            title="Not relevant match (I377)"
                            aria-label="Not relevant match"
                            className={cn(
                              'flex size-8 items-center justify-center rounded-md transition-colors',
                              matchFeedback[job.id] === 'NOT_RELEVANT'
                                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'text-zinc-400 hover:bg-zinc-100 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-rose-400',
                            )}
                          >
                            <ThumbsDown className="size-4" strokeWidth={1.75} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            href={`/student/jobs/${job.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center rounded-md border border-zinc-200 px-3.5 py-2 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                          >
                            View more
                          </Link>
                          {isApplied ? (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-3.5 py-2 text-[13px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                              <Check className="size-3.5" />
                              Applied
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleApply(job, e)}
                              className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                            >
                              Apply
                              <ArrowRight className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
