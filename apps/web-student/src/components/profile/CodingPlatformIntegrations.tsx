'use client';

import { useState, type ReactNode, type SVGProps } from 'react';
import { isSmartApiError, queryKeys } from '@smart/api-client';
import { useQuery, useQueryClient } from '@smart/ui';
import type { ConnectableSignalSourceId, SignalConnectionSummary } from '@smart/contracts';
import { CheckCircle2, ExternalLink, Loader2, X } from 'lucide-react';
import { api } from '@/lib/api';
import {
  CodeforcesIcon,
  GitLabIcon,
  HackerRankIcon,
  KaggleIcon,
  LeetCodeIcon,
  StackOverflowIcon,
} from '@/components/profile/brand-icons';

type BrandIcon = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

type CodingPlatformId = 'LEETCODE' | 'HACKERRANK';

interface CodingPlatform {
  id: CodingPlatformId;
  name: string;
  logo: BrandIcon;
  tileClass: string;
  description: string;
  profileUrl: (username: string) => string;
}

/** Platforms the API can read today (public profile data, no API key needed). */
export const CODING_PLATFORMS: CodingPlatform[] = [
  {
    id: 'LEETCODE',
    name: 'LeetCode',
    logo: LeetCodeIcon,
    tileClass: 'bg-[#FFA116]/10 text-[#FFA116]',
    description: 'Problems solved by difficulty, contest rating and top languages.',
    profileUrl: (u) => `https://leetcode.com/u/${encodeURIComponent(u)}/`,
  },
  {
    id: 'HACKERRANK',
    name: 'HackerRank',
    logo: HackerRankIcon,
    tileClass: 'bg-[#00EA64]/10 text-[#00B84F]',
    description: 'Skill badges, certificates and domain scores from your public profile.',
    profileUrl: (u) => `https://www.hackerrank.com/profile/${encodeURIComponent(u)}`,
  },
];

/** Shown in the picker so students know what is planned; they cannot be connected yet. */
const UPCOMING_PLATFORMS: { name: string; logo: BrandIcon; tileClass: string }[] = [
  { name: 'Codeforces', logo: CodeforcesIcon, tileClass: 'bg-[#1F8ACB]/10 text-[#1F8ACB]' },
  { name: 'GitLab', logo: GitLabIcon, tileClass: 'bg-[#FC6D26]/10 text-[#FC6D26]' },
  { name: 'Kaggle', logo: KaggleIcon, tileClass: 'bg-[#20BEFF]/10 text-[#20BEFF]' },
  { name: 'Stack Overflow', logo: StackOverflowIcon, tileClass: 'bg-[#F48024]/10 text-[#F48024]' },
];

function connectBody(id: CodingPlatformId, username: string) {
  return id === 'LEETCODE' ? { leetcodeUsername: username } : { hackerrankUsername: username };
}

/** Accepts a bare username or a pasted profile URL. */
function usernameFrom(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(trimmed) && !trimmed.includes('/')) return trimmed.replace(/^@/, '');
  return trimmed.split('/').filter(Boolean).pop() ?? '';
}

export function PlatformTile({ logo: Logo, tileClass }: { logo: BrandIcon; tileClass: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${tileClass}`}
    >
      <Logo className="size-5" />
    </span>
  );
}

/** Integration card (logo, status button, name, description, footer) shared by every platform. */
export function IntegrationCard({
  logo,
  name,
  description,
  connected,
  verified = false,
  link,
  onAction,
  disabled = false,
}: {
  logo: ReactNode;
  name: string;
  description: string;
  connected: boolean;
  verified?: boolean;
  link?: { href: string; label: string } | null;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between rounded-lg border border-zinc-200/90 bg-white p-6 shadow-2xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#161616]">
      <div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex size-10 items-center justify-center">{logo}</div>
          <button
            type="button"
            onClick={onAction}
            disabled={disabled}
            aria-label={`${connected ? 'Edit' : 'Connect'} ${name}`}
            className={`rounded-md border px-4 py-1.5 text-sm font-medium shadow-2xs transition-all disabled:opacity-50 ${
              connected
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {verified ? (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-600" /> Verified
              </span>
            ) : connected ? (
              'Connected'
            ) : (
              'Connect'
            )}
          </button>
        </div>
        <h4 className="mt-5 text-base font-bold text-zinc-900 dark:text-white">{name}</h4>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-zinc-100 pt-3.5 text-xs dark:border-zinc-800/60">
        {connected && link ? (
          <>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex max-w-[180px] items-center gap-1.5 truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate">{link.label}</span>
            </a>
            <button
              type="button"
              onClick={onAction}
              className="text-[11px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              Edit
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-400">
            <span className="size-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            Not connected
          </span>
        )}
      </div>
    </div>
  );
}

export function CodingPlatformIntegrations({
  pickerOpen,
  onPickerOpenChange: setPickerOpen,
}: {
  /** The "Add integration" picker is opened from the section header. */
  pickerOpen: boolean;
  onPickerOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.signalConnections(),
    queryFn: () => api.signals.listConnections(),
  });

  const [active, setActive] = useState<CodingPlatform | null>(null);
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionFor = (id: ConnectableSignalSourceId): SignalConnectionSummary | undefined =>
    data?.connections.find((c) => c.sourceId === id && c.status !== 'REVOKED');

  const openConnect = (platform: CodingPlatform) => {
    setPickerOpen(false);
    setActive(platform);
    setUsername(connectionFor(platform.id)?.externalAccountId ?? '');
    setError(null);
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.signalConnections() });

  const handleConnect = async () => {
    if (!active) return;
    const name = usernameFrom(username);
    if (!name) {
      setError(`Enter your ${active.name} username.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.signals.connect(active.id, connectBody(active.id, name));
      await refresh();
      setActive(null);
    } catch (err) {
      setError(isSmartApiError(err) ? err.message : `Could not connect ${active.name} right now.`);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      await api.signals.disconnect(active.id);
      await refresh();
      setActive(null);
    } catch (err) {
      setError(
        isSmartApiError(err) ? err.message : `Could not disconnect ${active.name} right now.`,
      );
    } finally {
      setBusy(false);
    }
  };

  const activeConnection = active ? connectionFor(active.id) : undefined;

  return (
    <>
      {CODING_PLATFORMS.map((platform) => {
        const connection = connectionFor(platform.id);
        return (
          <IntegrationCard
            key={platform.id}
            logo={<PlatformTile logo={platform.logo} tileClass={platform.tileClass} />}
            name={platform.name}
            description={platform.description}
            connected={Boolean(connection)}
            link={
              connection
                ? {
                    href: platform.profileUrl(connection.externalAccountId),
                    label: `@${connection.externalAccountId}`,
                  }
                : null
            }
            onAction={() => openConnect(platform)}
            disabled={isLoading}
          />
        );
      })}

      {pickerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs font-sans"
          onClick={() => setPickerOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Add integration"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-[#161616]"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-zinc-950 dark:text-white">
                Add integration
              </h4>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerOpen(false)}
                className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>
            </div>

            <ul className="mt-4 space-y-1">
              {CODING_PLATFORMS.map((platform) => {
                const connected = Boolean(connectionFor(platform.id));
                return (
                  <li key={platform.id}>
                    <button
                      type="button"
                      onClick={() => openConnect(platform)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <PlatformTile logo={platform.logo} tileClass={platform.tileClass} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-zinc-900 dark:text-white">
                          {platform.name}
                        </span>
                        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {platform.description}
                        </span>
                      </span>
                      <span
                        className={`text-xs font-medium ${connected ? 'text-emerald-600' : 'text-zinc-900 dark:text-white'}`}
                      >
                        {connected ? 'Connected' : 'Connect'}
                      </span>
                    </button>
                  </li>
                );
              })}
              {UPCOMING_PLATFORMS.map((platform) => (
                <li
                  key={platform.name}
                  className="flex items-center gap-3 rounded-md px-2 py-2 opacity-60"
                >
                  <PlatformTile logo={platform.logo} tileClass={platform.tileClass} />
                  <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {platform.name}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800">
                    Coming soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {active ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs font-sans"
          onClick={() => !busy && setActive(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Connect ${active.name}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-[#161616]"
          >
            <div className="flex flex-col items-center text-center">
              <PlatformTile logo={active.logo} tileClass={active.tileClass} />
              <h4 className="mt-4 text-xl font-bold text-zinc-950 dark:text-white">
                Connect with {active.name}
              </h4>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Your profile must be public for SMART to read it.
              </p>
            </div>

            <label
              htmlFor="coding-platform-username"
              className="mt-6 mb-2 block text-sm font-bold text-zinc-900 dark:text-zinc-100"
            >
              {active.name} username or profile URL
            </label>
            <input
              id="coding-platform-username"
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleConnect();
              }}
              placeholder="username"
              className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />

            {error ? (
              <p role="alert" className="mt-2 text-xs font-medium text-rose-600">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex items-center justify-between gap-2">
              {activeConnection ? (
                <button
                  type="button"
                  onClick={() => void handleDisconnect()}
                  disabled={busy}
                  className="text-xs font-medium text-rose-600 hover:underline disabled:opacity-50"
                >
                  Disconnect
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  disabled={busy}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConnect()}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  {activeConnection ? 'Save' : 'Connect'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
