'use client';

import { useEffect, useState } from 'react';
import type { GetSkillLevelExplanationResponse } from '@hirekiwi/contracts';
import { AiExplanationPanel } from '@hirekiwi/ui';
import { api } from '@/lib/api';
import { friendlyExplanation } from '@/lib/friendly-skill-copy';

const BASIS_LABELS: Record<string, string> = {
  NONE: 'nothing yet',
  ASSESSMENT_ONLY: 'your skill checks',
  EVIDENCE_ONLY: 'your projects',
  ASSESSMENT_AND_EVIDENCE: 'skill checks + projects',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: 'very sure',
  MEDIUM: 'pretty sure',
  LOW: 'still a rough guess',
};

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  PROFICIENT: 'Proficient',
  ADVANCED: 'Advanced',
  PROFESSIONAL: 'Professional',
};

const FRESHNESS_LABELS: Record<string, string> = {
  CURRENT: 'fresh',
  RECENT: 'recent',
  STALE: 'getting old',
  EXPIRED: 'too old to count',
};

function levelLabel(value: string | null | undefined): string {
  if (!value) return 'No level yet';
  return LEVEL_LABELS[value] ?? value;
}

export function SkillLevelExplanationPanel({ skillCode }: { skillCode: string }) {
  const [data, setData] = useState<GetSkillLevelExplanationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.evidence
      .getSkillLevelExplanation(skillCode)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this just now — please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skillCode]);

  if (loading) {
    return (
      <p className="text-sm text-[var(--text-muted)]" role="status">
        Finding out why this is your level…
      </p>
    );
  }

  if (error || !data) {
    return error ? (
      <p className="text-sm text-amber-800 dark:text-amber-300" role="alert">
        {error}
      </p>
    ) : null;
  }

  const conclusions = [
    { key: 'verified', label: 'Your profile', value: data.verifiedVsAi.verified },
    { key: 'assessment', label: 'Your skill check', value: data.verifiedVsAi.assessmentSupported },
    { key: 'inferred', label: 'Your projects', value: data.verifiedVsAi.evidenceInferred },
  ].filter(
    (entry): entry is { key: string; label: string; value: NonNullable<typeof entry.value> } =>
      entry.value != null,
  );

  return (
    <section
      className="flex flex-col gap-4"
      aria-label="Why this skill level"
      data-testid="skill-level-explanation"
    >
      <AiExplanationPanel
        title="Why this level"
        explanation={friendlyExplanation(data.whyThisLevel)}
        tone={
          data.verifiedVsAi.alignment === 'INFERENCE_DIVERGES_FROM_VERIFIED' ? 'warning' : 'info'
        }
      />

      <div className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-4 text-sm">
        <p className="font-medium text-[var(--text-primary)]">
          {friendlyExplanation(data.verifiedVsAi.headline)}
        </p>
        {data.verifiedVsAi.detail ? (
          <p className="mt-2 leading-relaxed text-[var(--text-muted)]">
            {friendlyExplanation(data.verifiedVsAi.detail)}
          </p>
        ) : null}
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Based on: {BASIS_LABELS[data.basis] ?? data.basis} · How sure we are:{' '}
          {CONFIDENCE_LABELS[data.confidence] ?? data.confidence.toLowerCase()}
        </p>
      </div>

      {conclusions.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm" data-testid="conclusion-breakdown">
          {conclusions.map((entry) => (
            <li key={entry.key} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-foreground">{entry.label}</span>
                <span
                  className={[
                    'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tight',
                    entry.value.claimType === 'VERIFIED_FACT'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-purple-50 text-purple-700',
                  ].join(' ')}
                >
                  {entry.value.claimType === 'VERIFIED_FACT' ? 'Confirmed' : 'Best guess'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {levelLabel(entry.value.proficiency)} · {friendlyExplanation(entry.value.summary)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {data.reportRefs.length > 0 ? (
        <div className="text-xs text-muted-foreground" data-testid="report-refs">
          <p className="font-medium text-foreground">What we looked at</p>
          <ul className="mt-1 list-disc pl-4">
            {data.reportRefs.slice(0, 6).map((ref) => (
              <li key={`${ref.kind}-${ref.id}`}>
                {ref.label}
                {ref.promptRef ? ` · ${ref.promptRef}` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {data.competencyRows.length > 0 ? (
        <ul className="flex flex-col gap-2 text-sm">
          {data.competencyRows.slice(0, 5).map((row) => (
            <li
              key={row.competencyId}
              className="rounded-lg border border-border bg-muted/40 px-3 py-2"
            >
              <p className="font-medium text-foreground">{row.capability}</p>
              <p className="mt-1 text-xs text-muted-foreground">{friendlyExplanation(row.why)}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {data.freshness.length > 0 ? (
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground">How fresh your proof is</p>
          <ul className="mt-1 list-disc pl-4">
            {data.freshness.slice(0, 4).map((row) => (
              <li key={row.evidenceId}>
                {row.label} —{' '}
                {FRESHNESS_LABELS[row.freshnessClass] ?? row.freshnessClass.toLowerCase()}
                {row.staleAffectsConfidence ? ' (this can make us less sure)' : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
