'use client';

import { useMemo, useState } from 'react';
import type { GithubRepoSummary } from '@hirekiwi/contracts';
import { GitBranch, Loader2, Search } from 'lucide-react';
import { formatRepoUpdatedAt } from '@/components/profile/projects/project-presenters';
import { profileSecondaryButtonSmClass } from '@/lib/profile-ui-classes';
import { SLIM_SCROLL } from '@/lib/scroll-classes';

type GithubImportPanelProps = {
  githubLogin: string | null;
  showImport: boolean;
  repos: GithubRepoSummary[] | null;
  reposLoading: boolean;
  reposError: string | null;
  importingRepo: string | null;
  onToggle: () => void;
  onRetry: () => void;
  onSelectRepo: (repo: GithubRepoSummary) => void;
  onManual: () => void;
  /** When true, hides duplicate entry controls (wizard already chose GitHub). */
  wizardMode?: boolean;
};

/** Usual GitHub colours for common languages. */
const LANGUAGE_COLOR: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572a5',
  Java: '#b07219',
  Kotlin: '#a97bff',
  'C#': '#178600',
  C: '#555555',
  'C++': '#f34b7d',
  Go: '#00add8',
  Rust: '#dea584',
  PHP: '#4f5d95',
  Ruby: '#701516',
  Swift: '#f05138',
  Dart: '#00b4ab',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Jupyter: '#da5b0b',
  'Jupyter Notebook': '#da5b0b',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

/** A language's colour; any language not listed gets a steady colour made from its name. */
export function languageColor(language: string): string {
  const known = LANGUAGE_COLOR[language];
  if (known) return known;
  let hash = 0;
  for (const char of language) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return `hsl(${String(hash % 360)} 62% 52%)`;
}

export function GithubImportPanel({
  githubLogin,
  showImport,
  repos,
  reposLoading,
  reposError,
  importingRepo,
  onToggle,
  onRetry,
  onSelectRepo,
  onManual,
  wizardMode = false,
}: GithubImportPanelProps) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = repos ?? [];
    return q
      ? all.filter(
          (repo) =>
            repo.fullName.toLowerCase().includes(q) ||
            (repo.description ?? '').toLowerCase().includes(q),
        )
      : all;
  }, [repos, query]);

  return (
    <div className={`flex flex-col gap-4 ${wizardMode ? 'h-full min-h-0' : ''}`}>
      {!wizardMode ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-[var(--ds-text)]">Import from GitHub</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--ds-text-muted)]">
              Connect your GitHub account and select a repository to prefill project details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onToggle} className={profileSecondaryButtonSmClass}>
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              {showImport ? 'Hide repositories' : 'Import from GitHub'}
            </button>
            <button type="button" onClick={onManual} className={profileSecondaryButtonSmClass}>
              Add manually
            </button>
          </div>
        </>
      ) : null}

      {showImport ? (
        !githubLogin ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            Add your GitHub URL under Profile → Integrations, click Save links, then try again — or
            add project details manually.
          </p>
        ) : reposLoading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading your repositories…
          </p>
        ) : reposError ? (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{reposError}</p>
            <button type="button" onClick={onRetry} className={profileSecondaryButtonSmClass}>
              Retry loading repositories
            </button>
          </div>
        ) : repos && repos.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            No public repos found for {githubLogin}.
          </p>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <label className="relative block shrink-0">
              <span className="sr-only">Search repositories</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${String(repos?.length ?? 0)} repositories`}
                aria-label="Search repositories"
                className="h-10 w-full rounded-lg border border-zinc-300 bg-white pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              />
            </label>

            {visible.length === 0 ? (
              <p className="px-1 py-4 text-sm text-zinc-500">
                No repositories match “{query.trim()}”.
              </p>
            ) : (
              <ul
                className={`min-h-0 flex-1 divide-y divide-zinc-200 overflow-y-auto rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800 ${SLIM_SCROLL}`}
              >
                {visible.map((repo) => {
                  const repoName = repo.fullName.split('/')[1] ?? repo.fullName;
                  const updated = formatRepoUpdatedAt(repo.updatedAt);
                  const busy = importingRepo === repo.fullName;
                  const language = repo.primaryLanguage;
                  return (
                    <li
                      key={repo.id}
                      className="flex items-center gap-4 bg-white px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:bg-transparent dark:hover:bg-zinc-800/40"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        <GitBranch className="size-[18px]" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                          {repoName}
                        </p>
                        {repo.description ? (
                          <p className="mt-0.5 truncate text-[13px] text-zinc-500">
                            {repo.description}
                          </p>
                        ) : (
                          <p className="mt-0.5 truncate text-[13px] text-zinc-400">
                            {repo.fullName}
                          </p>
                        )}
                        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                          {language ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                aria-hidden
                                className="size-2.5 rounded-full"
                                style={{ backgroundColor: languageColor(language) }}
                              />
                              {language}
                            </span>
                          ) : null}
                          {updated ? <span>Updated {updated}</span> : null}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={importingRepo !== null}
                        onClick={() => onSelectRepo(repo)}
                        aria-label={`Use this repository: ${repoName}`}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-800 transition-colors hover:border-pink-400 hover:bg-pink-50 hover:text-pink-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-100"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            Importing…
                          </>
                        ) : (
                          'Import'
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )
      ) : null}
    </div>
  );
}
