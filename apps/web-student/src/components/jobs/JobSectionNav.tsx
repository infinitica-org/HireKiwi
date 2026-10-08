'use client';

import { useEffect, useState } from 'react';
import type { JobSectionLink } from './JobMoreDetails';

/** Jump-to menu for the job page: click a name to scroll there; the one in view is underlined. */
export function JobSectionNav({ sections }: { sections: JobSectionLink[] }) {
  const [active, setActive] = useState<string | null>(sections[0]?.id ?? null);
  const key = sections.map((section) => section.id).join('|');

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        const first = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
        )[0];
        if (first) setActive(first.target.id);
      },
      { rootMargin: '-90px 0px -60% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [key]);

  if (sections.length < 2) return null;

  return (
    <nav
      aria-label="Job sections"
      className="sticky top-0 z-10 -mx-1 overflow-x-auto border-b border-zinc-200 bg-white/90 px-1 backdrop-blur [scrollbar-width:none] dark:border-zinc-800 dark:bg-[#0c0c0c]/90 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex items-center gap-1">
        {sections.map((section) => (
          <li key={section.id} className="shrink-0">
            <a
              href={`#${section.id}`}
              onClick={(event) => {
                event.preventDefault();
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActive(section.id);
              }}
              aria-current={active === section.id ? 'true' : undefined}
              className={`-mb-px block border-b-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors ${
                active === section.id
                  ? 'border-zinc-900 text-zinc-950 dark:border-white dark:text-white'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
