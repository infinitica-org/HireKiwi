'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TpoContactRequestDto } from '@hirekiwi/contracts';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { Handshake, Mail, Phone, UserCheck, XCircle } from 'lucide-react';
import { Button } from '@hirekiwi/ui/button';
import { AdminInput, DataTable, InlineAlert, TableCell, TableRow } from '@/components/admin-ui';
import { api } from '@/lib/api';

function received(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function fullName(row: TpoContactRequestDto): string {
  return [row.firstName, row.middleName, row.lastName].filter(Boolean).join(' ');
}

/**
 * Requests sent from the landing page's "Let's Connect" form. Approving creates the university
 * and emails the contact an invitation to set their own password.
 */
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.in',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
]);

export function PartnershipRequestsQueue({
  onApproved,
  onCount,
}: {
  onApproved: () => void;
  onCount: (count: number) => void;
}) {
  const [rows, setRows] = useState<TpoContactRequestDto[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [domain, setDomain] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [fresh, contacted] = await Promise.all([
        api.onboarding.listTpoContactRequests({ status: 'NEW' }),
        api.onboarding.listTpoContactRequests({ status: 'CONTACTED' }),
      ]);
      const merged = [...fresh.items, ...contacted.items].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      setRows(merged);
      onCount(merged.length);
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not load partnership requests.');
    }
  }, [onCount]);

  useEffect(() => {
    void load();
  }, [load]);

  function startApprove(row: TpoContactRequestDto) {
    setError(null);
    setNotice(null);
    // A personal address (gmail.com ...) says nothing about the university, so leave it blank.
    const emailDomain = (row.email.split('@')[1] ?? '').toLowerCase();
    setDomain(PERSONAL_EMAIL_DOMAINS.has(emailDomain) ? '' : emailDomain);
    setApprovingId(row.id);
  }

  async function approve(row: TpoContactRequestDto) {
    setError(null);
    setBusyId(row.id);
    try {
      const result = await api.onboarding.approveTpoContactRequest(row.id, {
        domain: domain.trim() || undefined,
      });
      setApprovingId(null);
      setNotice(
        `${result.institutionName} was created (${result.domain}). An invitation to set a password was sent to ${result.inviteSentTo}.`,
      );
      await load();
      onApproved();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not approve this request.');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(row: TpoContactRequestDto) {
    setError(null);
    setBusyId(row.id);
    try {
      await api.onboarding.updateTpoContactRequestStatus(row.id, 'REJECTED');
      setNotice(`Request from ${row.institutionName} was rejected.`);
      await load();
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not reject this request.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <InlineAlert tone="danger" title={error} /> : null}
      {notice ? <InlineAlert title={notice} /> : null}

      {rows.length > 0 ? (
        <DataTable
          headers={['University', 'Contact', 'Reach them', 'Message', 'Actions']}
          empty={false}
          emptyIcon={Handshake}
        >
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {row.institutionName}
                </div>
                <div className="text-[11px] text-zinc-500">
                  {row.location} · {received(row.createdAt)}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {fullName(row)}
                </div>
                <div className="text-[11px] text-zinc-500">{row.role}</div>
              </TableCell>
              <TableCell>
                <a
                  href={`mailto:${row.email}`}
                  className="flex items-center gap-1.5 text-xs hover:underline"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden />
                  {row.email}
                </a>
                <a
                  href={`tel:${row.phone}`}
                  className="mt-1 flex items-center gap-1.5 text-xs hover:underline"
                >
                  <Phone className="size-3.5 shrink-0" aria-hidden />
                  {row.phone}
                </a>
              </TableCell>
              <TableCell className="max-w-xs whitespace-normal text-xs">
                {row.message || '—'}
              </TableCell>
              <TableCell className="text-right">
                {approvingId === row.id ? (
                  <div className="ml-auto flex min-w-64 flex-col gap-2 text-left">
                    <label className="text-[11px] font-medium text-zinc-500">
                      University email domain
                      <AdminInput
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="e.g. anna.edu"
                        className="mt-1"
                      />
                    </label>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        disabled={busyId === row.id || !domain.trim()}
                        onClick={() => void approve(row)}
                      >
                        Create &amp; send invite
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setApprovingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 px-2.5 text-[11px] font-semibold"
                      disabled={busyId === row.id}
                      onClick={() => void reject(row)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 gap-1 px-2.5 text-[11px] font-semibold"
                      disabled={busyId === row.id}
                      onClick={() => startApprove(row)}
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </DataTable>
      ) : null}
    </div>
  );
}
