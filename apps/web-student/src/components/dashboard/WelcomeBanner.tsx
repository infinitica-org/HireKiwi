'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@hirekiwi/ui';

type Slide = { title: string; body: string; ctaLabel: string; href: string };

const SLIDES: Slide[] = [
  {
    title: 'Learn how to get started on HireKiwi',
    body: 'Complete your profile, verify your skills and get matched to roles at your institution.',
    ctaLabel: 'Complete profile',
    href: '/profile',
  },
  {
    title: 'Verify your first skill',
    body: 'Verified skills raise your match score and put you in front of employers first.',
    ctaLabel: 'Go to skills',
    href: '/skills',
  },
  {
    title: 'See the roles that fit you',
    body: 'Every match is scored against your verified skills. Save the ones you like and apply.',
    ctaLabel: 'View matches',
    href: '/matches',
  },
];

const ROTATE_MS = 7000;

/** "Getting started" carousel at the top of the dashboard, in the white SMART/TPO card style. */
export function WelcomeBanner() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [index]);

  const slide = SLIDES[index] ?? SLIDES[0];
  if (!slide) return null;

  return (
    <section
      aria-label="Getting started"
      data-testid="welcome-banner"
      className="relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white bg-[radial-gradient(ellipse_60%_80%_at_100%_0%,rgba(225,255,160,0.45)_0%,rgba(180,248,220,0.3)_45%,rgba(255,255,255,0)_80%),radial-gradient(ellipse_50%_70%_at_0%_100%,rgba(180,248,220,0.4)_0%,rgba(225,255,160,0.25)_45%,rgba(255,255,255,0)_80%)] bg-no-repeat px-6 py-6 text-zinc-950 sm:px-8 dark:border-zinc-800 dark:bg-[#161616] dark:bg-none dark:text-white"
    >
      <div className="flex gap-1.5" role="tablist" aria-label="Getting started steps">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Step ${i + 1}: ${s.title}`}
            onClick={() => setIndex(i)}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              i === index
                ? 'w-10 bg-zinc-900 dark:bg-white'
                : 'w-4 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700',
            )}
          />
        ))}
      </div>

      <h2 className="mt-4 text-xl font-semibold tracking-tight sm:text-2xl">{slide.title}</h2>
      <p className="mt-1.5 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">{slide.body}</p>
      <Link
        href={slide.href}
        className="mt-5 inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-black dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
      >
        {slide.ctaLabel}
      </Link>
    </section>
  );
}
