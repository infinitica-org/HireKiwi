'use client';

import Link from 'next/link';
import { Plus, ArrowRight, Clock, Eye, ArrowUpDown, Search } from 'lucide-react';
import type { InstitutionStudentDto, SkillClaimDto } from '@smart/contracts';
import {
  buildUniversityRosterRows,
  computeUniversityDashboardMetrics,
  type StudentVerificationState,
} from '../../lib/university-dashboard-metrics';
import { bentoCardClass, dashboardSkeletonClass } from '../../lib/tpo-dashboard-ui';

type UniversityDashboardProps = {
  students: InstitutionStudentDto[];
  claims: SkillClaimDto[];
  placementApplicationCount: number;
  institutionName: string;
  loading: boolean;
};

function formatCount(value?: number | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '0';
  }
  return value.toLocaleString('en-US');
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'ST').toUpperCase();
}

function renderVerificationBadge(state: StudentVerificationState) {
  if (state === 'Full') {
    return (
      <span className="inline-flex items-center justify-center rounded-full border border-emerald-500/80 bg-emerald-50/60 px-3 py-0.5 text-xs font-semibold text-emerald-700">
        Achieved
      </span>
    );
  }
  if (state === 'Partial') {
    return (
      <span className="inline-flex items-center justify-center rounded-full border border-amber-400/80 bg-amber-50/60 px-3 py-0.5 text-xs font-semibold text-amber-700">
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center rounded-full border border-teal-500/80 bg-teal-50/60 px-3 py-0.5 text-xs font-semibold text-teal-700">
      Active
    </span>
  );
}

export function UniversityDashboard({
  students,
  claims,
  placementApplicationCount,
  institutionName,
  loading,
}: UniversityDashboardProps) {
  const metrics = computeUniversityDashboardMetrics(students, claims, placementApplicationCount);
  const roster = buildUniversityRosterRows(students, claims);

  // Dynamic Recent Activity derived strictly from claims & student events
  const dynamicActivities =
    claims.length > 0
      ? claims.slice(0, 6).map((c, index) => {
          const student = students.find((s) => s.userId === c.studentId);
          const studentName = student?.fullName || `Candidate ${c.studentId.slice(0, 8)}`;
          const skillName = c.skillFocus ? `${c.skillCode} (${c.skillFocus})` : c.skillCode;
          return {
            id: c.claimId || `claim-${index}`,
            title: `${studentName} — ${skillName}`,
            subtitle: `Status: ${c.status.toLowerCase().replace('_', ' ')}`,
          };
        })
      : students.slice(0, 6).map((s) => ({
          id: s.userId,
          title: `${s.fullName} enrolled in whitelist`,
          subtitle: `Cohort: ${s.batchName || 'General'}`,
        }));

  // Dynamic Breakdown Metrics
  const pendingCount = Math.max(0, metrics.whitelisted - metrics.fullyVerified);
  const totalStudents = metrics.whitelisted || 1;
  const verifiedPct = Math.min(100, Math.round((metrics.fullyVerified / totalStudents) * 100));
  const pendingPct = Math.min(100 - verifiedPct, Math.round((pendingCount / totalStudents) * 100));
  const matchedPct = Math.min(
    100 - verifiedPct - pendingPct,
    Math.round((metrics.opportunitiesMatched / totalStudents) * 100),
  );

  return (
    <div className="relative z-0 space-y-6">
      {/* Frameless Top Hero Section (Title on Left, Action Buttons Box on Right) */}
      <section className="relative z-10 mb-4 pt-4 pb-4 md:pt-6 md:pb-6">
        <div className="relative z-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="text-left">
            {loading ? (
              <div className="h-10 w-72 animate-pulse rounded-lg bg-zinc-200/60" />
            ) : (
              <h1 className="font-heading text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl md:text-5xl">
                {institutionName}
              </h1>
            )}
            <p className="mt-1.5 max-w-xl text-xs leading-relaxed text-zinc-600 sm:text-sm">
              Connect verified campus talent directly with hiring employers and track placement
              drive progress.
            </p>
          </div>

          {/* Action Buttons Box (Opposite Institution Greeting Title) */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <Link
              href="/whitelist"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98]"
            >
              <Plus className="size-3.5" />
              Add Student
            </Link>
            <Link
              href="/settings"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200/90 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 shadow-2xs transition-all hover:bg-zinc-50 active:scale-[0.98]"
            >
              <Plus className="size-3.5" />
              Invite Staff
            </Link>
          </div>
        </div>
      </section>

      {/* Top Section Grid (8-col Stat Cards + 4-col Recent Activity Box) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Column (8 Cols): 3 Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-8">
          {/* Card 1: Whitelisted */}
          <div className="relative overflow-hidden rounded-lg border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold  tracking-wider text-black">Whitelisted</span>
            </div>
            <div className="mt-2.5 font-heading text-3xl font-extrabold text-zinc-950">
              {loading ? '...' : formatCount(metrics.whitelisted)}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-500">Enrolled cohort</span>
            </div>
          </div>

          {/* Card 2: Fully verified */}
          <div className="relative overflow-hidden rounded-lg border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold  tracking-wider text-black">
                Fully verified
              </span>
            </div>
            <div className="mt-2.5 font-heading text-3xl font-extrabold text-zinc-950">
              {loading ? '...' : formatCount(metrics.fullyVerified)}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-500">Certified credentials</span>
            </div>
          </div>

          {/* Card 3: Opportunities matched */}
          <div className="relative overflow-hidden rounded-lg border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold  tracking-wider text-black">
                Opportunities matched
              </span>
            </div>
            <div className="mt-2.5 font-heading text-3xl font-extrabold text-zinc-950">
              {loading ? '...' : formatCount(metrics.opportunitiesMatched)}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-[11px] font-medium text-zinc-500">Active placement drives</span>
            </div>
          </div>
        </div>

        {/* Right Column (4 Cols): Recent Activity Feed (Opposite 3 Stat Cards) */}
        <div className="lg:col-span-4">
          <div
            className={`  rounded-lg border border-zinc-200/90 p-5 h-full flex flex-col justify-between`}
          >
            <div>
              <h3 className="font-heading text-base font-bold text-zinc-900 border-b border-zinc-100 pb-3">
                Recent Activity
              </h3>
              {dynamicActivities.length === 0 ? (
                <div className="py-6 text-center text-xs text-zinc-400">
                  No recent activity recorded.
                </div>
              ) : (
                <div className="mt-3 divide-y divide-zinc-100 text-xs">
                  {dynamicActivities.slice(0, 4).map((act) => (
                    <div key={act.id} className="flex items-center gap-3 py-2.5">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-zinc-200  text-[10px] font-bold text-zinc-800">
                        <Clock className="size-3.5 text-zinc-500" />
                      </div>
                      <div className="min-w-0 flex-1 leading-snug text-zinc-600">
                        <span className="font-semibold text-zinc-900">{act.title}</span>
                        <div className="text-[10px] text-zinc-400 mt-0.5">{act.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section Grid (8-col Student Roster + 4-col Application Breakdown) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Main Column (8 Cols): Student Roster Table */}
        <div className="space-y-6 lg:col-span-8">
          <div className={`${bentoCardClass} !p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-zinc-900">Student roster</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Overview of candidate whitelist additions and verification progress
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Search roster..."
                    className="h-8 rounded-md border border-zinc-200 pl-8 pr-3 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-2 focus:outline-zinc-900"
                  />
                </div>
                <Link
                  href="/students"
                  aria-label="View all students"
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-950 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-zinc-800"
                >
                  View all students <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {loading ? (
              <div className={`${dashboardSkeletonClass} mt-4 h-56 w-full rounded-lg`} />
            ) : roster.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50/60 p-8 text-center">
                <p className="text-xs font-medium text-zinc-600">No students whitelisted yet</p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Upload your cohort roster to get started.
                </p>
                <Link
                  href="/whitelist"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-900 underline hover:text-zinc-700"
                >
                  Open whitelist
                </Link>
              </div>
            ) : (
              <>
                {/* Table Frame with Neat Border */}
                <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200/90 bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Student</th>
                          <th className="py-3 px-4">ID Number</th>
                          <th className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              Major / Type <ArrowUpDown className="size-3" />
                            </div>
                          </th>
                          <th className="py-3 px-4">
                            <div className="flex items-center gap-1">
                              Status <ArrowUpDown className="size-3" />
                            </div>
                          </th>
                          <th className="py-3 px-4 text-right">Verification</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {roster.slice(0, 8).map((row) => (
                          <tr key={row.userId} className="transition-colors hover:bg-zinc-50/60">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-[11px] font-bold text-zinc-800">
                                  {getInitials(row.name)}
                                </div>
                                <div>
                                  <div className="font-bold text-zinc-900 text-xs sm:text-sm">
                                    {row.name}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 font-normal">
                                    {row.email || `${row.name.toLowerCase().replace(/\s+/g, '.')}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-zinc-700 font-mono text-xs">
                                ID {row.userId.slice(0, 8)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="rounded-full border border-zinc-200/90 bg-zinc-100/70 px-3 py-1 text-xs font-semibold text-zinc-700">
                                {row.major || 'General Cohort'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {renderVerificationBadge(row.verificationState)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono text-xs font-medium text-zinc-600">
                                {row.verifiedSkillsCount} verified skills
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                href="/students"
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
                              >
                                <Eye className="size-3" />
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table Footer Pagination Bar */}
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
                  <div>
                    Showing{' '}
                    <span className="font-bold text-zinc-900">1-{Math.min(8, roster.length)}</span>{' '}
                    from <span className="font-bold text-zinc-900">{roster.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="rounded-lg bg-zinc-950 px-3.5 py-1.5 font-semibold text-white shadow-2xs hover:bg-zinc-800"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column (4 Cols): Application Breakdown */}
        <div className="space-y-6 lg:col-span-4">
          {/* Application Breakdown Donut Chart & Progress (Strict Dynamic Data) */}
          <div className={`${bentoCardClass} !p-5`}>
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-heading text-base font-bold text-zinc-900">
                Application Breakdown
              </h3>
            </div>

            {/* SVG Donut Chart Visual */}
            <div className="mt-5 flex flex-col items-center justify-center">
              <div className="relative flex size-40 items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Circle */}
                  <path
                    className="text-zinc-100 stroke-current"
                    strokeWidth="4"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Fully Verified Segment (Emerald Green) */}
                  {verifiedPct > 0 && (
                    <path
                      className="text-emerald-500 stroke-current transition-all duration-500"
                      strokeWidth="4"
                      strokeDasharray={`${verifiedPct}, 100`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  {/* Pending Segment (Amber Yellow) */}
                  {pendingPct > 0 && (
                    <path
                      className="text-amber-500 stroke-current transition-all duration-500"
                      strokeWidth="4"
                      strokeDasharray={`${pendingPct}, 100`}
                      strokeDashoffset={`-${verifiedPct}`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  {/* Opportunities Matched Segment (Blue) */}
                  {matchedPct > 0 && (
                    <path
                      className="text-blue-500 stroke-current transition-all duration-500"
                      strokeWidth="4"
                      strokeDasharray={`${matchedPct}, 100`}
                      strokeDashoffset={`-${verifiedPct + pendingPct}`}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-heading text-xl font-extrabold text-zinc-950">
                    {formatCount(metrics.whitelisted)}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-500">Total Whitelisted</span>
                </div>
              </div>

              {/* Breakdown Legend Table */}
              <div className="mt-6 w-full space-y-2.5 text-xs">
                {[
                  {
                    label: 'Fully Verified',
                    count: metrics.fullyVerified,
                    pct: `${verifiedPct}%`,
                    color: 'bg-emerald-500',
                  },
                  {
                    label: 'Pending Action',
                    count: pendingCount,
                    pct: `${pendingPct}%`,
                    color: 'bg-amber-500',
                  },
                  {
                    label: 'Opportunities Matched',
                    count: metrics.opportunitiesMatched,
                    pct: `${matchedPct}%`,
                    color: 'bg-blue-500',
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-zinc-700">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${item.color}`} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-zinc-500">{formatCount(item.count)}</span>
                      <span className="font-semibold text-zinc-900">{item.pct}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
