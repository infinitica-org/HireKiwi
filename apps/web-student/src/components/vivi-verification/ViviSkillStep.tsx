'use client';

import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { SLIM_SCROLL } from '@/lib/scroll-classes';
import type { ProjectSkillOption } from '@/lib/project-form-skills';

const MAX_ROWS = 200;

/** Search box and a scrollable list of catalog skills. Click a row to pick or drop a skill. */
export function ViviSkillStep({
  options,
  selectedCodes,
  onToggle,
  loading = false,
  error,
  disabled = false,
}: {
  options: readonly ProjectSkillOption[];
  selectedCodes: readonly string[];
  onToggle: (code: string) => void;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => new Set(selectedCodes), [selectedCodes]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? options.filter(
          (option) =>
            option.name.toLowerCase().includes(q) || option.categoryName.toLowerCase().includes(q),
        )
      : options;
    return matches.slice(0, MAX_ROWS);
  }, [options, query]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <label className="relative block">
        <span className="sr-only">Search skills</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-pink-400"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search a skill (e.g., React, Python, Data Analysis)"
          aria-label="Search skills"
          className="h-10 w-full rounded-lg border border-pink-400 bg-white pr-3 pl-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 dark:bg-zinc-900 dark:text-white"
        />
      </label>

      {error ? (
        <p role="alert" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}

      <p className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
        {query.trim() ? 'Results' : 'All skills'}
      </p>

      <div className={`min-h-0 flex-1 overflow-y-auto rounded-lg ${SLIM_SCROLL}`}>
        {loading ? (
          <p className="px-2 py-6 text-sm text-zinc-500">Loading skills…</p>
        ) : rows.length === 0 ? (
          <p className="px-2 py-6 text-sm text-zinc-500">No skills match “{query.trim()}”.</p>
        ) : (
          <ul aria-label="Skills" className="flex flex-col">
            {rows.map((option) => {
              const isOn = selected.has(option.code);
              return (
                <li key={option.code}>
                  <button
                    type="button"
                    data-code={option.code}
                    aria-pressed={isOn}
                    disabled={disabled}
                    onClick={() => onToggle(option.code)}
                    className={`flex w-full items-center gap-3.5 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60 ${
                      isOn ? 'bg-zinc-50 dark:bg-zinc-800/50' : ''
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {option.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {option.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {option.categoryName}
                      </span>
                    </span>
                    {isOn ? (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded bg-pink-500 text-white">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
