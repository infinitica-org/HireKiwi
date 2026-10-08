'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import type { CompanyJoinRequestDto } from '@hirekiwi/contracts';
import { Alert } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { input, primaryButton, secondaryButton } from '../../../lib/ui';

export const JOIN_REQUESTS_QUERY_KEY = ['employer', 'join-requests'] as const;

/**
 * S6-VV-108 (#341): colleagues who verified a work email on our domain and asked to join
 * (S6-VV-107). Approving sends them the normal recruiter invitation. Owners only.
 */
export function JoinRequestsPanel({ onInvited }: { onInvited: () => void }) {
  const queryClient = useQueryClient();
  const requests = useQuery({
    queryKey: JOIN_REQUESTS_QUERY_KEY,
    queryFn: () => api.employer.listJoinRequests(),
    retry: false,
  });
  const [rejecting, setRejecting] = useState<CompanyJoinRequestDto | null>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const done = async () => {
    setError(null);
    await queryClient.invalidateQueries({ queryKey: JOIN_REQUESTS_QUERY_KEY });
  };
  const onError = (err: unknown) =>
    setError(
      isHireKiwiApiError(err) && err.message ? err.message : 'Could not update the request.',
    );

  const approve = useMutation({
    mutationFn: (id: string) => api.employer.approveJoinRequest(id),
    onSuccess: async () => {
      await done();
      onInvited();
    },
    onError,
  });
  const reject = useMutation({
    mutationFn: (id: string) =>
      api.employer.rejectJoinRequest(id, { reason: reason.trim() || undefined }),
    onSuccess: async () => {
      setRejecting(null);
      setReason('');
      await done();
    },
    onError,
  });

  const pending = requests.data?.requests ?? [];
  if (pending.length === 0) return null;
  const busy = approve.isPending || reject.isPending;

  return (
    <section
      aria-label="Requests to join"
      className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900 dark:bg-amber-950/30"
    >
      <h2 className="text-sm font-semibold">Requests to join ({pending.length})</h2>
      <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        These people verified a work email on your domain. Approving sends them a recruiter
        invitation.
      </p>
      {error ? (
        <div className="mt-3">
          <Alert tone="danger" role="alert">
            {error}
          </Alert>
        </div>
      ) : null}
      <ul className="mt-3 divide-y divide-amber-200/70 dark:divide-amber-900/60">
        {pending.map((request) => (
          <li key={request.joinRequestId} className="py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{request.fullName}</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{request.email}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => approve.mutate(request.joinRequestId)}
                  className={primaryButton}
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRejecting(request)}
                  className={secondaryButton}
                >
                  Decline
                </button>
              </div>
            </div>
            {rejecting?.joinRequestId === request.joinRequestId ? (
              <form
                className="mt-3 flex flex-wrap items-end gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  reject.mutate(request.joinRequestId);
                }}
              >
                <label className="min-w-0 flex-1 text-xs">
                  Reason shown to {request.fullName} (optional)
                  <input
                    className={`${input} mt-1`}
                    value={reason}
                    maxLength={500}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </label>
                <button type="submit" disabled={busy} className={primaryButton}>
                  Decline request
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setRejecting(null)}
                  className={secondaryButton}
                >
                  Cancel
                </button>
              </form>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
