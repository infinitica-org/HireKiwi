'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DashboardActivityKind } from '@hirekiwi/contracts';
import { CompleteProfileCard } from '@/components/dashboard/CompleteProfileCard';
import { OpportunityFeed } from '@/components/dashboard/OpportunityFeed';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import {
  StudentActivityFeedPanel,
  type ActivityFeedItem,
} from '@/components/dashboard/StudentActivityFeedPanel';
import { firstNameOf, headlineFor, useCurrentUser, useTracks } from '@/lib/candidate-identity';
import { useStudentDashboard } from '@/lib/use-student-dashboard';

const ACTIVITY_ICON: Record<DashboardActivityKind, ActivityFeedItem['icon']> = {
  PROFILE: 'eye',
  VERIFICATION: 'trending',
  APPLICATION: 'file',
};

function greetingFor(hour: number | null): string {
  if (hour === null) return 'Welcome';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { data: summary, isLoading: summaryLoading, isError, refetch } = useStudentDashboard();

  const { data: tracks } = useTracks();
  const firstName = firstNameOf(user?.fullName);
  // Resolved after mount so the server render and the first client render agree.
  const [hour, setHour] = useState<number | null>(null);
  useEffect(() => setHour(new Date().getHours()), []);
  const greeting = greetingFor(hour);

  const activities: ActivityFeedItem[] = useMemo(
    () =>
      (summary?.recentActivity ?? []).map((item) => ({
        id: item.id,
        icon: ACTIVITY_ICON[item.kind],
        text: item.label,
      })),
    [summary],
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pt-2 pb-12 font-sans select-none">
      <div>
        <h1 className="text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
          {userLoading || !firstName ? greeting : `${greeting}, ${firstName}`}
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Here’s what’s new on your SMART profile today.
        </p>
      </div>

      <WelcomeBanner />

      {isError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <span>Could not load your dashboard. Your data is safe; try again.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-md border border-rose-300 px-3 py-1.5 font-bold hover:bg-rose-100 dark:border-rose-800 dark:hover:bg-rose-950"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          <OpportunityFeed summary={summary} loading={summaryLoading} />
        </div>

        <div className="min-w-0">
          {summary ? <StudentActivityFeedPanel activities={activities} /> : null}
        </div>

        <div className="min-w-0">
          {summary ? (
            <CompleteProfileCard
              completion={summary.completion}
              profile={
                user
                  ? {
                      name: user.fullName,
                      headline: headlineFor(user, tracks),
                      photoUrl: user.profilePhotoUrl,
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
