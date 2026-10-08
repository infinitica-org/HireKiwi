import { fireEvent, render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import type { GradeSdeSkillFormResponse } from '@hirekiwi/contracts';

import type { AssessmentResultView } from '@/lib/competency-display';

import { SkillVerifyReport } from './skill-verify-report';

const grade: GradeSdeSkillFormResponse = {
  skillCode: 'SDE_DSA',

  proficiency: 'BEGINNER',

  marksEarned: 40,

  marksTotal: 50,

  scorePercent: 80,

  passed: true,

  promptRef: 'sde-skill-open-batch-grader@2',

  mcqCorrect: 6,

  mcqTotal: 8,

  traceCorrect: 2,

  traceTotal: 3,

  itemResults: [
    {
      index: 12,

      format: 'CODING',

      marksEarned: 7,

      marksMax: 10,

      testsPassed: 2,

      testsTotal: 3,

      missedTests: [
        {
          input: 'nums = [3,3], target = 6',

          expected: '[0,1]',

          reason: 'Did not handle duplicate values.',
        },
      ],

      feedback: 'Most cases passed; the duplicate-input path is missing.',
    },
  ],
};

const assessmentResult: AssessmentResultView = {
  skillCode: 'SQL_QUERY_OPTIMIZATION',

  assessmentVersion: 'v1',

  attemptId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',

  competencyResults: [
    {
      competencyId: 'c1',

      status: 'DEMONSTRATED',

      confidence: 'HIGH',

      evidence: [],
    },

    {
      competencyId: 'c2',

      status: 'UNCERTAIN',

      confidence: 'LOW',

      evidence: [],
    },
  ],

  highestAssessmentSupportedProficiency: 'INTERMEDIATE',

  targetProficiency: 'PROFESSIONAL',

  assessmentComplete: true,

  assessmentPassed: true,

  uncertainties: ['Optimization'],

  recommendedNextStep: 'NONE',

  requiresInterview: false,

  requiresEvidenceVerification: false,

  requiresAdditionalAssessment: false,

  confidence: 'MEDIUM',

  targetedAssessmentSkipped: true,

  targetedAssessmentSkipReason: 'generation_failed',

  evaluatedAt: new Date().toISOString(),
};

describe('SkillVerifyReport', () => {
  it('shows the under-verification message without revealing results, and navigates back', () => {
    const onDone = vi.fn();

    render(
      <SkillVerifyReport
        grade={grade}
        assessmentResult={assessmentResult}
        catalogSkillCode="SQL_QUERY_OPTIMIZATION"
        onDone={onDone}
      />,
    );

    expect(screen.getByText(/Assessment complete/)).toBeDefined();
    expect(screen.getByText(/This skill is under verification/)).toBeDefined();

    // Results stay hidden until verification finishes.
    expect(screen.queryByText(/80%/)).toBeNull();
    expect(screen.queryByText(/Competency map/)).toBeNull();

    expect(screen.getByRole('link', { name: /view assessments/i }).getAttribute('href')).toBe(
      '/student/assessments',
    );

    fireEvent.click(screen.getByRole('button', { name: /back to skills/i }));
    expect(onDone).toHaveBeenCalled();
  });

  it('shows the same under-verification message when competency results are absent', () => {
    render(
      <SkillVerifyReport
        grade={grade}
        catalogSkillCode="SQL_QUERY_OPTIMIZATION"
        onDone={vi.fn()}
      />,
    );

    expect(screen.getByText(/This skill is under verification/)).toBeDefined();
    expect(screen.queryByText(/80%/)).toBeNull();
    expect(screen.queryByText(/Competency map/)).toBeNull();
  });
});
