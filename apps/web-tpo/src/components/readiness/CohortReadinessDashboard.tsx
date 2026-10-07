'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, EmptyState, ErrorState, LoadingState } from '@hirekiwi/ui';
import type {
  ReadinessHeatmapCell,
  ReadinessTier,
  UniversityReadinessAnalyticsResponse,
} from '@hirekiwi/contracts';
import { universityApi } from '../../lib/api';

export const TIER_LABEL: Record<ReadinessTier, string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
  NEEDS_IMPROVEMENT: 'Needs improvement',
};
const TIER_BAR: Record<ReadinessTier, string> = {
  GOLD: 'bg-amber-400',
  SILVER: 'bg-zinc-400',
  BRONZE: 'bg-orange-500',
  NEEDS_IMPROVEMENT: 'bg-rose-500',
};

/** Red (0) through amber to green (100), so a low average reads as a problem at a glance. */
export function heatColor(score: number | null): string | undefined {
  if (score === null) return undefined;
  const hue = Math.round((Math.max(0, Math.min(100, score)) / 100) * 120);
  return `hsl(${hue} 70% 88%)`;
}

function cellTitle(domain: string, cell: ReadinessHeatmapCell): string {
  if (cell.averageScore === null) return `${domain}: no verified scores yet`;
  return `${domain}: average ${cell.averageScore}, ${cell.belowTargetPercent}% below target, ${cell.studentCount} students scored`;
}

/**
 * Th6-607 - cohort readiness dashboard: tier distribution + department x skill-domain heatmap.
 * Filters (`?department=&campus=&gradYear=`) live in the URL so a view can be shared and reloaded.
 */
export function CohortReadinessDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const department = params.get('department') ?? '';
  const campus = params.get('campus') ?? '';
  const gradYear = params.get('gradYear') ?? '';

  const [data, setData] = useState<UniversityReadinessAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setFilter = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(next.size > 0 ? `${pathname}?${next.toString()}` : pathname);
    },
    [params, pathname, router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(
        await universityApi.readinessAnalytics({
          department: department || undefined,
          campus: campus || undefined,
          gradYear: gradYear ? Number(gradYear) : undefined,
        }),
      );
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : 'Could not load cohort readiness.');
    } finally {
      setLoading(false);
    }
  }, [department, campus, gradYear]);

  useEffect(() => {
    void load();
  }, [load]);

  const hasFilters = Boolean(department || campus || gradYear);
  const options = data?.filterOptions;
  const selectClass =
    'mt-1 block rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal min-w-36';

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end gap-3" role="search">
        <label className="text-xs font-semibold">
          Department
          <select
            value={department}
            onChange={(event) => setFilter('department', event.target.value)}
            className={selectClass}
          >
            <option value="">All departments</option>
            {(options?.departments ?? (department ? [department] : [])).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Campus
          <select
            value={campus}
            onChange={(event) => setFilter('campus', event.target.value)}
            className={selectClass}
          >
            <option value="">All campuses</option>
            {(options?.campuses ?? (campus ? [campus] : [])).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold">
          Graduation year
          <select
            value={gradYear}
            onChange={(event) => setFilter('gradYear', event.target.value)}
            className={selectClass}
          >
            <option value="">All years</option>
            {(options?.gradYears ?? (gradYear ? [Number(gradYear)] : [])).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        {hasFilters ? (
          <Button variant="ghost" onClick={() => router.replace(pathname)}>
            Clear all
          </Button>
        ) : null}
      </div>

      {error ? (
        <ErrorState
          title="Could not load cohort readiness"
          message={error}
          onRetry={() => void load()}
        />
      ) : loading && !data ? (
        <LoadingState message="Loading cohort readiness…" />
      ) : !data || data.totalStudents === 0 ? (
        <EmptyState
          title={hasFilters ? 'No students match these filters' : 'No students yet'}
          description={
            hasFilters
              ? 'Try removing a filter to see more students.'
              : 'Cohort readiness appears here once students are added to your institution.'
          }
        />
      ) : (
        <div className={loading ? 'space-y-6 opacity-60' : 'space-y-6'} aria-busy={loading}>
          <section
            aria-labelledby="tier-distribution-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="tier-distribution-heading" className="text-sm font-semibold">
                Tier distribution
              </h2>
              <span className="text-xs text-zinc-500">{data.totalStudents} students</span>
            </div>
            <div
              className="mt-4 flex h-4 w-full overflow-hidden rounded-full bg-zinc-100"
              role="img"
              aria-label={data.tiers.map((t) => `${TIER_LABEL[t.tier]} ${t.percent}%`).join(', ')}
            >
              {data.tiers
                .filter((t) => t.count > 0)
                .map((t) => (
                  <div
                    key={t.tier}
                    className={TIER_BAR[t.tier]}
                    style={{ width: `${(t.count / data.totalStudents) * 100}%` }}
                  />
                ))}
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {data.tiers.map((t) => (
                <li
                  key={t.tier}
                  className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2"
                >
                  <span className={`size-3 rounded-full ${TIER_BAR[t.tier]}`} aria-hidden />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold">{TIER_LABEL[t.tier]}</div>
                    <div className="text-sm">
                      {t.percent}% <span className="text-xs text-zinc-500">({t.count})</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="heatmap-heading"
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="heatmap-heading" className="text-sm font-semibold">
                Skill domain heatmap
              </h2>
              <span className="text-xs text-zinc-500">
                Average readiness (0-100). Target {data.targetScore}. Outlined cells are the
                weakest.
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] border-separate border-spacing-1 text-center text-xs">
                <thead>
                  <tr>
                    <th scope="col" className="px-2 py-1 text-left font-semibold">
                      Department
                    </th>
                    {data.heatmap.domains.map((domain) => (
                      <th key={domain.id} scope="col" className="px-1 py-1 font-semibold">
                        {domain.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.heatmap.rows.map((row) => (
                    <tr key={row.department}>
                      <th scope="row" className="px-2 py-1 text-left font-semibold">
                        {row.department}
                        <span className="block text-[11px] font-normal text-zinc-500">
                          {row.studentCount} students
                        </span>
                      </th>
                      {row.cells.map((cell, index) => {
                        const domainName = data.heatmap.domains[index]?.name ?? cell.domainId;
                        return (
                          <td
                            key={cell.domainId}
                            title={cellTitle(domainName, cell)}
                            data-weakest={cell.weakest ? 'true' : undefined}
                            style={{ backgroundColor: heatColor(cell.averageScore) }}
                            className={`rounded-md px-1 py-2 ${
                              cell.averageScore === null ? 'bg-zinc-50 text-zinc-400' : ''
                            } ${cell.weakest ? 'font-bold outline outline-2 outline-rose-600' : ''}`}
                          >
                            {cell.averageScore === null ? '-' : Math.round(cell.averageScore)}
                            {cell.weakest ? <span className="sr-only"> (weakest)</span> : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              <Badge variant="outline">Tip</Badge>
              Hover a cell to see the share of students below target.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
