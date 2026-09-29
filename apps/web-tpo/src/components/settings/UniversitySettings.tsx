'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Globe, Lock, Plus, Trash2 } from 'lucide-react';
import { isSmartApiError } from '@smart/api-client';
import type { PlacementEmployerSummary, TenantEntitlementsDto } from '@smart/contracts';
import { StaffManagementWorkspace } from '../staff/StaffManagementWorkspace';
import { CampusesSection } from './CampusesSection';

import { api, employersApi } from '../../lib/api';
import { normalizeEmailDomain } from '../../lib/domain-validation';
import {
  dismissEmployerFromQueue,
  isValidExtraDomainInput,
  loadAutoApproveInvites,
  loadDismissedEmployerIds,
  loadExtraEmailDomains,
  saveAutoApproveInvites,
  saveExtraEmailDomains,
} from '../../lib/tpo-institution-settings';
import { dashboardErrorNoticeClass, dashboardSuccessNoticeClass } from '../../lib/tpo-dashboard-ui';

type SettingsTab = 'all' | 'staff' | 'domains' | 'campuses' | 'employers' | 'plan';

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black ${
        checked ? 'bg-black' : 'bg-zinc-200'
      }`}
    >
      <span
        className={`inline-block size-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function UniversitySettings() {
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [entitlements, setEntitlements] = useState<TenantEntitlementsDto | null>(null);
  const [campusCount, setCampusCount] = useState(0);
  const [employers, setEmployers] = useState<PlacementEmployerSummary[]>([]);
  const [extraDomains, setExtraDomains] = useState<string[]>([]);
  const [autoApprove, setAutoApprove] = useState(true);
  const [dismissedEmployerIds, setDismissedEmployerIds] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('staff');

  const primaryDomain = entitlements?.domain ?? null;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, ent, employerRes] = await Promise.all([
        api.auth.me(),
        api.onboarding.tpoEntitlements(),
        employersApi.list().catch(() => ({ employers: [] as PlacementEmployerSummary[] })),
      ]);
      const inst = me.institutionId ?? null;
      setInstitutionId(inst);
      setEntitlements(ent);
      setEmployers(employerRes.employers);
      if (inst) {
        setExtraDomains(loadExtraEmailDomains(inst));
        setAutoApprove(loadAutoApproveInvites(inst));
        setDismissedEmployerIds(loadDismissedEmployerIds(inst));
      }
    } catch (err: unknown) {
      setError(isSmartApiError(err) ? err.message : 'Failed to load settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  function persistExtraDomains(next: string[]) {
    if (!institutionId) return;
    saveExtraEmailDomains(institutionId, next);
    setExtraDomains(next);
  }

  function handleAddDomain() {
    const normalized = normalizeEmailDomain(newDomain);
    if (!isValidExtraDomainInput(newDomain)) {
      setError('Enter a valid domain (e.g. north.riverdale.edu).');
      return;
    }
    if (primaryDomain && normalized === normalizeEmailDomain(primaryDomain)) {
      setError('That domain is already your primary verified domain.');
      return;
    }
    if (extraDomains.includes(normalized)) {
      setError('Domain is already listed.');
      return;
    }
    persistExtraDomains([...extraDomains, normalized]);
    setNewDomain('');
    setNotice('Domain added. Whitelist and provisioning will accept emails on this domain.');
    setError(null);
  }

  function handleRemoveExtra(domain: string) {
    persistExtraDomains(extraDomains.filter((d) => d !== domain));
    setNotice('Domain removed from your verified list.');
  }

  function handleAutoApproveChange(enabled: boolean) {
    if (!institutionId) return;
    saveAutoApproveInvites(institutionId, enabled);
    setAutoApprove(enabled);
    setNotice(
      enabled
        ? 'New whitelist uploads will automatically queue invitation emails.'
        : 'Invitations will stay pending until you send them from Whitelist.',
    );
  }

  function handleDismissEmployer(employerId: string) {
    if (!institutionId) return;
    dismissEmployerFromQueue(institutionId, employerId);
    setDismissedEmployerIds(loadDismissedEmployerIds(institutionId));
    setNotice('Employer removed from your approval queue.');
  }

  const employerQueue = useMemo(() => {
    return employers.filter(
      (e) =>
        !dismissedEmployerIds.includes(e.employerId) &&
        e.activeOpeningCount === 0 &&
        e.openingCount === 0,
    );
  }, [employers, dismissedEmployerIds]);

  const verificationStatus = entitlements?.verificationStatus ?? 'APPROVED';
  const studentCount = entitlements?.candidateUsage ?? 0;
  const capacity = entitlements?.candidateCapacity;

  const showStaff = activeTab === 'all' || activeTab === 'staff';
  const showDomains = activeTab === 'all' || activeTab === 'domains';
  const showCampuses = activeTab === 'all' || activeTab === 'campuses';
  const showEmployers = activeTab === 'all' || activeTab === 'employers';
  const showPlan = activeTab === 'all' || activeTab === 'plan';

  return (
    <div className="space-y-6 pb-12 pt-6">
      {/* Clean Page Title & Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between px-1">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">Settings</h1>
          <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500">
            Manage verified email domains, campus cohorts, employer approvals, staff access, and
            plan entitlements.
          </p>
        </div>
      </div>

      {/* Navigation Filter Tabs - Matching Workspace Section Nav */}
      <nav aria-label="Settings sections" className="mt-2 mb-4">
        <ul className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/90 p-1 shadow-2xs overflow-x-auto max-w-full">
          {[
            { id: 'all', label: 'All Settings' },
            { id: 'staff', label: 'Staff & Access' },
            { id: 'domains', label: 'Verified Domains' },
            { id: 'campuses', label: `Campuses (${campusCount})` },
            { id: 'employers', label: `Employer Queue (${employerQueue.length})` },
            { id: 'plan', label: 'Plan & Profile' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <li key={tab.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 ${
                    active
                      ? 'bg-black font-bold text-white shadow-2xs'
                      : 'font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
                  }`}
                >
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {error ? <div className={dashboardErrorNoticeClass}>{error}</div> : null}
      {notice ? <div className={dashboardSuccessNoticeClass}>{notice}</div> : null}

      {/* Section: Staff Management */}
      {showStaff ? (
        <section id="settings-staff" className="space-y-3">
          <StaffManagementWorkspace />
        </section>
      ) : null}

      {/* Section: Email Domains */}
      {showDomains ? (
        <section
          id="settings-domains"
          className="rounded-xl border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-5"
        >
          <div>
            <h2 className="text-base font-bold text-zinc-950">Verified Student Email Domains</h2>
            <p className="mt-0.5 text-xs text-zinc-500 font-medium">
              Only students with email addresses from these verified domains can be whitelisted and
              provisioned into your institution cohorts.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200/80 bg-zinc-50/60 p-3.5">
              <div className="flex items-center gap-2.5">
                <Lock className="size-4 text-zinc-600 shrink-0" />
                <span className="font-mono text-sm font-semibold text-zinc-900">
                  @{primaryDomain ?? '…'}
                </span>
                <span className="text-xs text-zinc-500 font-medium">Primary domain</span>
              </div>
              <span className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                SMART Verified
              </span>
            </div>

            {extraDomains.map((domain) => (
              <div
                key={domain}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200/80 bg-white p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="size-4 text-zinc-600 shrink-0" />
                  <span className="font-mono text-sm font-semibold text-zinc-900">@{domain}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExtra(domain)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-end pt-1">
            <div className="flex-1">
              <label className="text-xs font-semibold text-zinc-700" htmlFor="extra-domain">
                Add another verified domain
              </label>
              <input
                id="extra-domain"
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="e.g. north.riverdale.edu"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-zinc-50/60 px-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900 mt-1"
              />
            </div>
            <button
              type="button"
              onClick={handleAddDomain}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-zinc-800"
            >
              <Plus className="size-4" aria-hidden />
              Add domain
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Auto-approve new students from these domains
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 font-medium">
                When enabled, bulk whitelist uploads will immediately queue invitation emails
                without requiring manual dispatch.
              </p>
            </div>
            <Toggle
              checked={autoApprove}
              onChange={handleAutoApproveChange}
              label="Auto-approve invitations"
            />
          </div>
        </section>
      ) : null}

      {/* Section: Campuses (S6-VV-112) */}
      {showCampuses ? (
        <CampusesSection
          institutionName={entitlements?.institutionName ?? null}
          onCountChange={setCampusCount}
        />
      ) : null}

      {/* Section: Employer Approval Queue */}
      {showEmployers ? (
        <section
          id="settings-employers"
          className="rounded-xl border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-4"
        >
          <div>
            <h2 className="text-base font-bold text-zinc-950">Employer Approval Queue</h2>
            <p className="mt-0.5 text-xs text-zinc-500 font-medium">
              Review and approve hiring partners requesting access to post job openings and source
              candidates from your institution.
            </p>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-200/80 bg-white mt-4">
            <table className="w-full min-w-[640px] text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-zinc-200/80 bg-zinc-50/60 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                  <th className="px-5 py-3.5">Employer Name</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-xs text-zinc-500">
                      Loading queue…
                    </td>
                  </tr>
                ) : employerQueue.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-xs text-zinc-500">
                      No pending employers waiting for approval.
                    </td>
                  </tr>
                ) : (
                  employerQueue.map((employer) => {
                    const verified = Boolean(employer.website?.trim());
                    return (
                      <tr
                        key={employer.employerId}
                        className="transition-colors hover:bg-zinc-50/60"
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-zinc-900">{employer.name}</div>
                          <div className="text-xs text-zinc-500">
                            {employer.sector ?? 'Recruiting partner'}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {verified ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 shadow-2xs">
                              Verified Company
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-700">
                              Not Yet Verified
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDismissEmployer(employer.employerId)}
                              className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50"
                            >
                              Deny
                            </button>
                            <Link
                              href={`/companies/${employer.employerId}`}
                              className="inline-flex items-center justify-center gap-2 rounded-md bg-black px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-zinc-800"
                            >
                              Approve
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {/* Section: Plan & Institution Profile */}
      {showPlan ? (
        <section id="settings-plan" className="space-y-4">
          <div className="rounded-xl border border-zinc-200/90 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-zinc-950">Institution Profile & Plan</h2>
              <p className="mt-0.5 text-xs text-zinc-500 font-medium">
                Verified institutional profile details and seat capacity tier.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 pt-2">
              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Institution Name
                </span>
                <div className="mt-1.5 font-bold text-zinc-900 truncate">
                  {entitlements?.institutionName ?? 'Institution Account'}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Verification Status
                </span>
                <div className="mt-1.5 font-bold">
                  {verificationStatus === 'APPROVED' ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="size-3.5 text-emerald-600" /> Verified Institution
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-zinc-700">
                      {verificationStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Whitelisted Students
                </span>
                <div className="mt-1.5 font-heading text-2xl font-bold text-zinc-950">
                  {studentCount.toLocaleString('en-US')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
              <div className="rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Candidate Capacity
                </span>
                <div className="mt-1.5 font-heading text-xl font-bold text-zinc-950">
                  {capacity != null
                    ? `${studentCount.toLocaleString()} / ${capacity.toLocaleString()} seats`
                    : `${studentCount.toLocaleString()} seats · Unlimited`}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
