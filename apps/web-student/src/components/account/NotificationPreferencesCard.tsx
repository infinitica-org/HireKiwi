'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@hirekiwi/ui';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import type {
  NotificationChannel,
  NotificationKind,
  NotificationPreferencesResponse,
} from '@hirekiwi/contracts';
import { api } from '@/lib/api';
import { SettingsCard, StatusMessage } from './account-ui';

const QUERY_KEY = ['me', 'notification-preferences'] as const;

/** The kinds a student receives, in the order they matter to them. */
const STUDENT_KINDS: ReadonlyArray<{ kind: NotificationKind; label: string }> = [
  { kind: 'OPPORTUNITY', label: 'Opportunities from employers' },
  { kind: 'APPLICATION', label: 'Application confirmations' },
  { kind: 'STAGE_CHANGE', label: 'Hiring stage changes' },
  { kind: 'VERIFICATION_RESULT', label: 'Verification results' },
  { kind: 'MESSAGE', label: 'New messages' },
  { kind: 'EVENT', label: 'Campus events' },
  { kind: 'INVITATION', label: 'Invitations' },
  { kind: 'ACCOUNT', label: 'Account and privacy' },
  { kind: 'TRUST_ENFORCEMENT', label: 'Trust and safety' },
];

const CHANNELS: ReadonlyArray<{ channel: NotificationChannel; label: string }> = [
  { channel: 'IN_APP', label: 'In-app' },
  { channel: 'EMAIL', label: 'Email' },
];

/** S6-VV-121 (#434): per-kind, per-channel notification switches. */
export function NotificationPreferencesCard() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => api.notifications.getPreferences(),
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const lookup = (kind: NotificationKind, channel: NotificationChannel) =>
    data?.preferences.find((p) => p.kind === kind && p.channel === channel);

  async function toggle(kind: NotificationKind, channel: NotificationChannel, enabled: boolean) {
    setBusyKey(`${kind}:${channel}`);
    setError(null);
    try {
      const next = await api.notifications.updatePreferences({
        preferences: [{ kind, channel, enabled }],
      });
      queryClient.setQueryData<NotificationPreferencesResponse>(QUERY_KEY, next);
    } catch (err) {
      setError(isHireKiwiApiError(err) ? err.message : 'Could not update this setting.');
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <SettingsCard
      title="Notifications"
      description="Choose what reaches you in the app and by email. Account, privacy and safety notices always do."
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-zinc-500 dark:text-zinc-400">
            <th className="pb-2 font-medium">Notification</th>
            {CHANNELS.map(({ channel, label }) => (
              <th key={channel} className="w-20 pb-2 text-center font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {STUDENT_KINDS.map(({ kind, label }) => (
            <tr key={kind}>
              <td className="py-2.5 text-zinc-700 dark:text-zinc-300">{label}</td>
              {CHANNELS.map(({ channel, label: channelLabel }) => {
                const pref = lookup(kind, channel);
                const on = pref?.enabled ?? true;
                const locked = pref?.mandatory ?? false;
                return (
                  <td key={channel} className="py-2.5 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={`${label}: ${channelLabel}`}
                      title={locked ? 'Always on' : undefined}
                      disabled={isLoading || locked || busyKey === `${kind}:${channel}`}
                      onClick={() => void toggle(kind, channel, !on)}
                      className={`relative h-6 w-10 rounded-full transition-colors disabled:opacity-50 ${
                        on ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-200 dark:bg-zinc-700'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform dark:bg-zinc-950 ${
                          on ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {error && <StatusMessage kind="error">{error}</StatusMessage>}
    </SettingsCard>
  );
}
