'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import smartLogoImg from '@hirekiwi/ui/assets/images/Logos/WebP/Smart-logo.png';
import { api } from '../../lib/api';

/**
 * CN-T01 server-side gate: candidate console requires AuthenticatedUser.onboardingCompleted.
 * Clearing localStorage cannot bypass this check.
 */
export function OnboardingGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const me = await api.auth.me();
        if (cancelled) return;
        if (me.role === 'STUDENT' && !me.onboardingCompleted) {
          setState('denied');
          router.replace('/onboarding');
          return;
        }
        setState('allowed');
      } catch {
        if (!cancelled) {
          setState('denied');
          router.replace('/login');
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white font-sans dark:bg-[#111111]"
      >
        <Image
          src={smartLogoImg}
          alt=""
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain"
        />
        <Loader2 className="size-5 animate-spin text-zinc-400" aria-hidden="true" />
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-[#111111]">
        <div className="w-full max-w-sm rounded-lg border border-zinc-200/80 bg-white p-6 text-center shadow-2xs dark:border-zinc-800 dark:bg-[#161616]">
          <Image
            src={smartLogoImg}
            alt="SMART"
            width={36}
            height={36}
            className="mx-auto h-9 w-9 object-contain"
          />
          <h1 className="mt-4 text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
            Finish onboarding to continue
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Your account hasn&apos;t completed onboarding yet. It only takes a few minutes.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/onboarding')}
            className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            Continue onboarding
          </button>
        </div>
      </div>
    );
  }

  return children;
}
