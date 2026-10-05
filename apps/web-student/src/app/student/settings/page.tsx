'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Database, Eye, MessageSquare, UserRound, type LucideIcon } from 'lucide-react';
import { cn } from '@smart/ui';
import { DataRequestsCard } from '@/components/account/DataRequestsCard';
import { DeactivateAccountCard } from '@/components/account/DeactivateAccountCard';
import { DiscoverabilityCard } from '@/components/account/DiscoverabilityCard';
import { MessagingPreferenceCard } from '@/components/account/MessagingPreferenceCard';
import { PersonalInfoCard } from '@/components/account/PersonalInfoCard';
import { ProfileViewsSettingCard } from '@/components/account/ProfileViewsSettingCard';
import { VisibilitySettingsCard } from '@/components/public-profile/visibility-settings-card';

interface SettingsSection {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  content: ReactNode;
}

const SECTIONS: SettingsSection[] = [
  {
    id: 'account',
    label: 'Account',
    description: 'Your name, contact details and sign-in information.',
    icon: UserRound,
    content: <PersonalInfoCard />,
  },
  {
    id: 'privacy',
    label: 'Privacy & visibility',
    description: 'Control your public profile and who can find you.',
    icon: Eye,
    content: (
      <>
        <VisibilitySettingsCard />
        <DiscoverabilityCard />
        <ProfileViewsSettingCard />
      </>
    ),
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Choose whether employers can message you.',
    icon: MessageSquare,
    content: <MessagingPreferenceCard />,
  },
  {
    id: 'data',
    label: 'Data & account',
    description: 'Download or delete your data, or deactivate your account.',
    icon: Database,
    content: (
      <>
        <DataRequestsCard />
        <DeactivateAccountCard />
      </>
    ),
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState(SECTIONS[0]?.id ?? '');

  // Highlight the section currently in view (the shell's <main> is the scroller).
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const jumpTo = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mx-auto w-full max-w-6xl pt-2 pb-16 font-sans">
      <header className="mb-8 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your personal details, privacy and account.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="lg:sticky lg:top-4 lg:self-start">
          <ul className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = active === section.id;
              return (
                <li key={section.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => jumpTo(section.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white'
                        : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-white',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0',
                        isActive ? 'text-zinc-900 dark:text-white' : 'text-zinc-400',
                      )}
                    />
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-12">
          {SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-heading`}
              className="scroll-mt-6"
            >
              <div className="mb-4">
                <h2
                  id={`${section.id}-heading`}
                  className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white"
                >
                  {section.label}
                </h2>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {section.description}
                </p>
              </div>
              <div className="space-y-4">{section.content}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
