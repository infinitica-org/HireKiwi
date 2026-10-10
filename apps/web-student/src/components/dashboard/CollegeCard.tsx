'use client';

import { useState } from 'react';

/** Up to two initials from the college name, for when there is no logo image. */
function initialsOf(name: string): string {
  const words = name
    .replace(/\(.*?\)/gu, '')
    .split(/\s+/u)
    .filter(
      (word) => /^[\p{L}]/u.test(word) && !['of', 'the', 'and', 'for'].includes(word.toLowerCase()),
    );
  const letters = words.slice(0, 2).map((word) => word[0] ?? '');
  return letters.join('').toUpperCase() || name.trim().charAt(0).toUpperCase() || '—';
}

/**
 * Shows the student's college: its logo (or its initials when there is no logo) and its name.
 * Renders nothing until a college is known.
 */
export function CollegeCard({
  collegeName,
  domain = null,
  logoUrl = null,
}: {
  collegeName: string | null | undefined;
  /** The college's website domain; its logo is fetched from there. */
  domain?: string | null;
  /** An explicit logo address, which wins over the domain. */
  logoUrl?: string | null;
}) {
  const [logoFailed, setLogoFailed] = useState(false);
  const name = collegeName?.trim();
  if (!name) return null;
  const cleanDomain =
    domain
      ?.trim()
      .replace(/^https?:\/\//iu, '')
      .replace(/\/.*$/u, '') ?? '';
  const source =
    logoUrl ??
    (cleanDomain
      ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`
      : null);
  const showLogo = Boolean(source) && !logoFailed;

  return (
    <section
      aria-label="Your college"
      data-testid="college-card"
      className="flex w-full shrink-0 items-center gap-4 sm:w-auto sm:max-w-[420px] rounded-lg border border-zinc-200 p-5 dark:border-zinc-800 dark:bg-[#161616]"
    >
      <div className="flex size-16 shrink-0 items-center  justify-center overflow-hidden ">
        {showLogo ? (
          <img
            src={source as string}
            alt={`${name} logo`}
            className="h-full w-full object-contain p-1.5"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span
            aria-hidden
            className="text-xl font-semibold tracking-wide text-zinc-800 dark:text-zinc-100"
          >
            {initialsOf(name)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <h2 className="mt-0.5 truncate text-xl font-semibold tracking-tight text-zinc-950 dark:text-white">
          {name}
        </h2>
      </div>
    </section>
  );
}
