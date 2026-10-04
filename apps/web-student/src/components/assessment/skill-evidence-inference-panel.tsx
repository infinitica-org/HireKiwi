'use client';

import { useEffect, useState } from 'react';
import type { GetSkillEvidenceInferenceResponse } from '@smart/contracts';
import { api } from '@/lib/api';

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Beginner',
  INTERMEDIATE: 'Intermediate',
  PROFICIENT: 'Proficient',
  ADVANCED: 'Advanced',
  PROFESSIONAL: 'Professional',
};

const OUTCOME_LABELS: Record<string, string> = {
  INFERRED: 'Worked out from your proof',
  INSUFFICIENT_EVIDENCE: 'Not enough proof yet',
  VETO_BLOCKED: 'On hold',
};

const CONFIDENCE_LABELS: Record<string, string> = {
  HIGH: 'very sure',
  MEDIUM: 'pretty sure',
  LOW: 'still a rough guess',
};

export function SkillEvidenceInferencePanel({ skillCode }: { skillCode: string }) {
  const [data, setData] = useState<GetSkillEvidenceInferenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api.evidence
      .getSkillEvidenceInference(skillCode)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this right now — please try again.");
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
        Checking your projects and results…
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

  const levelLabel = data.inferredProficiency
    ? (LEVEL_LABELS[data.inferredProficiency] ?? data.inferredProficiency)
    : 'Nothing to read yet';

  return (
    <section
      className="rounded-[var(--radius-card)] border border-[var(--surface-border)] bg-[var(--surface)] p-4 text-sm"
      aria-label="How this level was worked out"
      data-testid="skill-evidence-inference"
    >
      <p className="font-medium text-[var(--text-primary)]">Your combined read</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
        A level worked out from your linked projects, skill checks, and verifications. It sits
        alongside the level shown on your profile.
      </p>
      <p className="mt-3 text-2xl font-bold text-[var(--text-primary)]">{levelLabel}</p>
      <p className="mt-2 text-[var(--text-muted)]">
        {OUTCOME_LABELS[data.outcome] ?? data.outcome} · How sure we are:{' '}
        {CONFIDENCE_LABELS[data.confidence] ?? data.confidence.toLowerCase()}
        {data.evidenceCount > 0
          ? ` · ${String(data.evidenceCount)} piece${
              data.evidenceCount === 1 ? '' : 's'
            } of proof linked`
          : ''}
      </p>
      {data.outcome === 'INSUFFICIENT_EVIDENCE' ? (
        <p className="mt-3 text-amber-800 dark:text-amber-300">
          Link or verify a few more projects and we&apos;ll get a much better read.
        </p>
      ) : null}
    </section>
  );
}
