'use client';

import { ChevronRight } from 'lucide-react';
import {
  proficiencyLevelNumber,
  proficiencyLevelUiLabel,
  type CandidateMatchDto,
  type SkillFitRow,
} from '@hirekiwi/contracts';
import { potentialFitLabel } from '../../lib/matching-display';
import { cardClass, chipClass, mutedTextClass, sectionLabelClass } from '../../lib/tpo-ui';
import { ProficiencyLevelCircles } from './proficiency-level-ui';
import { TransferSkillsDisplay } from './TransferSkillsDisplay';
import { EvidenceValidationIndicator } from './EvidenceValidationIndicator';

const pillClass =
  'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold';

const PREVIEW_SKILL_LIMIT = 4;
const PREVIEW_VERIFIED_LIMIT = 5;

function skillStatusLabel(status: SkillFitRow['status']): string {
  if (status === 'MET') return 'Meets opening';
  if (status === 'MISSING') return 'Not verified';
  return 'Partial';
}

function skillStatusPillClass(status: SkillFitRow['status']): string {
  if (status === 'MET') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'MISSING') return 'bg-rose-50 text-rose-800 border-rose-200';
  return 'bg-amber-50 text-amber-900 border-amber-200';
}

function CoverageMeter({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="min-w-[120px] flex-1">
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
        <span className={mutedTextClass}>{label}</span>
        <span className="font-semibold tabular-nums text-[var(--ds-text)]">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ds-surface-muted)]">
        <div
          className="h-full rounded-full bg-[var(--tpo-accent)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function OpeningSkillPreview({ row }: { row: SkillFitRow }) {
  const required = proficiencyLevelNumber(row.requiredProficiency);
  const actual = row.actualProficiency ? proficiencyLevelNumber(row.actualProficiency) : 0;

  return (
    <li className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-[var(--ds-text)]">{row.skillName}</p>
        <span
          className={`${pillClass} shrink-0 border ${skillStatusPillClass(row.status)} text-[10px]`}
        >
          {skillStatusLabel(row.status)}
        </span>
      </div>
      <p className={`mt-1 text-[11px] ${mutedTextClass}`}>
        Requires {proficiencyLevelUiLabel(row.requiredProficiency)}
        {row.actualProficiency
          ? ` · Verified ${proficiencyLevelUiLabel(row.actualProficiency)}`
          : ''}
      </p>
      <div className="mt-2">
        <ProficiencyLevelCircles actualLevel={actual} requiredLevel={required} size="sm" />
      </div>
    </li>
  );
}

export function CandidateSuggestionCard({
  candidate,
  rank,
  skillCapability,
  matchPercent,
  whyText,
  skillCoveragePct,
  capabilityCoveragePct,
  selected,
  opportunitySent,
  sending,
  onToggleSelect,
  onViewSkillGap,
}: {
  candidate: CandidateMatchDto;
  rank: number;
  skillCapability: boolean;
  matchPercent: number;
  whyText: string;
  skillCoveragePct?: number;
  capabilityCoveragePct?: number;
  selected: boolean;
  opportunitySent: boolean;
  sending: boolean;
  onToggleSelect: () => void;
  onViewSkillGap: () => void;
}) {
  const skillFit = candidate.explanation.skillFit ?? [];
  const previewSkills = skillFit.slice(0, PREVIEW_SKILL_LIMIT);
  const extraSkillCount = Math.max(0, skillFit.length - previewSkills.length);
  const verified = candidate.explanation.verifiedSkills ?? [];
  const previewVerified = verified.slice(0, PREVIEW_VERIFIED_LIMIT);
  const extraVerifiedCount = Math.max(0, verified.length - previewVerified.length);

  const skillsMetCount = skillFit.filter((row) => row.status === 'MET').length;
  const skillGapCount = skillFit.filter((row) => row.status !== 'MET').length;
  const competenciesMetCount = (candidate.explanation.capabilityFit ?? []).filter(
    (row) => row.hitScore >= 0.5,
  ).length;
  const competencyGapCount = (candidate.explanation.capabilityFit ?? []).filter(
    (row) => row.hitScore < 0.5,
  ).length;
  const evidenceSummaries = candidate.explanation.competencyEvidenceSummaries ?? [];
  const previewEvidence = evidenceSummaries.slice(0, 3);
  const extraEvidenceCount = Math.max(0, evidenceSummaries.length - previewEvidence.length);

  // Generate user-friendly recruiter summary focused on student's fit and potential
  const generateRecruiterSummary = () => {
    const parts: string[] = [];

    // Opening statement: match score and potential fit
    const matchQuality =
      matchPercent >= 90
        ? 'Excellent match'
        : matchPercent >= 75
          ? 'Strong match'
          : matchPercent >= 60
            ? 'Moderate match'
            : 'Emerging match';

    const potentialFit = candidate.explanation.potentialFit;
    const potentialStatement =
      potentialFit === 'STRONG'
        ? ' with high growth potential'
        : potentialFit === 'MODERATE'
          ? ' with reasonable upside'
          : potentialFit === 'STRETCH'
            ? ' — stretch candidate with upskilling path'
            : '';

    parts.push(`${matchQuality}${potentialStatement} (${matchPercent}% verified match).`);

    // Strengths and demonstrated capability
    if (candidate.explanation.strongCompetencies?.length > 0) {
      const strengths = candidate.explanation.strongCompetencies.slice(0, 3);
      parts.push(
        `Demonstrates strength in ${strengths.length === 1 ? 'competency' : 'competencies'}: ${strengths.join(', ')}.`,
      );
    }

    // Verified skills and coverage
    if (skillFit.length > 0) {
      if (skillsMetCount === skillFit.length) {
        parts.push(`All ${skillFit.length} required skills verified.`);
      } else if (skillsMetCount > 0) {
        const metSkills = skillFit.filter((r) => r.status === 'MET');
        const skillsWithLevels = metSkills
          .map((s) => `${s.skillName} (${s.actualProficiency?.replace(/_/g, ' ').toLowerCase()})`)
          .join(', ');
        const gapSkills = skillFit.filter((r) => r.status !== 'MET').map((r) => r.skillName);
        parts.push(
          `Verified ${skillsMetCount} of ${skillFit.length} required skills: ${skillsWithLevels} — trainable gaps on ${gapSkills.join(', ')}.`,
        );
      }
    }

    // Transfer skills (additional value)
    if ((candidate.explanation.transferSkills?.length ?? 0) > 0) {
      const transferCount = candidate.explanation.transferSkills?.length ?? 0;
      parts.push(
        `${transferCount} transfer skill${transferCount === 1 ? '' : 's'} from adjacent domains add practical depth.`,
      );
    }

    // Readiness and recommendation
    if (skillsMetCount === skillFit.length && competencyGapCount === 0) {
      parts.push('Hire-ready: no onboarding skill gaps.');
    } else if (skillsMetCount === skillFit.length) {
      parts.push(
        `Skill-ready; ${competencyGapCount} competency gap${competencyGapCount === 1 ? '' : 's'} addressable with targeted coaching.`,
      );
    } else if (skillsMetCount > skillFit.length * 0.6) {
      parts.push('Quick learner path: ~2–4 week upskilling for full readiness.');
    }

    return parts.join(' ');
  };

  const recruiterSummary = generateRecruiterSummary();

  // Calculate coverage percentages from actual data for consistency
  const calculatedSkillCoveragePct = skillFit.length > 0 ? skillsMetCount / skillFit.length : 0;
  const calculatedCapabilityCoveragePct =
    competenciesMetCount + competencyGapCount > 0
      ? competenciesMetCount / (competenciesMetCount + competencyGapCount)
      : 0;

  // Use calculated values if props not provided or if they're inconsistent
  const displaySkillCoveragePct = skillCoveragePct ?? calculatedSkillCoveragePct;
  const displayCapabilityCoveragePct = capabilityCoveragePct ?? calculatedCapabilityCoveragePct;

  return (
    <article className={`${cardClass} flex flex-col gap-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 cursor-pointer rounded border-[var(--ds-border)] accent-[var(--ds-green)]"
            aria-label={`Select ${candidate.studentName}`}
            checked={selected}
            disabled={sending || opportunitySent}
            onChange={onToggleSelect}
          />
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--tpo-accent-tint)] to-[var(--ds-surface-muted)] text-xs font-bold text-[var(--ds-text)] ring-1 ring-[var(--ds-border-subtle)]">
            #{rank}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--ds-text)]">
              {candidate.studentName}
            </h2>
            {skillCapability ? (
              <p className={`mt-0.5 text-xs ${mutedTextClass}`}>
                {skillGapCount} skill gap{skillGapCount === 1 ? '' : 's'}
                {' · '}
                {competencyGapCount} competency gap{competencyGapCount === 1 ? '' : 's'}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {skillCapability && candidate.explanation.potentialFit ? (
            <span
              className={`${pillClass} max-w-[200px] border-violet-200 bg-violet-50 text-violet-900`}
            >
              {potentialFitLabel(candidate.explanation.potentialFit)}
            </span>
          ) : null}
          <span className={`${pillClass} border-emerald-200 bg-emerald-50 text-emerald-800`}>
            {matchPercent}% match
          </span>
          {opportunitySent ? (
            <span className={`${pillClass} border-sky-200 bg-sky-50 text-sky-800`}>Sent</span>
          ) : null}
        </div>
      </div>

      {skillCapability &&
      (displaySkillCoveragePct !== undefined || displayCapabilityCoveragePct !== undefined) ? (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-muted)]/60 px-4 py-3 sm:flex-row sm:items-end sm:gap-6">
          <CoverageMeter label="Skill coverage" value={displaySkillCoveragePct ?? 0} />
          <CoverageMeter label="Capability coverage" value={displayCapabilityCoveragePct ?? 0} />
          <p className={`text-[11px] sm:pb-0.5 ${mutedTextClass}`}>
            Ranked by verified required skills
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="h-full flex flex-col rounded-xl border border-[var(--tpo-accent-border)]/80 bg-gradient-to-br from-[var(--tpo-accent-tint)] to-[var(--ds-surface)] p-4">
            <p className={sectionLabelClass}>Why this candidate</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ds-text)] flex-1">
              {recruiterSummary || whyText}
            </p>
            <div className="mt-3 border-t border-[var(--tpo-accent-border)]/40 pt-3">
              <p className={`text-xs font-medium ${mutedTextClass}`}>
                {skillGapCount === 0 && competencyGapCount === 0 ? (
                  <span className="text-emerald-700 font-semibold">
                    ✓ Perfect match — all requirements met
                  </span>
                ) : skillGapCount === 0 ? (
                  <span className="text-amber-700">
                    ⚠ Strong match — {competencyGapCount} capability gap
                    {competencyGapCount === 1 ? '' : 's'}
                  </span>
                ) : competencyGapCount === 0 ? (
                  <span className="text-amber-700">
                    ⚠ Partial match — {skillGapCount} skill gap{skillGapCount === 1 ? '' : 's'}
                  </span>
                ) : (
                  <span className="text-rose-700">
                    ⚠ Multiple gaps — {skillGapCount} skill + {competencyGapCount} competency gap
                    {skillGapCount + competencyGapCount === 1 ? '' : 's'}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7">
          {skillCapability && skillFit.length > 0 ? (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className={sectionLabelClass}>Opening-required skills</p>
                <button
                  type="button"
                  onClick={onViewSkillGap}
                  className="inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--ds-green)] hover:underline"
                >
                  View skill gap
                  <ChevronRight className="size-3.5" aria-hidden />
                </button>
              </div>
              <ul className="flex flex-col gap-2">
                {previewSkills.map((row) => (
                  <OpeningSkillPreview key={row.skillCode} row={row} />
                ))}
              </ul>
              {extraSkillCount > 0 ? (
                <button
                  type="button"
                  onClick={onViewSkillGap}
                  className={`mt-2 text-xs font-medium text-[var(--ds-green)] hover:underline`}
                >
                  +{extraSkillCount} more opening skill{extraSkillCount === 1 ? '' : 's'} in sidebar
                </button>
              ) : null}
            </div>
          ) : null}

          {previewEvidence.length > 0 ? (
            <div>
              <p className={`mb-2 ${sectionLabelClass}`}>Demonstrated capabilities</p>
              <ul className="flex flex-col gap-2">
                {previewEvidence.map((row) => (
                  <li
                    key={`${row.capabilityLabel}-${row.skillCode ?? 'general'}`}
                    className="rounded-xl border border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-[var(--ds-text)]">
                      {row.capabilityLabel}
                    </p>
                    <p className={`mt-0.5 text-[11px] ${mutedTextClass}`}>
                      {row.proficiency.replace(/_/g, ' ').toLowerCase()}
                      {' · '}
                      {Math.round(row.confidenceScore * 100)}% confidence
                    </p>
                    {row.evidenceSnippets[0] ? (
                      <p className={`mt-1.5 text-xs leading-snug ${mutedTextClass}`}>
                        {row.evidenceSnippets[0]}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {extraEvidenceCount > 0 ? (
                <p className={`mt-2 text-xs ${mutedTextClass}`}>
                  +{extraEvidenceCount} more capability signal{extraEvidenceCount === 1 ? '' : 's'}
                </p>
              ) : null}
            </div>
          ) : null}

          {candidate.explanation.transferSkills &&
          candidate.explanation.transferSkills.length > 0 ? (
            <div>
              <TransferSkillsDisplay
                transferSkills={candidate.explanation.transferSkills}
                maxDisplay={3}
              />
            </div>
          ) : null}

          {candidate.explanation.evidenceQualityMetrics &&
          candidate.explanation.evidenceQualityMetrics.length > 0 ? (
            <div>
              <EvidenceValidationIndicator
                metrics={candidate.explanation.evidenceQualityMetrics}
                compact={true}
              />
            </div>
          ) : null}

          {verified.length > 0 ? (
            <div>
              <p className={`mb-2 ${sectionLabelClass}`}>Verified on profile</p>
              <ul className="flex flex-wrap gap-2">
                {previewVerified.map((skill) => (
                  <li
                    key={skill.skillCode}
                    className={`${chipClass} border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] text-[11px]`}
                  >
                    <span className="font-medium text-[var(--ds-text)]">{skill.skillName}</span>
                    <span className="text-[var(--ds-text-muted)]">
                      {' '}
                      · {proficiencyLevelUiLabel(skill.proficiency)}
                    </span>
                  </li>
                ))}
                {extraVerifiedCount > 0 ? (
                  <li className={`${chipClass} text-[11px] text-[var(--ds-text-muted)]`}>
                    +{extraVerifiedCount} more
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      {!skillCapability &&
      (candidate.explanation.strongCompetencies.length > 0 ||
        candidate.explanation.gapCompetencies.length > 0) ? (
        <div className="flex flex-wrap gap-4 border-t border-[var(--ds-border-subtle)] pt-3 text-xs font-medium">
          {candidate.explanation.strongCompetencies.length > 0 ? (
            <div>
              <span className="text-[var(--ds-text-muted)]">Strong competencies:</span>{' '}
              <span className="font-semibold text-emerald-700">
                {candidate.explanation.strongCompetencies.join(', ')}
              </span>
            </div>
          ) : null}
          {candidate.explanation.gapCompetencies.length > 0 ? (
            <div>
              <span className="text-[var(--ds-text-muted)]">Gaps identified:</span>{' '}
              <span className="font-semibold text-amber-700">
                {candidate.explanation.gapCompetencies.join(', ')}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
