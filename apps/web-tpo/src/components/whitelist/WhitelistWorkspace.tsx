'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle,
  AlertCircle,
  Copy,
  RotateCcw,
  Trash2,
  Lock,
  Loader2,
  RefreshCw,
  LayoutGrid,
  Users,
  Search,
} from 'lucide-react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { CustomSelect } from '../ui/CustomSelect';
import type { BatchDto, BatchMemberDto } from '@hirekiwi/contracts';
import { api } from '../../lib/api';
import { loadAutoApproveInvites, loadExtraEmailDomains } from '../../lib/tpo-institution-settings';

// ─────────────────── helpers ────────────────────

function safeMsg(err: unknown, fallback: string): string {
  if (isHireKiwiApiError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (name.slice(0, 2) || 'ST').toUpperCase();
}

// ─────────────────── component ────────────────────

export function WhitelistWorkspace() {
  // Domain and batch scaffold
  const [domain, setDomain] = useState<string | null>(null);
  const [autoApproveInvites, setAutoApproveInvites] = useState(true);
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [scaffoldLoading, setScaffoldLoading] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');

  // Invitation roster (for selected batch)
  const [members, setMembers] = useState<BatchMemberDto[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);

  // Global feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  // One key per "send pending invites" click: a double click emails the batch once (S6-VV-124).
  const sendBatchKey = useRef(crypto.randomUUID());

  // ── Load entitlements + batches ──
  async function loadScaffold() {
    setScaffoldLoading(true);
    try {
      const [me, ent, batchList] = await Promise.all([
        api.auth.me(),
        api.onboarding.tpoEntitlements(),
        api.onboarding.listBatches(),
      ]);
      setDomain(ent.domain ?? null);
      const inst = me.institutionId ?? null;
      if (inst) {
        loadExtraEmailDomains(inst);
        setAutoApproveInvites(loadAutoApproveInvites(inst));
      }
      setBatches(batchList);
      if (batchList.length > 0 && !selectedBatchId) {
        setSelectedBatchId(batchList[0]?.batchId ?? '');
      }
    } catch {
      setError('Failed to load institution data. Please refresh.');
    } finally {
      setScaffoldLoading(false);
    }
  }

  const loadMembersRef = useRef(0);

  // ── Load invitation roster for selected batch ──
  const loadMembers = useCallback(async () => {
    if (!selectedBatchId) {
      setMembers([]);
      return;
    }
    const requestId = ++loadMembersRef.current;
    setRosterLoading(true);
    try {
      const data = await api.onboarding.listBatchMembers(selectedBatchId);
      if (requestId === loadMembersRef.current) {
        setMembers(data);
      }
    } catch {
      if (requestId === loadMembersRef.current) {
        setError('Failed to load candidate roster.');
      }
    } finally {
      if (requestId === loadMembersRef.current) {
        setRosterLoading(false);
      }
    }
  }, [selectedBatchId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = 'Candidate Access & Invitations · HireKiwi TPO';
    }
    void loadScaffold();
  }, []); // loadScaffold intentionally omitted — it only runs on mount

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  // ── Auto-dismiss notifications after 5s ──
  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(null), 5000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  // ── Copy Invite Link ──
  async function handleCopyInviteLink(userId: string) {
    setActionLoadingId(`copy-${userId}`);
    try {
      const { inviteUrl } = await api.onboarding.getStudentInviteLink(userId);
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedId(userId);
      setTimeout(() => setCopiedId(null), 3000);
    } catch (caught) {
      setError(safeMsg(caught, 'Could not generate invite link. Please try again.'));
    } finally {
      setActionLoadingId(null);
    }
  }

  // ── Resend Invitation ──
  async function handleResend(invitationId: string) {
    setActionLoadingId(`resend-${invitationId}`);
    setError(null);
    try {
      await api.onboarding.resendStudentInvitation(invitationId);
      setSuccessMsg('Invitation resent successfully.');
      await loadMembers();
    } catch (caught) {
      setError(safeMsg(caught, 'Failed to resend invitation.'));
    } finally {
      setActionLoadingId(null);
    }
  }

  // ── Revoke Invitation ──
  async function handleRevoke(invitationId: string) {
    setActionLoadingId(`revoke-${invitationId}`);
    setError(null);
    try {
      await api.onboarding.revokeStudentInvitation(invitationId);
      setSuccessMsg('Invitation revoked.');
      await loadMembers();
    } catch (caught) {
      setError(safeMsg(caught, 'Failed to revoke invitation.'));
    } finally {
      setActionLoadingId(null);
    }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredMembers = members.filter((m) => {
    if (!normalizedSearch) return true;
    return (
      m.fullName.toLowerCase().includes(normalizedSearch) ||
      m.email.toLowerCase().includes(normalizedSearch) ||
      (m.groupLabel && m.groupLabel.toLowerCase().includes(normalizedSearch))
    );
  });

  const pendingMembers = filteredMembers.filter(
    (m) => m.invitation?.status === 'PENDING' && !m.emailVerified,
  );
  const activeMembers = filteredMembers.filter(
    (m) => m.emailVerified || m.invitation?.status === 'ACCEPTED',
  );
  const otherMembers = filteredMembers.filter(
    (m) =>
      !m.emailVerified && m.invitation?.status !== 'PENDING' && m.invitation?.status !== 'ACCEPTED',
  );

  return (
    <div className="space-y-4 pb-12 px-4 pt-6">
      {/* Page Header */}
      <div className="py-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium text-zinc-950">Candidate Access & Invitations</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 font-medium">
            Monitor invitation statuses, distribute magic access links, and manage candidate access
            rules.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Active Batches
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <LayoutGrid className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {batches.length.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Target cohorts available</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total Invitations
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Users className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {batches.reduce((sum, b) => sum + (b.memberCount || 0), 0).toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Total cohort invitations</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Domain Lock
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Lock className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-2xl font-extrabold text-zinc-950 truncate">
            {domain ? `@${domain}` : 'Locked'}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">
            Verified email domain restriction
          </div>
        </div>
      </div>

      {/* Active Batch Selector */}
      <div className="rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-4 rounded-t-xl">
          <div>
            <h2 className="text-base font-bold text-zinc-900">Target Batch Cohort</h2>
            <p className="mt-0.5 text-xs text-zinc-700">
              Select an active cohort batch to scope candidate invitations.
            </p>
          </div>
          <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
            {batches.length} {batches.length === 1 ? 'active batch' : 'active batches'}
          </span>
        </div>
        <div className="p-5">
          {scaffoldLoading ? (
            <div className="flex items-center gap-2 py-1 text-xs text-zinc-500">
              <Loader2 className="size-4 animate-spin" /> Loading batches…
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-1">
              <p className="text-xs text-zinc-600">
                No cohort batches found. Candidate onboarding and cohorts are managed in the Batches
                workspace.
              </p>
              <Link
                href="/batches"
                className="inline-flex items-center gap-1.5 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800"
              >
                Go to Batches
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CustomSelect
                ariaLabel="Select batch for onboarding"
                value={selectedBatchId}
                onChange={setSelectedBatchId}
                options={batches.map((b) => ({
                  value: b.batchId,
                  label: `${b.name}${b.code ? ` (${b.code})` : ''}`,
                  sublabel: `${b.memberCount} members`,
                }))}
                className="w-full sm:max-w-md"
              />
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="px-1 text-rose-700 hover:text-rose-900"
          >
            ✕
          </button>
        </div>
      ) : null}
      {successMsg ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 shrink-0 text-emerald-600" />
            <p>{successMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMsg(null)}
            className="px-1 text-emerald-800 hover:text-emerald-950"
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Pending & Active Invitations Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200/80 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900">Pending & Active Invitations</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {selectedBatchId
                ? 'Showing candidates for the selected batch cohort.'
                : 'Select a batch above to view invited candidates.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedBatchId && members.length > 0 ? (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-44 sm:w-56 rounded-lg border border-zinc-200 bg-zinc-50/50 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-900 focus:bg-white focus:outline-none"
                />
              </div>
            ) : null}
            <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
              {filteredMembers.length} Total
            </span>
            {!autoApproveInvites && selectedBatchId && pendingMembers.length > 0 ? (
              <button
                type="button"
                onClick={async () => {
                  setActionLoadingId('send-batch');
                  try {
                    await api.onboarding.sendBatchInvites(selectedBatchId, sendBatchKey.current);
                    sendBatchKey.current = crypto.randomUUID();
                    setSuccessMsg('Pending invitations queued for email delivery.');
                    await loadMembers();
                  } catch {
                    setError('Could not queue invitation emails.');
                  } finally {
                    setActionLoadingId(null);
                  }
                }}
                disabled={actionLoadingId === 'send-batch'}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800 disabled:opacity-50"
              >
                Send pending invites
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void loadMembers()}
              disabled={rosterLoading}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-zinc-200/90 bg-white text-zinc-700 shadow-2xs transition hover:bg-zinc-50 hover:border-zinc-300"
              title="Refresh"
            >
              <RefreshCw className={`size-3.5 ${rosterLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!selectedBatchId ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No batch selected. Choose a batch to view invited candidates.
          </div>
        ) : rosterLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-zinc-700" />
          </div>
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No candidates in this batch yet. Candidates can be onboarded into this batch from the
            Batches workspace.
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            No invitations match your search &quot;{searchQuery}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Group</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {activeMembers.map((m) => (
                  <tr key={m.userId} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-900 text-xs font-bold text-white shadow-2xs">
                          {getInitials(m.fullName)}
                        </span>
                        <div>
                          <div className="font-bold text-zinc-900">{m.fullName}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700 font-medium">{m.groupLabel ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-400">—</td>
                  </tr>
                ))}
                {pendingMembers.map((m) => (
                  <tr key={m.userId} className="transition-colors hover:bg-zinc-50/60">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-900 text-xs font-bold text-white shadow-2xs">
                          {getInitials(m.fullName)}
                        </span>
                        <div>
                          <div className="font-bold text-zinc-900">{m.fullName}</div>
                          <div className="font-mono text-[11px] text-zinc-500">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700 font-medium">{m.groupLabel ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
                        Pending Invitation
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => void handleCopyInviteLink(m.userId)}
                          disabled={actionLoadingId === `copy-${m.userId}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow-2xs hover:bg-zinc-50"
                          title="Copy Invitation Link"
                        >
                          {actionLoadingId === `copy-${m.userId}` ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Copy className="size-3 text-zinc-400" />
                          )}
                          {copiedId === m.userId ? 'Copied!' : 'Copy Link'}
                        </button>

                        {m.invitation?.invitationId && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const invId = m.invitation?.invitationId;
                                if (invId) void handleResend(invId);
                              }}
                              disabled={actionLoadingId === `resend-${m.invitation?.invitationId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-zinc-200/90 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow-2xs hover:bg-zinc-50"
                              title="Resend Invitation"
                            >
                              {actionLoadingId === `resend-${m.invitation?.invitationId}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3 text-zinc-400" />
                              )}
                              Resend
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const invId = m.invitation?.invitationId;
                                if (invId) void handleRevoke(invId);
                              }}
                              disabled={actionLoadingId === `revoke-${m.invitation.invitationId}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200/80 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100"
                              title="Revoke Invitation"
                            >
                              {actionLoadingId === `revoke-${m.invitation.invitationId}` ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Trash2 className="size-3" />
                              )}
                              Revoke
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {otherMembers.map((m) => (
                  <tr key={m.userId} className="opacity-70">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-zinc-900">{m.fullName}</div>
                      <div className="font-mono text-[11px] text-zinc-500">{m.email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700">{m.groupLabel ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
                        {m.invitation?.status ?? 'No Invite'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-zinc-400">—</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
