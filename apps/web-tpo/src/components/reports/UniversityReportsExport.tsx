'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, ShieldCheck, Users, Briefcase, ClipboardList } from 'lucide-react';
import type { InstitutionStudentDto, JobOpeningDto, SkillClaimDto } from '@hirekiwi/contracts';
import { api, employersApi, openingsApi } from '../../lib/api';
import { countInstitutionPlacementApplications } from '../../lib/placement-application-count';
import {
  applicationCountByEmployerId,
  buildEmployerEngagementRows,
  buildPlacementOpportunitiesSummary,
  buildVerificationByMajorRows,
  exportEmployerEngagementCsv,
  exportPlacementOpportunitiesCsv,
  exportVerificationByMajorCsv,
} from '../../lib/tpo-reports-export';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'MA').toUpperCase();
}

export function UniversityReportsExport() {
  const [students, setStudents] = useState<InstitutionStudentDto[]>([]);
  const [claims, setClaims] = useState<SkillClaimDto[]>([]);
  const [openings, setOpenings] = useState<JobOpeningDto[]>([]);
  const [applicationTotal, setApplicationTotal] = useState(0);
  const [employerEngagement, setEmployerEngagement] = useState<
    ReturnType<typeof buildEmployerEngagementRows>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Reports & Analytics · SMART TPO';
    }
    let active = true;
    setLoading(true);

    Promise.all([
      api.onboarding.listTpoStudents().catch(() => [] as InstitutionStudentDto[]),
      api.assessment.listSkillClaims().catch(() => [] as SkillClaimDto[]),
      openingsApi.list().catch(() => ({ openings: [] as JobOpeningDto[] })),
      employersApi.list().catch(() => ({ employers: [] })),
      countInstitutionPlacementApplications().catch(() => ({
        total: 0,
        byOpeningId: new Map<string, number>(),
      })),
    ])
      .then(([studentList, claimList, openingsRes, employersRes, appCounts]) => {
        if (!active) return;
        setStudents(studentList);
        setClaims(claimList);
        setOpenings(openingsRes.openings);
        setApplicationTotal(appCounts.total);
        const byEmployer = applicationCountByEmployerId(
          openingsRes.openings,
          appCounts.byOpeningId,
        );
        setEmployerEngagement(buildEmployerEngagementRows(employersRes.employers, byEmployer));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const verificationRows = useMemo(
    () => buildVerificationByMajorRows(students, claims),
    [students, claims],
  );

  const placementSummary = useMemo(
    () => buildPlacementOpportunitiesSummary(students, claims, openings, applicationTotal),
    [students, claims, openings, applicationTotal],
  );

  return (
    <div className="space-y-6 pb-12 pt-4">
      {/* Clean Page Title & Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Reports & Analytics
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500">
            Export cohort readiness, placement drive metrics, and employer recruitment engagement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportPlacementOpportunitiesCsv(placementSummary)}
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98]"
        >
          <Download className="size-4" aria-hidden />
          Export All Metrics (CSV)
        </button>
      </div>

      {/* Modern KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Whitelisted Students
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Users className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {loading ? '—' : placementSummary.whitelisted.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Enrolled candidates</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90  p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Fully Verified
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
              <ShieldCheck className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {loading ? '—' : placementSummary.fullyVerified.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Certified credentials</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90  p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Drives
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Briefcase className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {loading ? '—' : placementSummary.activeOpenings.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Active placement openings</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90  p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Applications Matched
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <ClipboardList className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {loading ? '—' : placementSummary.totalApplications.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Submitted applications</div>
        </div>
      </div>

      {/* Verification by Major Section */}
      <div className="rounded-xl border border-zinc-200/90 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Verification Completion by Major</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Whitelisted students grouped by major cohort, with full vs partial verification.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportVerificationByMajorCsv(verificationRows)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-all hover:bg-zinc-50 hover:border-zinc-300"
          >
            <Download className="size-3.5 text-zinc-700" aria-hidden />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[640px] text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Major Cohort</th>
                <th className="px-5 py-3.5">Whitelisted</th>
                <th className="px-5 py-3.5">Fully Verified</th>
                <th className="px-5 py-3.5">Partial</th>
                <th className="px-5 py-3.5 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs text-zinc-500">
                    Loading verification metrics…
                  </td>
                </tr>
              ) : verificationRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs text-zinc-500">
                    No students on the whitelist yet.
                  </td>
                </tr>
              ) : (
                verificationRows.map((row) => (
                  <tr key={row.major} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-900 text-xs font-bold text-white shadow-2xs">
                          {getInitials(row.major)}
                        </span>
                        <span className="font-bold text-zinc-900">{row.major}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-700">{row.whitelisted}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        {row.fullyVerified} Verified
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-700">{row.partial}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${Math.min(row.completionPct, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-zinc-900">
                          {row.completionPct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employer Engagement by School */}
      <div className="rounded-xl border border-zinc-200/90 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Employer Engagement by Institution</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Companies recruiting at your institution — active openings and applicant volume.
            </p>
          </div>
          <button
            type="button"
            onClick={() => exportEmployerEngagementCsv(employerEngagement)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-all hover:bg-zinc-50 hover:border-zinc-300"
          >
            <Download className="size-3.5 text-zinc-700" aria-hidden />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[640px] text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Employer</th>
                <th className="px-5 py-3.5">Active Openings</th>
                <th className="px-5 py-3.5">Total Openings</th>
                <th className="px-5 py-3.5 text-right">Applications</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-zinc-500">
                    Loading employer engagement…
                  </td>
                </tr>
              ) : employerEngagement.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-zinc-500">
                    No employers in the repository yet.
                  </td>
                </tr>
              ) : (
                employerEngagement.map((row) => (
                  <tr key={row.employerName} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-900 text-xs font-bold text-white shadow-2xs">
                          {getInitials(row.employerName)}
                        </span>
                        <span className="font-bold text-zinc-900">{row.employerName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-zinc-700">{row.activeOpenings}</td>
                    <td className="px-5 py-3.5 font-mono text-zinc-700">{row.totalOpenings}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-zinc-900">
                      {row.applications}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
