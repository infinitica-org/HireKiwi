'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Target, Sparkles, FileCheck, Eye } from 'lucide-react';
import type { DashboardActivityKind } from '@smart/contracts';
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

  const profileViews = summary?.profileViews;
  const kpis = [
    {
      label: 'Top matches',
      value: summary?.topMatches.length ?? 0,
      subtext: 'Skills-based fit',
      icon: Target,
      href: '/matches',
    },
    {
      label: 'New opportunities',
      value: summary?.opportunities.total ?? 0,
      subtext: 'Open at your institution',
      icon: Sparkles,
      href: '/opportunities',
    },
    {
      label: 'Active applications',
      value: summary?.activeApplications.total ?? 0,
      subtext: 'In recruitment pipeline',
      icon: FileCheck,
      href: '/applications',
    },
    {
      label: 'Employer profile views',
      value: profileViews?.visible ? (profileViews.employerViews ?? 0) : '—',
      subtext: profileViews?.visible
        ? `Last ${profileViews.windowDays} days`
        : 'Hidden. Turn on in Settings',
      icon: Eye,
      href: profileViews?.visible ? '/public-profile' : '/settings',
    },
  ];

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

      {/* <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-5 transition-colors duration-200 hover:border-zinc-300 dark:border-zinc-800 dark:bg-[#161616] dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                  {kpi.label}
                </p>
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-800 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:group-hover:bg-white dark:group-hover:text-zinc-950">
                  <Icon className="size-5 stroke-[1.75]" />
                </div>
              </div>
              <div className="mt-2">
                <p className="font-heading text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl dark:text-white">
                  {kpi.value}
                </p>
                <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {kpi.subtext}
                </p>
              </div>
            </Link>
          );
        })}
      </div> */}

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
