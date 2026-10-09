'use client';

import { useEffect, useState } from 'react';
import type { CandidateCertificateDto, CertificateVerificationEventDto } from '@hirekiwi/contracts';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import {
  Award,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@hirekiwi/ui/button';
import { PageHeader } from '@/components/page-header';
import { DataTable, InlineAlert, PageStack, TableCell, TableRow } from '@/components/admin-ui';
import { api } from '@/lib/api';

const POLL_INTERVAL_MS = 1200;
const POLL_MAX_ATTEMPTS = 7; // ~8.4s — covers the Tier 1/2/3 chain observed in practice (~1-2s)

function formatApiError(error: unknown, fallback: string): string {
  if (isHireKiwiApiError(error) && error.details.length > 0) {
    return error.details.map((detail) => `${detail.path}: ${detail.message}`).join(' ');
  }
  if (isHireKiwiApiError(error)) return error.message;
  return fallback;
}

function SourceStatusBadge({ status }: { status: string }) {
  if (status === 'source_verified') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Source verified
      </span>
    );
  }
  if (status === 'source_failed') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/90 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-800 shadow-2xs">
        <span className="size-1.5 rounded-full bg-rose-500" />
        Source failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs">
      <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)] animate-pulse" />
      Pending
    </span>
  );
}

function ageLabel(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours < 1) return '<1h';
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** The event message is prefixed "[TIER_x_...] RESULT: reason" — split it for a tighter chip. */
function parseEventMessage(message: string): { tier: string | null; rest: string } {
  const match = message.match(/^\[([^\]]+)]\s*(.*)$/);
  if (!match) return { tier: null, rest: message };
  return { tier: match[1] ?? null, rest: match[2] ?? message };
}

function LastResultCell({ event }: { event: CertificateVerificationEventDto | undefined }) {
  if (!event) {
    return <span className="text-xs text-zinc-400">No attempts yet</span>;
  }
  const { tier, rest } = parseEventMessage(event.message);
  return (
    <div className="max-w-xs min-w-0">
      {tier ? (
        <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-600">
          {tier}
        </span>
      ) : null}
      <p className="mt-0.5 truncate text-[11px] text-zinc-500" title={rest}>
        {rest}
      </p>
      <p className="text-[10px] text-zinc-400">{new Date(event.createdAt).toLocaleTimeString()}</p>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function CertificateVerificationPage() {
  const [certificates, setCertificates] = useState<CandidateCertificateDto[]>([]);
  const [eventsByCert, setEventsByCert] = useState<
    Record<string, CertificateVerificationEventDto[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  async function loadEventsFor(id: string) {
    try {
      const res = await api.onboarding.certificateVerificationEvents(id);
      setEventsByCert((prev) => ({ ...prev, [id]: res.events }));
      return res.events;
    } catch {
      return eventsByCert[id] ?? [];
    }
  }

  async function load() {
    try {
      const res = await api.onboarding.certificateVerificationQueue();
      setCertificates(res.certificates);
      setSelectedIds((prev) =>
        prev.filter((id) => res.certificates.some((c) => c.certificateId === id)),
      );
      void Promise.allSettled(res.certificates.map((c) => loadEventsFor(c.certificateId)));
    } catch (err) {
      setError(formatApiError(err, 'Failed to load the certificate verification queue.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Polls event history until the worker's result lands (events grows past `baselineCount`), or times out. */
  async function waitForResult(id: string, baselineCount: number) {
    for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
      await sleep(POLL_INTERVAL_MS);
      const events = await loadEventsFor(id);
      if (events.length > baselineCount) {
        return events[0]; // desc order — newest first
      }
    }
    return null;
  }

  async function reVerify(id: string) {
    setError(null);
    setProcessingIds((prev) => [...prev, id]);
    try {
      const baselineCount = (eventsByCert[id] ?? (await loadEventsFor(id))).length;
      await api.onboarding.reVerifyCertificate(id);
      setNotice('Re-queued — waiting for the verification worker to pick it up...');
      const result = await waitForResult(id, baselineCount + 1); // +1 skips the "triggered" event itself
      if (result) {
        const { tier, rest } = parseEventMessage(result.message);
        setNotice(`${tier ? `${tier}: ` : ''}${rest}`);
      } else {
        setNotice(
          'Still processing — the job is queued but has not resolved yet. Check Queue Monitor or expand history shortly.',
        );
      }
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Could not re-queue this certificate.'));
    } finally {
      setProcessingIds((prev) => prev.filter((busyId) => busyId !== id));
    }
  }

  async function bulkReVerify() {
    if (selectedIds.length === 0) return;
    setError(null);
    setBulkBusy(true);
    setProcessingIds((prev) => [...new Set([...prev, ...selectedIds])]);
    try {
      const baselineCounts = new Map<string, number>();
      for (const id of selectedIds) {
        baselineCounts.set(id, (eventsByCert[id] ?? (await loadEventsFor(id))).length);
      }
      const result = await api.onboarding.bulkReVerifyCertificates({
        certificateIds: selectedIds,
      });
      setNotice(
        `Re-queued ${result.queued} certificate${result.queued === 1 ? '' : 's'}. Waiting for the worker...` +
          (result.skipped.length > 0 ? ` ${result.skipped.length} not found.` : ''),
      );
      await Promise.allSettled(
        selectedIds.map((id) => waitForResult(id, (baselineCounts.get(id) ?? 0) + 1)),
      );
      setNotice(
        `Finished processing ${selectedIds.length} re-verification${selectedIds.length === 1 ? '' : 's'} — see each row's last result below.`,
      );
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(formatApiError(err, 'Bulk re-verify failed.'));
    } finally {
      setProcessingIds((prev) => prev.filter((id) => !selectedIds.includes(id)));
      setBulkBusy(false);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <PageStack>
      <PageHeader
        icon={Award}
        title="Certificate Verification"
        description="Candidate-declared certificates stuck in automated source verification. Re-queue them for a fresh async run."
      />

      {error ? <InlineAlert tone="danger" title={error} /> : null}

      {notice ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-900">
          <div className="flex items-center gap-2 min-w-0">
            <RefreshCw className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div>
            <h3 className="font-heading text-sm font-bold tracking-tight text-zinc-900">
              Stuck in verification
            </h3>
            <p className="text-xs text-zinc-500">
              sourceStatus is pending or source_failed — no automated tier has resolved these yet.
            </p>
          </div>
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-zinc-700">
            {certificates.length} {certificates.length === 1 ? 'certificate' : 'certificates'}
          </span>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                {selectedIds.length} selected
              </span>
              <span>Re-queue for async verification</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
                onClick={() => setSelectedIds([])}
              >
                Clear selection
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 bg-zinc-900 text-white text-xs font-semibold hover:bg-black gap-1"
                disabled={bulkBusy}
                onClick={() => void bulkReVerify()}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${bulkBusy ? 'animate-spin' : ''}`} />
                Re-verify ({selectedIds.length})
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="h-32 animate-pulse rounded-lg border border-zinc-200/80 bg-white" />
        ) : (
          <DataTable
            headers={[
              <input
                key="select-all"
                type="checkbox"
                className="rounded border-zinc-300"
                checked={certificates.length > 0 && selectedIds.length === certificates.length}
                onChange={(e) =>
                  setSelectedIds(e.target.checked ? certificates.map((c) => c.certificateId) : [])
                }
              />,
              '',
              'Certificate',
              'Candidate ID',
              'Status',
              'Source status',
              'Last result',
              'Age',
              'Actions',
            ]}
            empty={certificates.length === 0}
            emptyIcon={ShieldAlert}
          >
            {certificates.flatMap((cert) => {
              const isSelected = selectedIds.includes(cert.certificateId);
              const isProcessing = processingIds.includes(cert.certificateId);
              const isExpanded = expandedIds.includes(cert.certificateId);
              const events = eventsByCert[cert.certificateId] ?? [];
              const rows = [
                <TableRow key={cert.certificateId}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="rounded border-zinc-300"
                      checked={isSelected}
                      onChange={(e) =>
                        setSelectedIds((prev) =>
                          e.target.checked
                            ? [...prev, cert.certificateId]
                            : prev.filter((id) => id !== cert.certificateId),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => toggleExpanded(cert.certificateId)}
                      className="flex size-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      aria-label="Toggle verification history"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 text-xs">{cert.title}</div>
                      <div className="text-[11px] text-zinc-500">{cert.issuer}</div>
                      {cert.verificationUrl ? (
                        <a
                          href={cert.verificationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Source link
                        </a>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-zinc-500">
                    {cert.candidateId}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-700">
                      {cert.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <SourceStatusBadge status={cert.sourceStatus} />
                  </TableCell>
                  <TableCell>
                    {isProcessing ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <LastResultCell event={events[0]} />
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="h-3 w-3" />
                      {ageLabel(cert.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 border-zinc-200 bg-white px-2.5 text-[11px] font-semibold text-zinc-900 hover:bg-zinc-50 shadow-2xs"
                      disabled={isProcessing}
                      onClick={() => void reVerify(cert.certificateId)}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                      Re-verify
                    </Button>
                  </TableCell>
                </TableRow>,
              ];

              if (isExpanded) {
                rows.push(
                  <TableRow key={`${cert.certificateId}-history`}>
                    <TableCell colSpan={9} className="bg-zinc-50/70">
                      <div className="flex items-center gap-1.5 px-1 py-1 text-[11px] font-semibold text-zinc-500">
                        <History className="h-3.5 w-3.5" />
                        Verification history ({events.length})
                      </div>
                      {events.length === 0 ? (
                        <p className="px-1 pb-2 text-xs text-zinc-400">No events recorded yet.</p>
                      ) : (
                        <ul className="space-y-1.5 px-1 pb-2">
                          {events.map((event) => {
                            const { tier, rest } = parseEventMessage(event.message);
                            return (
                              <li
                                key={event.eventId}
                                className="flex items-start gap-2 rounded-md border border-zinc-200/70 bg-white px-2.5 py-1.5 text-xs"
                              >
                                <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-700">
                                  {event.status}
                                </span>
                                <span className="min-w-0 flex-1">
                                  {tier ? (
                                    <span className="mr-1 font-mono text-[10px] font-bold text-zinc-500">
                                      [{tier}]
                                    </span>
                                  ) : null}
                                  {rest}
                                </span>
                                <span className="shrink-0 text-[10px] text-zinc-400">
                                  {new Date(event.createdAt).toLocaleString()}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>,
                );
              }

              return rows;
            })}
          </DataTable>
        )}
      </div>
    </PageStack>
  );
}
