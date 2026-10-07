'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Code2, Plus } from 'lucide-react';
import { SKILL_DEFINITIONS, type SkillClaimDto } from '@hirekiwi/contracts';

import { api } from '@/lib/api';
import {
  ProfileBentoEmptyPanel,
  ProfileSectionError,
  ProfileSectionHeader,
} from '@/components/profile/ProfileSectionChrome';
import { profileCardClass, profilePrimaryButtonSmClass } from '@/lib/profile-ui-classes';

const SKILLS_PAGE_HREF = '/skills';

/** The skills the student has added. Adding more happens on the Skills page. */
export function SkillsSection() {
  const [claims, setClaims] = useState<SkillClaimDto[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await api.assessment.listSkillClaims();
        if (!cancelled) setClaims(rows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load skills.');
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSkills = useMemo(() => {
    const codes = new Set(claims.map((row) => row.skillCode));
    return SKILL_DEFINITIONS.filter((skill) => codes.has(skill.code)).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [claims]);

  const addLink = (extraClass: string) => (
    <Link href={SKILLS_PAGE_HREF} className={`${profilePrimaryButtonSmClass} ${extraClass}`}>
      <Plus className="size-4" strokeWidth={2} aria-hidden />
      Add skills
    </Link>
  );

  return (
    <section
      className="flex w-full min-w-0 flex-col gap-4 font-[family-name:var(--tpo-font-sans)]"
      aria-label="Skills"
    >
      <ProfileSectionHeader
        title="Skills"
        description="Skills you chose to assess and build verified credentials for. They also appear on your Assessment page."
        action={hydrated ? addLink('justify-center px-4 py-2.5 text-[13px] font-semibold') : null}
      />

      {error ? <ProfileSectionError>{error}</ProfileSectionError> : null}

      {!hydrated ? (
        <p className="text-sm text-[var(--ds-text-muted)]" aria-live="polite">
          Loading skills…
        </p>
      ) : null}

      {hydrated && selectedSkills.length === 0 ? (
        <ProfileBentoEmptyPanel
          emptyIcon={Code2}
          emptyTitle="No skills yet"
          emptyBody="When you add a skill, it appears here and on your Assessment page."
          actions={addLink('justify-center px-5 py-2.5 text-[13px]')}
        />
      ) : null}

      {hydrated && selectedSkills.length > 0 ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {selectedSkills.map((skill) => (
            <li key={skill.code} className={`${profileCardClass} !p-4`}>
              <p className="text-sm font-semibold text-zinc-950 dark:text-white">{skill.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {skill.categoryName}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
