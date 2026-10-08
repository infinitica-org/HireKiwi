'use client';

import { useEffect, useRef, useState } from 'react';
import { isHireKiwiApiError } from '@hirekiwi/api-client';
import { Check, ExternalLink, Loader2, RotateCw } from 'lucide-react';

/** What the student sees for a platform account, whatever platform it came from. */
export interface LookupProfile {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string;
  /** One short line of public stats, e.g. "312 problems solved". */
  summary: string | null;
}

export type LookupStatus = 'idle' | 'checking' | 'found' | 'notfound' | 'error';

interface LookupState<R> {
  status: LookupStatus;
  raw: R | null;
  profile: LookupProfile | null;
  message: string | null;
}

const IDLE: LookupState<never> = { status: 'idle', raw: null, profile: null, message: null };

/** Wait for the student to stop typing before asking the platform. */
export const LOOKUP_DEBOUNCE_MS = 600;

/**
 * True only when the platform itself said there is no such profile (`leetcode_user_not_found`,
 * `github_user_not_found`, ...). A bare 404 can also mean the API route is missing, and telling
 * the student their username is wrong in that case would be misleading.
 */
function isNotFound(error: unknown): error is Error {
  return isHireKiwiApiError(error) && /user_not_found|profile_not_found/iu.test(error.code ?? '');
}

/**
 * Checks a username as it is typed: after a short pause it looks the public profile up and says
 * whether it exists and whose it is. Typing again cancels the previous check, so a slow answer for
 * an old username can never be shown for a new one.
 */
export function useProfileLookup<R>({
  username,
  enabled,
  lookup,
  toProfile,
  platformName,
  debounceMs = LOOKUP_DEBOUNCE_MS,
}: {
  username: string;
  enabled: boolean;
  lookup: (username: string) => Promise<R>;
  toProfile: (raw: R) => LookupProfile;
  platformName: string;
  debounceMs?: number;
}) {
  const [state, setState] = useState<LookupState<R>>(IDLE);
  const [attempt, setAttempt] = useState(0);
  // Always call the latest functions without restarting the check on every render.
  const lookupRef = useRef(lookup);
  const toProfileRef = useRef(toProfile);
  useEffect(() => {
    lookupRef.current = lookup;
    toProfileRef.current = toProfile;
  }, [lookup, toProfile]);

  useEffect(() => {
    const name = username.trim();
    if (!enabled || !name) {
      setState(IDLE);
      return;
    }
    setState({ status: 'checking', raw: null, profile: null, message: null });
    let cancelled = false;
    const timer = window.setTimeout(() => {
      lookupRef
        .current(name)
        .then((raw) => {
          if (cancelled) return;
          setState({ status: 'found', raw, profile: toProfileRef.current(raw), message: null });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          if (isNotFound(error)) {
            setState({
              status: 'notfound',
              raw: null,
              profile: null,
              message: `No public ${platformName} profile found for "${name}". Check the spelling.`,
            });
          } else {
            setState({
              status: 'error',
              raw: null,
              profile: null,
              message: `Could not check ${platformName} right now.`,
            });
          }
        });
    }, debounceMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [username, enabled, debounceMs, attempt, platformName]);

  return { ...state, retry: () => setAttempt((count) => count + 1) };
}

function Avatar({ profile }: { profile: LookupProfile }) {
  const [failed, setFailed] = useState(false);
  const initial = (profile.displayName ?? profile.username).trim().charAt(0).toUpperCase() || '?';
  if (!profile.avatarUrl || failed) {
    return (
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-base font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100"
      >
        {initial}
      </span>
    );
  }
  return (
    // Platform avatars come from many hosts, so a plain img (no next/image allow-list) is used.
    <img
      src={profile.avatarUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-12 shrink-0 rounded-full border border-zinc-200 object-cover dark:border-zinc-700"
    />
  );
}

/**
 * The result of the username check. When the profile is found it is shown as a card the student
 * selects to confirm it is theirs (selecting is what unlocks the next step).
 */
export function ProfileLookupCard({
  platformName,
  status,
  profile,
  message,
  selected,
  onSelect,
  onRetry,
}: {
  platformName: string;
  status: LookupStatus;
  profile: LookupProfile | null;
  message: string | null;
  selected: boolean;
  onSelect: () => void;
  onRetry: () => void;
}) {
  if (status === 'idle') return null;

  if (status === 'checking') {
    return (
      <p
        role="status"
        className="mt-3 flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400"
      >
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Checking {platformName} username…
      </p>
    );
  }

  if (status === 'notfound') {
    return (
      <p
        role="alert"
        className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
      >
        {message}
      </p>
    );
  }

  if (status === 'error' || !profile) {
    return (
      <div
        role="alert"
        className="mt-3 flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex shrink-0 items-center gap-1 font-semibold underline"
        >
          <RotateCw className="size-3" aria-hidden />
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
        Is this your {platformName} profile?
      </p>
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={`Select ${profile.displayName ?? profile.username}`}
        onClick={onSelect}
        className={`mt-2 flex w-full items-center gap-3 rounded-md border p-3 text-left transition ${
          selected
            ? 'border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900 dark:border-white dark:bg-zinc-800 dark:ring-white'
            : 'border-zinc-200 bg-white hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'
        }`}
      >
        <Avatar profile={profile} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">
            {profile.displayName ?? profile.username}
          </span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            @{profile.username}
            {profile.summary ? ` · ${profile.summary}` : ''}
          </span>
        </span>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            selected
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
              : 'border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300'
          }`}
        >
          {selected ? <Check className="size-3" aria-hidden /> : null}
          {selected ? 'Selected' : 'Select'}
        </span>
      </button>
      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-zinc-800 hover:underline dark:text-zinc-400"
      >
        View this profile on {platformName}
        <ExternalLink className="size-3" aria-hidden />
      </a>
    </div>
  );
}
