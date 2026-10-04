'use client';

import React from 'react';
import type { TransferSkillRow } from '@smart/contracts';

export interface TransferSkillsDisplayProps {
  transferSkills: TransferSkillRow[];
  maxDisplay?: number;
}

const reasonLabels: Record<string, string> = {
  SAME_CATEGORY: 'Same Category',
  CAPABILITY_OVERLAP: 'Capability Match',
  GRAPH_BASED: 'Graph Transfer',
};

const reasonColors: Record<string, string> = {
  SAME_CATEGORY: 'bg-blue-50 text-blue-800 border-blue-200',
  CAPABILITY_OVERLAP: 'bg-purple-50 text-purple-800 border-purple-200',
  GRAPH_BASED: 'bg-green-50 text-green-800 border-green-200',
};

const reasonExplanations: Record<string, string> = {
  SAME_CATEGORY:
    'This skill is in the same category as a required skill, indicating strong transferability',
  CAPABILITY_OVERLAP:
    'This skill shares core competencies with required job capabilities, showing relevant transfer',
  GRAPH_BASED:
    'This skill has been identified through skill graph relationships (REQUIRES, PART_OF, TRANSFERABLE_TO)',
};

const proficiencyDisplay = (rank?: number) => {
  if (!rank) return '';
  const levels = ['', 'Beginner', 'Intermediate', 'Proficient', 'Advanced', 'Professional'];
  return levels[rank] || '';
};

/**
 * Displays transferable skills with their reasons and proficiency levels.
 * Shows how a candidate's verified skills can transfer to job requirements.
 */
export function TransferSkillsDisplay({
  transferSkills,
  maxDisplay = 4,
}: TransferSkillsDisplayProps) {
  if (!transferSkills || transferSkills.length === 0) {
    return null;
  }

  const displayed = transferSkills.slice(0, maxDisplay);
  const remaining = Math.max(0, transferSkills.length - maxDisplay);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold tracking-wide text-[var(--ds-text-muted)]">
        TRANSFERABLE SKILLS
      </h4>
      <div className="space-y-2">
        {displayed.map((skill) => (
          <div
            key={skill.skillCode}
            className="rounded-lg border border-[var(--ds-border-subtle)] bg-[var(--ds-surface)] p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--ds-text)]">{skill.skillName}</p>
                {skill.rank && (
                  <p className="text-xs text-[var(--ds-text-muted)]">
                    Proficiency: {proficiencyDisplay(skill.rank)}
                  </p>
                )}
                {skill.transferExplanation && (
                  <p className="mt-1 text-xs leading-snug text-[var(--ds-text-muted)]">
                    {skill.transferExplanation}
                  </p>
                )}
              </div>
              <div
                className={`inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-[10px] font-semibold ${reasonColors[skill.reason] || 'bg-gray-50 text-gray-800 border-gray-200'}`}
                title={reasonExplanations[skill.reason]}
              >
                {reasonLabels[skill.reason] || skill.reason}
              </div>
            </div>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-xs text-[var(--ds-text-muted)]">
          +{remaining} more transferable skill{remaining > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
