'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { BatchDto, CampusDto } from '@hirekiwi/contracts';
import {
  LayoutGrid,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { CustomSelect } from '../ui/CustomSelect';

function matchesBatchQuery(batch: BatchDto, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    batch.name.toLowerCase().includes(q) ||
    (batch.code?.toLowerCase().includes(q) ?? false) ||
    batch.batchId.toLowerCase().includes(q)
  );
}

export function BatchesWorkspace() {
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [campuses, setCampuses] = useState<CampusDto[]>([]);
  const [campusId, setCampusId] = useState('');
  const [campusFilter, setCampusFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredBatches = useMemo(
    () =>
      batches.filter(
        (batch) =>
          matchesBatchQuery(batch, searchQuery) &&
          (!campusFilter || batch.campusId === campusFilter),
      ),
    [batches, searchQuery, campusFilter],
  );

  const totalMembers = useMemo(
    () => batches.reduce((sum, b) => sum + (b.memberCount || 0), 0),
    [batches],
  );

  const totalPendingInvites = useMemo(
    () => batches.reduce((sum, b) => sum + (b.pendingInviteCount || 0), 0),
    [batches],
  );

  async function load() {
    setLoading(true);
    try {
      setBatches(await api.onboarding.listBatches());
      setError(null);
    } catch {
      setError('Failed to load batches.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    api.onboarding
      .listCampuses()
      .then(setCampuses)
      .catch(() => setCampuses([]));
  }, []);

  async function onCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await api.onboarding.createBatch({
        name: name.trim(),
        code: code.trim() || undefined,
        campusId: campusId || undefined,
      });
      setName('');
      setCode('');
      setCampusId('');
      setIsModalOpen(false);
      await load();
      setError(null);
    } catch {
      setError('Could not create batch.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 pb-12">
      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Total Cohorts
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <LayoutGrid className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {batches.length.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Active institutional batches</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Enrolled Candidates
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Users className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {totalMembers.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Assigned batch members</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Pending Invites
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <Clock className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {totalPendingInvites.toLocaleString('en-US')}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Unclaimed onboarding invites</div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all hover:border-zinc-300 hover:shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Campuses
            </span>
            <div className="flex size-9 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs">
              <MapPin className="size-4.5 stroke-[1.75]" />
            </div>
          </div>
          <div className="mt-2 font-heading text-3xl font-extrabold text-zinc-950">
            {campuses.length > 0 ? campuses.length.toLocaleString('en-US') : '1'}
          </div>
          <div className="mt-3 text-xs font-medium text-zinc-500">Associated campus locations</div>
        </div>
      </div>

      {error ? (
        <div
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-2xs"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {/* Main Batches Section Header & Toolbar Card */}
      <div className="space-y-4">
        <div className="py-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Title on Left */}
            <div>
              <h1 className="text-2xl font-semibold text-zinc-950">Batches</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 font-medium">
                Group candidates into cohorts for faster filtering, placement applications, and
                verification
              </p>
            </div>

            {/* Controls Aligned Opposite on Right */}
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              {/* Search Box */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
                  aria-hidden
                />
                <input
                  type="search"
                  aria-label="Search batches by name or code"
                  placeholder="Search batches by name or code…"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-9 pr-3 text-xs sm:text-sm text-zinc-900 placeholder:text-zinc-400 transition-all focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Campus Filter */}
              {campuses.length > 1 ? (
                <CustomSelect
                  ariaLabel="Filter batches by campus"
                  value={campusFilter}
                  onChange={setCampusFilter}
                  options={[
                    { value: '', label: 'All campuses' },
                    ...campuses.map((campus) => ({
                      value: campus.campusId,
                      label: campus.name,
                    })),
                  ]}
                  className="min-w-[140px]"
                />
              ) : null}

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => void load()}
                className="h-10 inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-all hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950"
              >
                <RefreshCw className="size-3.5 text-zinc-500" />
                Refresh
              </button>

              {/* Create Batch Modal Trigger Button */}
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-black px-4 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
              >
                <Plus className="size-4 text-white" aria-hidden />
                Create Batch
              </button>
            </div>
          </div>
        </div>

        {/* Batches Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white py-16 text-xs text-zinc-500 shadow-2xs font-medium">
            <Loader2 className="size-5 animate-spin text-zinc-800" /> Loading batches…
          </div>
        ) : batches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center shadow-2xs">
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 border border-zinc-200/90">
              <LayoutGrid className="size-6" aria-hidden />
            </div>
            <h3 className="text-base font-bold text-zinc-950">No batches yet</h3>
            <p className="mx-auto mt-1.5 max-w-md text-xs sm:text-sm text-zinc-500 font-medium">
              Create your first batch using the &quot;Create Batch&quot; button above, then add
              members from Candidate Onboarding or open a batch to manage its roster.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-2xs transition-all hover:bg-zinc-800"
            >
              <Plus className="size-4" /> Create Batch
            </button>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="rounded-xl border border-zinc-200/90 bg-white py-16 text-center text-xs sm:text-sm text-zinc-500 font-medium shadow-2xs">
            No batches match your search or campus filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch) => (
              <Link
                key={batch.batchId}
                href={`/batches/${batch.batchId}`}
                className="group flex flex-col justify-between rounded-lg border border-zinc-200/90 bg-white p-5 shadow-2xs transition-all duration-200 hover:border-zinc-400 hover:shadow-xs"
              >
                <div>
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100/90 text-zinc-800 shadow-2xs group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                      <Users className="size-5 stroke-[1.75]" aria-hidden />
                    </div>
                    <span className="inline-flex items-center rounded-md border border-zinc-200/80 bg-zinc-100/90 px-2.5 py-0.5 font-mono text-[11px] font-bold text-zinc-800">
                      {batch.code ?? 'No code'}
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-medium text-zinc-950 group-hover:text-black transition-colors">
                    {batch.name}
                  </h3>
                  {batch.campusName && campuses.length > 1 ? (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
                      <MapPin className="size-3.5 text-zinc-400" aria-hidden /> {batch.campusName}
                    </p>
                  ) : null}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-zinc-100 pt-3.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Members
                    </span>
                    <span className="mt-0.5 block text-lg font-extrabold tabular-nums text-zinc-950">
                      {batch.memberCount}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Pending Invites
                    </span>
                    <div className="mt-0.5">
                      {batch.pendingInviteCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900 shadow-2xs">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          {batch.pendingInviteCount}
                        </span>
                      ) : (
                        <span className="text-lg font-extrabold tabular-nums text-zinc-400">0</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modal Popup Dialog for Create Batch */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200/80">
                  <Plus className="size-5 stroke-[2]" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-zinc-950">Create New Batch / Branch</h2>
                  <p className="text-xs text-zinc-500 font-medium">
                    Define cohort parameters for student grouping
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
                aria-label="Close dialog"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={onCreate} className="mt-5 space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-xs font-bold text-zinc-800"
                  htmlFor="batch-name"
                >
                  Batch / Branch name
                </label>
                <input
                  id="batch-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Batch 2025–2026 or CSE Branch"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3.5 text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 transition-all focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  required
                />
              </div>

              <div>
                <label
                  className="mb-1.5 block text-xs font-bold text-zinc-800"
                  htmlFor="batch-code"
                >
                  Short code <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <input
                  id="batch-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. CSE-25"
                  className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3.5 text-xs sm:text-sm text-zinc-950 placeholder:text-zinc-400 transition-all focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                />
              </div>

              {campuses.length > 1 ? (
                <div>
                  <label
                    className="mb-1.5 block text-xs font-bold text-zinc-800"
                    htmlFor="batch-campus"
                  >
                    Campus
                  </label>
                  <select
                    id="batch-campus"
                    value={campusId}
                    onChange={(e) => setCampusId(e.target.value)}
                    className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-zinc-950 transition-all focus:border-zinc-950 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-950"
                  >
                    {campuses.map((campus) => (
                      <option key={campus.campusId} value={campus.isPrimary ? '' : campus.campusId}>
                        {campus.name}
                        {campus.isPrimary ? ' (primary)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-10 rounded-md border border-zinc-200 bg-white px-4 text-xs sm:text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !name.trim()}
                  className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-black px-5 text-xs sm:text-sm font-semibold text-white shadow-2xs transition hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <>
                      <Plus className="size-4" aria-hidden /> Create batch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
