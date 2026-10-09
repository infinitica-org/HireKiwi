'use client';

import Link from 'next/link';
import type { AuthenticatedUser } from '@hirekiwi/contracts';

import { ProfilePhotoEditControl } from '@/components/profile/ProfilePhotoEditControl';
import {
  PROFILE_SECTION_NAV,
  profileSectionHref,
  type ProfileSectionId,
} from '@/lib/profile-sections';

interface ProfileSidebarProps {
  activeSection: ProfileSectionId;
  user: AuthenticatedUser | undefined;
  username?: string | null;
  publicLinkUrl?: string | null;
  percent?: number | null;
  /** Section ids whose profile area is already complete (shown with a check). */
}

const AVATAR_CLASS =
  'size-14 shrink-0 rounded-full border border-zinc-200 bg-zinc-100 text-sm font-bold text-zinc-900 dark:border-zinc-800 dark:bg-zinc-800 dark:text-white';

/** Left rail: who you are and how complete the profile is, then one link per section. */
export function ProfileSidebar({
  activeSection,
  user,
  username = null,
  publicLinkUrl = null,
  percent = null,
}: ProfileSidebarProps) {
  const fullName = user?.fullName?.trim() || 'Candidate';

  return (
    <aside
      aria-label="Profile navigation"
      data-testid="profile-sidebar"
      className="min-w-0 font-sans lg:sticky lg:top-0 lg:self-start"
    >
      <div className="rounded-[20px] border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#161616]">
        <div className="flex items-center gap-3">
          <ProfilePhotoEditControl
            fullName={user?.fullName}
            profilePhotoUrl={user?.profilePhotoUrl}
            avatarClassName={AVATAR_CLASS}
            buttonSizeClassName="size-5"
            fallbackClassName="rounded-full bg-zinc-900 text-sm font-bold text-white dark:bg-white dark:text-zinc-900"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-950 dark:text-white">
              {fullName}
            </p>
            {username ? <p className="truncate text-sm text-zinc-500">@{username}</p> : null}
          </div>
        </div>

        {typeof percent === 'number' ? (
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Profile completion</span>
              <span className="font-medium text-zinc-900 dark:text-white">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completion"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
            >
              <div
                className="h-full rounded-full bg-zinc-900 dark:bg-white"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : null}

        {publicLinkUrl ? (
          <a
            href={publicLinkUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 block text-sm font-medium text-zinc-700 underline-offset-2 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-white"
          >
            View public profile
          </a>
        ) : null}
      </div>

      <nav
        aria-label="Profile sections"
        data-testid="profile-section-nav"
        className="mt-4 rounded-[20px] border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-[#161616]"
      >
        {PROFILE_SECTION_NAV.map((group, index) => (
          <div key={group.groupLabel} className={index > 0 ? 'mt-4' : undefined}>
            <p className="px-3 pt-1.5 pb-2 text-xs font-medium text-zinc-400">{group.groupLabel}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.id === activeSection;
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={profileSectionHref(item.id)}
                      scroll={false}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      data-profile-tab={item.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] outline-none transition-colors focus-visible:outline-none ${
                        active
                          ? 'bg-zinc-100 font-medium text-zinc-950 dark:bg-zinc-800 dark:text-white'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="size-[18px] shrink-0 stroke-[1.75]" />
                      <span className="min-w-0 flex-1 truncate">{item.navLabel ?? item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
