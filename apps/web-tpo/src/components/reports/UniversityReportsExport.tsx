'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  ShieldCheck,
  Users,
  Briefcase,
  ClipboardList,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import type { InstitutionStudentDto, JobOpeningDto, SkillClaimDto } from '@hirekiwi/contracts';
import { api, employersApi, openingsApi } from '../../lib/api';
import { countInstitutionPlacementApplications } from '../../lib/placement-application-count';
import {
  applicationCountByEmployerId,
  buildEmployerEngagementRows,
  buildPlacementOpportunitiesSummary,
  buildVerificationByMajorRows,
  exportConsolidatedReportCsv,
  exportEmployerEngagementCsv,
  exportVerificationByMajorCsv,
} from '../../lib/tpo-reports-export';

type FetchErrors = {
  students?: boolean;
  claims?: boolean;
  openings?: boolean;
  employers?: boolean;
  applications?: boolean;
};

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
  const [fetchErrors, setFetchErrors] = useState<FetchErrors>({});
  const mountedRef = useRef(true);

  const hasError = useMemo(() => Object.values(fetchErrors).some(Boolean), [fetchErrors]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setFetchErrors({});

    const errors: FetchErrors = {};

    const [studentsResult, claimsResult, openingsResult, employersResult] =
      await Promise.allSettled([
        api.onboarding.listTpoStudents(),
        api.assessment.listSkillClaims(),
        openingsApi.list(),
        employersApi.list(),
      ]);

    if (!mountedRef.current) return;

    let loadedStudents: InstitutionStudentDto[] = [];
    if (studentsResult.status === 'fulfilled') {
      loadedStudents = studentsResult.value;
      setStudents(loadedStudents);
    } else {
      errors.students = true;
      setStudents([]);
    }

    let loadedClaims: SkillClaimDto[] = [];
    if (claimsResult.status === 'fulfilled') {
      loadedClaims = claimsResult.value;
      setClaims(loadedClaims);
    } else {
      errors.claims = true;
      setClaims([]);
    }

    let loadedOpenings: JobOpeningDto[] = [];
    if (openingsResult.status === 'fulfilled') {
      loadedOpenings = openingsResult.value.openings;
      setOpenings(loadedOpenings);
    } else {
      errors.openings = true;
      setOpenings([]);
    }

    let loadedEmployers: ReturnType<typeof buildEmployerEngagementRows> = [];
    let rawEmployers: Array<{
      employerId: string;
      institutionId: string;
      name: string;
      openingCount: number;
      activeOpeningCount: number;
      createdAt: string;
      updatedAt: string;
    }> = [];

    if (employersResult.status === 'fulfilled') {
      rawEmployers = employersResult.value.employers;
    } else {
      errors.employers = true;
    }

    // Reuse already-fetched openings for application counts
    if (openingsResult.status === 'fulfilled') {
      try {
        const appCounts = await countInstitutionPlacementApplications(loadedOpenings);
        if (!mountedRef.current) return;
        setApplicationTotal(appCounts.total);
        if (employersResult.status === 'fulfilled') {
          const byEmployer = applicationCountByEmployerId(loadedOpenings, appCounts.byOpeningId);
          loadedEmployers = buildEmployerEngagementRows(rawEmployers, byEmployer);
          setEmployerEngagement(loadedEmployers);
        } else {
          setEmployerEngagement([]);
        }
      } catch {
        if (!mountedRef.current) return;
        errors.applications = true;
        setApplicationTotal(0);
        setEmployerEngagement([]);
      }
    } else {
      errors.applications = true;
      setApplicationTotal(0);
      setEmployerEngagement([]);
    }

    if (!mountedRef.current) return;
    setFetchErrors(errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (typeof window !== 'undefined') {
      document.title = 'Reports & Analytics · HireKiwi TPO';
    }
    loadData();
    return () => {
      mountedRef.current = false;
    };
  }, [loadData]);

  const verificationRows = useMemo(
    () => buildVerificationByMajorRows(students, claims),
    [students, claims],
  );

  const placementSummary = useMemo(
    () => buildPlacementOpportunitiesSummary(students, claims, openings, applicationTotal),
    [students, claims, openings, applicationTotal],
  );

  const handleGlobalExport = () => {
    if (loading || hasError) return;
    exportConsolidatedReportCsv({
      summary: placementSummary,
      verificationRows,
      employerRows: employerEngagement,
    });
  };

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
          disabled={loading || hasError}
          onClick={handleGlobalExport}
          title={
            hasError
              ? 'Export unavailable: some report metrics could not be loaded.'
              : loading
                ? 'Loading report data…'
                : 'Export All Metrics (CSV)'
          }
          className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4" aria-hidden />
          Export All Metrics (CSV)
        </button>
      </div>

      {/* Non-intrusive Error Alert Banner */}
      {hasError && !loading && (
        <div
          role="alert"
          aria-live="polite"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-rose-900 shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 shrink-0 text-rose-600" aria-hidden="true" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-rose-950">
                Failed to load some report metrics
              </p>
              <p className="text-xs text-rose-700">
                Some data could not be retrieved due to a network or server issue. Check your
                connection and try again.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all hover:bg-rose-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Retry
          </button>
        </div>
      )}

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
          <div
            className={`mt-2 font-heading text-3xl font-extrabold ${
              fetchErrors.students ? 'text-rose-600 text-xl' : 'text-zinc-950'
            }`}
          >
            {loading
              ? '—'
              : fetchErrors.students
                ? 'Unavailable'
                : placementSummary.whitelisted.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Enrolled candidates</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Fully Verified
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-2xs">
              <ShieldCheck className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div
            className={`mt-2 font-heading text-3xl font-extrabold ${
              fetchErrors.students || fetchErrors.claims ? 'text-rose-600 text-xl' : 'text-zinc-950'
            }`}
          >
            {loading
              ? '—'
              : fetchErrors.students || fetchErrors.claims
                ? 'Unavailable'
                : placementSummary.fullyVerified.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Certified credentials</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Drives
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Briefcase className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div
            className={`mt-2 font-heading text-3xl font-extrabold ${
              fetchErrors.openings ? 'text-rose-600 text-xl' : 'text-zinc-950'
            }`}
          >
            {loading
              ? '—'
              : fetchErrors.openings
                ? 'Unavailable'
                : placementSummary.activeOpenings.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Active placement openings</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Applications Matched
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <ClipboardList className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div
            className={`mt-2 font-heading text-3xl font-extrabold ${
              fetchErrors.applications || fetchErrors.openings
                ? 'text-rose-600 text-xl'
                : 'text-zinc-950'
            }`}
          >
            {loading
              ? '—'
              : fetchErrors.applications || fetchErrors.openings
                ? 'Unavailable'
                : placementSummary.totalApplications.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Submitted applications</div>
        </div>
      </div>

      {/* Verification by Major / Cohort Section */}
      <div className="rounded-xl border border-zinc-200/90 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">Verification Completion by Major</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Whitelisted students grouped by cohort / batch, with full, partial, and pending
              verification.
            </p>
          </div>
          <button
            type="button"
            disabled={loading || Boolean(fetchErrors.students || fetchErrors.claims)}
            onClick={() => exportVerificationByMajorCsv(verificationRows)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5 text-zinc-700" aria-hidden />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto rounded-b-xl">
          <table className="w-full min-w-[640px] text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                <th className="px-5 py-3.5">Cohort / Batch</th>
                <th className="px-5 py-3.5">Whitelisted</th>
                <th className="px-5 py-3.5">Fully Verified</th>
                <th className="px-5 py-3.5">Partial</th>
                <th className="px-5 py-3.5">Pending</th>
                <th className="px-5 py-3.5 text-right">Completion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-zinc-500">
                    Loading verification metrics…
                  </td>
                </tr>
              ) : fetchErrors.students || fetchErrors.claims ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-xs text-rose-600 font-medium"
                  >
                    Failed to load verification metrics. Please use Retry above.
                  </td>
                </tr>
              ) : verificationRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-zinc-500">
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
                    <td className="px-5 py-3.5 font-mono text-zinc-700">{row.pending}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <div
                          role="progressbar"
                          aria-valuenow={row.completionPct}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${row.major} verification completion: ${row.completionPct}%`}
                          className="h-2 w-16 overflow-hidden rounded-full bg-zinc-100"
                        >
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

      {/* Employer Engagement by Institution */}
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
            disabled={
              loading ||
              Boolean(fetchErrors.employers || fetchErrors.openings || fetchErrors.applications)
            }
            onClick={() => exportEmployerEngagementCsv(employerEngagement)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-2xs transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
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
              ) : fetchErrors.employers || fetchErrors.openings || fetchErrors.applications ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-12 text-center text-xs text-rose-600 font-medium"
                  >
                    Failed to load employer engagement data. Please use Retry above.
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
