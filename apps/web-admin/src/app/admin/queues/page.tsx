'use client';

import { useEffect, useState } from 'react';
import type { QueueSnapshotDto } from '@hirekiwi/contracts';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { AlertTriangle, Layers, RefreshCw } from 'lucide-react';
import { Button } from '@hirekiwi/ui/button';
import { PageHeader } from '@/components/page-header';
import {
  DataTable,
  EmptyState,
  InlineAlert,
  PageStack,
  TableCell,
  TableRow,
} from '@/components/admin-ui';
import { api } from '@/lib/api';

const REFRESH_MS = 15_000;

function formatApiError(error: unknown, fallback: string): string {
  if (isHireKiwiApiError(error)) return error.message;
  return fallback;
}

function countBadge(value: number, tone: 'neutral' | 'warning' | 'danger') {
  const toneClass =
    tone === 'danger'
      ? 'border-rose-200/90 bg-rose-50 text-rose-800'
      : tone === 'warning'
        ? 'border-amber-200/90 bg-amber-50 text-amber-800'
        : 'border-zinc-200 bg-zinc-50 text-zinc-700';
  return (
    <span
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold ${toneClass}`}
    >
      {value}
    </span>
  );
}

export default function QueueMonitorPage() {
  const [queues, setQueues] = useState<QueueSnapshotDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);

  async function load() {
    try {
      const res = await api.system.listQueues();
      setQueues(res.queues);
      setError(null);
    } catch (err) {
      setError(formatApiError(err, 'Failed to load queue snapshots.'));
    } finally {
      setLoading(false);
      setLastRefreshedAt(new Date());
    }
  }

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  const sorted = [...queues].sort((a, b) => {
    const backlogA = a.counts.waiting + a.counts.active + a.counts.delayed + a.counts.failed;
    const backlogB = b.counts.waiting + b.counts.active + b.counts.delayed + b.counts.failed;
    return backlogB - backlogA;
  });

  const totalFailed = queues.reduce((sum, q) => sum + q.counts.failed, 0);
  const totalWaiting = queues.reduce((sum, q) => sum + q.counts.waiting + q.counts.active, 0);
  const staleQueues = queues.filter((q) => q.oldestWaitingSeconds > 300).length;

  return (
    <PageStack>
      <PageHeader
        icon={Layers}
        title="Queue Monitor"
        description="Live BullMQ backlog across every async pipeline — verification, grading, PDF generation, DSR exports, and their dead-letter queues."
      >
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 border-zinc-200 bg-white text-xs font-semibold text-zinc-900 hover:bg-zinc-50"
          onClick={() => void load()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </PageHeader>

      {error ? <InlineAlert tone="danger" title={error} /> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200/80 bg-white p-4 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Waiting + Active
            </p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-900">
              {totalWaiting}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Jobs queued or in flight right now</p>
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200/80 bg-white p-4 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Failed jobs
            </p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-900">
              {totalFailed}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Across all queues and DLQs</p>
          </div>
          {totalFailed > 0 ? <AlertTriangle className="size-5 shrink-0 text-amber-500" /> : null}
        </div>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200/80 bg-white p-4 shadow-2xs">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Stale queues
            </p>
            <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-zinc-900">
              {staleQueues}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">Oldest waiting job &gt; 5 minutes</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900">
            All registered queues
          </h3>
          <span className="text-xs text-zinc-500">
            {lastRefreshedAt ? `Updated ${lastRefreshedAt.toLocaleTimeString()}` : ''} ·
            auto-refreshes every {REFRESH_MS / 1000}s
          </span>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-lg border border-zinc-200/80 bg-white" />
        ) : queues.length === 0 ? (
          <EmptyState icon={Layers}>No queue metrics reported yet.</EmptyState>
        ) : (
          <DataTable
            headers={['Queue', 'Waiting', 'Active', 'Delayed', 'Failed', 'Oldest waiting']}
          >
            {sorted.map((q) => (
              <TableRow key={q.queue}>
                <TableCell className="font-mono text-xs font-bold text-zinc-900">
                  {q.queue}
                </TableCell>
                <TableCell>{countBadge(q.counts.waiting, 'neutral')}</TableCell>
                <TableCell>{countBadge(q.counts.active, 'neutral')}</TableCell>
                <TableCell>{countBadge(q.counts.delayed, 'neutral')}</TableCell>
                <TableCell>
                  {countBadge(q.counts.failed, q.counts.failed > 0 ? 'danger' : 'neutral')}
                </TableCell>
                <TableCell>
                  <span
                    className={`font-mono text-xs ${
                      q.oldestWaitingSeconds > 300 ? 'font-bold text-amber-700' : 'text-zinc-500'
                    }`}
                  >
                    {q.oldestWaitingSeconds > 0 ? `${Math.round(q.oldestWaitingSeconds)}s` : '—'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </DataTable>
        )}
      </div>
    </PageStack>
  );
}
