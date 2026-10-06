'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Award,
  Briefcase,
  Camera,
  Check,
  ChevronRight,
  ChevronUp,
  FileBadge,
  FolderKanban,
  GraduationCap,
  Languages,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardCompletion } from '@hirekiwi/contracts';
import { cn } from '@hirekiwi/ui';
import { initialsOf } from '@/lib/candidate-identity';

type AreaMeta = { title: string; hint: string; href: string; icon: LucideIcon };

/** Copy for each completion area the server reports (api-core profile-completion.util.ts). */
const AREA_META: Record<string, AreaMeta> = {
  profilePhoto: {
    title: 'Add a profile photo',
    hint: 'Help employers recognise you',
    href: '/student/profile',
    icon: Camera,
  },
  skills: {
    title: 'Add your skills',
    hint: 'Tell SMART what you already know',
    href: '/student/profile?section=skills',
    icon: Award,
  },
  education: {
    title: 'Education',
    hint: 'Your degree and institution',
    href: '/student/profile?section=education',
    icon: GraduationCap,
  },
  experience: {
    title: 'Work experience',
    hint: 'Internships and roles you have held',
    href: '/student/profile?section=experience',
    icon: Briefcase,
  },
  projects: {
    title: 'Projects',
    hint: 'Show what you have built',
    href: '/student/profile?section=projects',
    icon: FolderKanban,
  },
  certifications: {
    title: 'Certifications',
    hint: 'External certificates you hold',
    href: '/student/profile?section=certifications',
    icon: FileBadge,
  },
  languages: {
    title: 'Languages',
    hint: 'Languages you speak',
    href: '/student/profile?section=languages',
    icon: Languages,
  },
  professionalLinks: {
    title: 'Professional links',
    hint: 'LinkedIn or GitHub',
    href: '/student/profile?section=links',
    icon: Link2,
  },
};

function metaFor(area: string): AreaMeta {
  return (
    AREA_META[area] ?? {
      title: area.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
      hint: 'Complete this section',
      href: '/student/profile',
      icon: Award,
    }
  );
}

/** Checklist of profile areas with a progress bar — to-do items first, finished ones after. */
export type ProfileIdentity = {
  name: string;
  headline: string;
  photoUrl: string | null;
};

export function CompleteProfileCard({
  completion,
  profile,
}: {
  completion: DashboardCompletion;
  profile?: ProfileIdentity;
}) {
  const [open, setOpen] = useState(true);
  // Only show areas this card knows about; a retired area (e.g. jobPreferences) from an older
  // API build is skipped rather than rendered with placeholder copy.
  const known = (area: string) => area in AREA_META;
  const incomplete = completion.incompleteAreas.filter(known);
  const completed = completion.completedAreas.filter(known);
  const total = completed.length + incomplete.length;
  const weight = total > 0 ? Math.round(100 / total) : 0;
  const rows = [
    ...incomplete.map((area) => ({ area, done: false })),
    ...completed.map((area) => ({ area, done: true })),
  ];

  return (
    <section
      aria-label="Complete your profile"
      data-testid="complete-profile-card"
      className="rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
    >
      {profile ? (
        <Link
          href="/student/profile"
          data-testid="complete-profile-identity"
          className="mb-4 flex items-center gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800"
        >
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt=""
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-zinc-900"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white dark:bg-white dark:text-zinc-900"
            >
              {initialsOf(profile.name)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-950 dark:text-white">
              {profile.name}
            </p>
            {profile.headline ? (
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                {profile.headline}
              </p>
            ) : null}
          </div>
        </Link>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium tracking-tight text-zinc-950 dark:text-white">
          {completion.percent >= 100 ? 'Your profile is complete' : 'Complete your profile'}
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? 'Hide profile checklist' : 'Show profile checklist'}
          className="rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <ChevronUp className={cn('size-4 transition-transform', !open && 'rotate-180')} />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion.percent}
          aria-label="Profile completion"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400 transition-all duration-500"
            style={{ width: `${completion.percent}%` }}
          />
        </div>
        <p className="shrink-0 text-2xl font-medium tabular-nums text-zinc-950 dark:text-white">
          {completion.percent}
          <span className="ml-0.5 text-sm text-zinc-500">%</span>
        </p>
      </div>

      {open ? (
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map(({ area, done }) => {
            const meta = metaFor(area);
            const Icon = meta.icon;
            return (
              <li key={area}>
                <Link
                  href={meta.href}
                  className="group flex items-center gap-3 py-3.5"
                  aria-label={`${meta.title}${done ? ' (done)' : ''}`}
                >
                  <Icon
                    className={cn(
                      'size-5 shrink-0 stroke-[1.5]',
                      done
                        ? 'text-zinc-300 dark:text-zinc-600'
                        : 'text-zinc-800 dark:text-zinc-200',
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-white',
                      )}
                    >
                      {meta.title}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {meta.hint}
                      {done ? '' : ` (+${weight}%)`}
                    </p>
                  </div>
                  {done ? (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50">
                      <Check className="size-3.5" />
                    </span>
                  ) : (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition-colors group-hover:bg-zinc-900 group-hover:text-white dark:bg-zinc-800 dark:text-zinc-300">
                      <ChevronRight className="size-3.5" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
