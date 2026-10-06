'use client';

import { useEffect, useState } from 'react';
import { Gauge, RotateCcw, Sliders, Building2, CheckCircle2 } from 'lucide-react';
import { isSmartApiError } from '@hirekiwi/api-client';
import type { InstitutionDto, RateLimitPolicyItemDto } from '@hirekiwi/contracts';
import { Badge } from '@hirekiwi/ui/badge';
import { PageHeader } from '@/components/page-header';
import {
  AdminInput,
  DataTable,
  Field,
  FilterBar,
  InlineAlert,
  NativeSelect,
  PageStack,
  TableCell,
  TableRow,
  controlButtonClassName,
} from '@/components/admin-ui';
import { api } from '@/lib/api';

function formatApiError(err: unknown, fallback: string): string {
  return isSmartApiError(err) ? err.message : fallback;
}

export default function RateLimitsPage() {
  const [institutions, setInstitutions] = useState<InstitutionDto[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>('');
  const [policies, setPolicies] = useState<RateLimitPolicyItemDto[]>([]);
  const [_loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edit Modal State
  const [editingPolicy, setEditingPolicy] = useState<RateLimitPolicyItemDto | null>(null);
  const [draftLimit, setDraftLimit] = useState<string>('');
  const [draftBurst, setDraftBurst] = useState<string>('');
  const [draftWindow, setDraftWindow] = useState<string>('');
  const [draftReason, setDraftReason] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Load institutions on mount
  useEffect(() => {
    api.onboarding
      .listInstitutions()
      .then((data) => {
        setInstitutions(data);
        const first = data[0];
        if (first && !selectedInstitutionId) {
          setSelectedInstitutionId(first.institutionId);
        }
      })
      .catch((err) => {
        setError(formatApiError(err, 'Failed to load institutions.'));
      });
  }, []);

  // Load policies when selectedInstitutionId changes
  async function loadPolicies(institutionId?: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await api.rateLimits.listPolicies({
        institutionId: institutionId || undefined,
      });
      setPolicies(res.policies);
    } catch (err) {
      setError(formatApiError(err, 'Failed to load rate limit policies.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedInstitutionId) {
      void loadPolicies(selectedInstitutionId);
    }
  }, [selectedInstitutionId]);

  function handleOpenEdit(policy: RateLimitPolicyItemDto) {
    setEditingPolicy(policy);
    if (policy.activeOverride) {
      setDraftLimit(String(policy.activeOverride.limit));
      setDraftBurst(String(policy.activeOverride.burst));
      setDraftWindow(String(policy.activeOverride.windowSeconds));
      setDraftReason(policy.activeOverride.reason);
    } else {
      setDraftLimit(String(policy.limit * 2));
      setDraftBurst(String(policy.burst * 2));
      setDraftWindow(String(policy.windowSeconds));
      setDraftReason('');
    }
    setError(null);
  }

  function handleCloseEdit() {
    setEditingPolicy(null);
    setDraftLimit('');
    setDraftBurst('');
    setDraftWindow('');
    setDraftReason('');
  }

  async function handleSaveOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPolicy || !selectedInstitutionId) return;

    const limitNum = parseInt(draftLimit, 10);
    const burstNum = draftBurst ? parseInt(draftBurst, 10) : undefined;
    const windowNum = draftWindow ? parseInt(draftWindow, 10) : undefined;

    if (!limitNum || limitNum <= 0) {
      setError('Limit must be a positive number.');
      return;
    }
    if (!draftReason.trim() || draftReason.trim().length < 5) {
      setError('Please provide a descriptive reason for this override (min 5 chars).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await api.rateLimits.setOverride(selectedInstitutionId, editingPolicy.key, {
        limit: limitNum,
        burst: burstNum,
        windowSeconds: windowNum,
        reason: draftReason.trim(),
      });
      setSuccessMessage(`Override saved for ${editingPolicy.key}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      handleCloseEdit();
      await loadPolicies(selectedInstitutionId);
    } catch (err) {
      setError(formatApiError(err, 'Failed to save rate limit override.'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOverride(policy: RateLimitPolicyItemDto) {
    if (!selectedInstitutionId) return;
    if (!confirm(`Reset override for policy "${policy.key}" back to default?`)) return;

    setError(null);
    try {
      await api.rateLimits.deleteOverride(selectedInstitutionId, policy.key);
      setSuccessMessage(`Reset ${policy.key} to default policy`);
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadPolicies(selectedInstitutionId);
    } catch (err) {
      setError(formatApiError(err, 'Failed to reset rate limit override.'));
    }
  }

  const selectedInst = institutions.find((i) => i.institutionId === selectedInstitutionId);

  return (
    <PageStack>
      <PageHeader
        icon={Gauge}
        title="Rate Limit Controls"
        description="Real-time institutional API rate-limit and throttle overrides backed by Redis."
      />

      {error ? <InlineAlert tone="danger" title={error} /> : null}
      {successMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      ) : null}

      <FilterBar>
        <Field label="Target Institution">
          <NativeSelect
            value={selectedInstitutionId}
            onChange={(e) => setSelectedInstitutionId(e.target.value)}
          >
            <option value="" disabled>
              Select an institution
            </option>
            {institutions.map((inst) => (
              <option key={inst.institutionId} value={inst.institutionId}>
                {inst.name} ({inst.domain})
              </option>
            ))}
          </NativeSelect>
        </Field>
      </FilterBar>

      {selectedInst && (
        <div className="flex items-center justify-between rounded-md border border-zinc-200/80 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <Building2 className="size-5 text-zinc-500" />
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                {selectedInst.name}
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                ID: {selectedInst.institutionId} • Domain: {selectedInst.domain}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {policies.filter((p) => p.activeOverride).length} Active Overrides
          </Badge>
        </div>
      )}

      <DataTable
        headers={['Policy Key', 'Scope', 'Default Limit', 'Active Override', 'Actions']}
        empty={policies.length === 0}
      >
        {policies.map((policy) => {
          const isOverridden = !!policy.activeOverride;
          return (
            <TableRow key={policy.key}>
              <TableCell className="font-medium">
                <div className="flex flex-col gap-0.5">
                  <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {policy.key}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {policy.rationale}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-[10px] font-mono uppercase">
                  {policy.scope}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs text-zinc-700 dark:text-zinc-300">
                  <span className="font-semibold">{policy.limit}</span> req / {policy.windowSeconds}
                  s<span className="block text-[11px] text-zinc-500">Burst: {policy.burst}</span>
                </div>
              </TableCell>
              <TableCell>
                {isOverridden && policy.activeOverride ? (
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 shadow-2xs dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300 w-fit">
                      <span className="size-1.5 rounded-full bg-amber-500" />
                      {policy.activeOverride.limit} req / {policy.activeOverride.windowSeconds}s
                      (Burst: {policy.activeOverride.burst})
                    </span>
                    <span className="text-[11px] text-zinc-600 dark:text-zinc-400 italic">
                      &quot;{policy.activeOverride.reason}&quot;
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Updated: {new Date(policy.activeOverride.updatedAt).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium">Standard default</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(policy)}
                    className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  >
                    <Sliders className="size-3.5" />
                    {isOverridden ? 'Edit Override' : 'Override'}
                  </button>
                  {isOverridden && (
                    <button
                      type="button"
                      onClick={() => void handleDeleteOverride(policy)}
                      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300"
                    >
                      <RotateCcw className="size-3.5" />
                      Reset
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </DataTable>

      {/* Override Edit Dialog */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sliders className="size-5 text-zinc-600 dark:text-zinc-300" />
                Configure Policy Override
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 font-mono">
                Policy: {editingPolicy.key}
              </p>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Request Limit (requests per window)
                </label>
                <AdminInput
                  type="number"
                  min={1}
                  required
                  value={draftLimit}
                  onChange={(e) => setDraftLimit(e.target.value)}
                  placeholder={`Default: ${editingPolicy.limit}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Burst Capacity
                  </label>
                  <AdminInput
                    type="number"
                    min={1}
                    value={draftBurst}
                    onChange={(e) => setDraftBurst(e.target.value)}
                    placeholder={`Default: ${editingPolicy.burst}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Window (seconds)
                  </label>
                  <AdminInput
                    type="number"
                    min={1}
                    value={draftWindow}
                    onChange={(e) => setDraftWindow(e.target.value)}
                    placeholder={`Default: ${editingPolicy.windowSeconds}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Reason for Override <span className="text-rose-500">*</span>
                </label>
                <AdminInput
                  type="text"
                  required
                  minLength={5}
                  value={draftReason}
                  onChange={(e) => setDraftReason(e.target.value)}
                  placeholder="e.g. Annual campus placement drive high concurrency event"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={saving}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className={controlButtonClassName}>
                  {saving ? 'Saving...' : 'Apply Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageStack>
  );
}
