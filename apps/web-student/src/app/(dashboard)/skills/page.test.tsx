import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SkillsProfilePage from './page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    assessment: {
      listSkillClaims: vi.fn(),
      declareSkillClaim: vi.fn(),
    },
    evidence: {
      getSkillLevelExplanation: vi.fn(),
      disputeEvidenceMapping: vi.fn(),
    },
  },
}));

describe('SkillsProfilePage E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders claimed skills and expands "Why this level?" with end-to-end explanation details', async () => {
    vi.mocked(api.assessment.listSkillClaims).mockResolvedValue([
      {
        claimId: 'claim-1',
        studentId: 'student-1',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        proficiency: 'INTERMEDIATE',
        status: 'VERIFIED',
        strikes: 0,
        lockedUntil: null,
        lastAttemptId: 'attempt-1',
      },
    ]);

    vi.mocked(api.evidence.getSkillLevelExplanation).mockResolvedValue({
      skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      skillName: 'Python',
      claimStatus: 'VERIFIED',
      basis: 'ASSESSMENT_AND_EVIDENCE',
      whyThisLevel:
        'Assessment and linked project evidence were fused to support intermediate proficiency. Consistent algorithmic mastery observed.',
      verifiedVsAi: {
        verified: {
          proficiency: 'INTERMEDIATE',
          summary: 'Verified on your profile at intermediate.',
          source: 'SKILL_CLAIM',
          claimType: 'VERIFIED_FACT',
        },
        assessmentSupported: {
          proficiency: 'INTERMEDIATE',
          summary: 'Latest assessment supports up to intermediate.',
          source: 'ASSESSMENT',
          claimType: 'VERIFIED_FACT',
        },
        evidenceInferred: {
          proficiency: 'INTERMEDIATE',
          summary: 'Evidence fusion aligns with verified diagnostic claim.',
          source: 'FUSION',
          claimType: 'AI_INFERENCE',
        },
        alignment: 'ALIGNED',
        headline: 'Verified, assessment, and evidence signals align at intermediate.',
        detail:
          'Verified on your profile at intermediate. Latest assessment supports up to intermediate.',
      },
      competencyRows: [
        {
          competencyId: '11111111-1111-4111-8111-111111111111',
          capability: 'Asymptotic Complexity Analysis',
          status: 'DEMONSTRATED',
          primarySource: 'ASSESSMENT',
          why: 'Demonstrated during diagnostic verification.',
        },
      ],
      reportRefs: [
        {
          kind: 'ASSESSMENT_ATTEMPT',
          id: '22222222-2222-4222-8222-222222222222',
          label: 'Skill verification assessment',
          evaluatedAt: '2026-09-29T12:00:00.000Z',
        },
      ],
      freshness: [
        {
          evidenceId: '33333333-3333-4333-8333-333333333333',
          label: 'Python Challenge',
          freshnessClass: 'CURRENT',
          ageDays: 5,
          maxAgeDays: 365,
          staleAffectsConfidence: false,
        },
      ],
      confidence: 'HIGH',
      confidenceReason: 'Verified via multi-source assessment defense.',
      ruleSetVersion: 'v1',
      computedAt: '2026-09-29T12:00:00.000Z',
    });

    render(<SkillsProfilePage />);

    // Wait for skill claims to load
    await waitFor(() => {
      expect(screen.getByText('Python')).toBeDefined();
    });

    // Verified claims show a "Verified" badge next to the level badge
    expect(screen.getByText('Verified')).toBeDefined();

    // Verify toggle button is present
    const whyToggle = screen.getByRole('button', { name: /why this level\?/i });
    expect(whyToggle).toBeDefined();

    // Click toggle to expand
    fireEvent.click(whyToggle);

    // Verify API called for explanation
    await waitFor(() => {
      expect(api.evidence.getSkillLevelExplanation).toHaveBeenCalledWith(
        'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      );
    });

    // Check explanation content rendered
    await waitFor(() => {
      expect(screen.getByText(/consistent algorithmic mastery observed/i)).toBeDefined();
      expect(screen.getByText(/your profile, skill check, and projects all agree/i)).toBeDefined();
    });

    // Check supporting records & freshness
    expect(screen.getByText('Asymptotic Complexity Analysis')).toBeDefined();
    expect(screen.getByText(/Python Challenge/i)).toBeDefined();
  });

  it('shows a Not Verified badge for a self-declared claim', async () => {
    vi.mocked(api.assessment.listSkillClaims).mockResolvedValue([
      {
        claimId: 'claim-2',
        studentId: 'student-1',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        proficiency: 'INTERMEDIATE',
        status: 'DECLARED',
        strikes: 0,
        lockedUntil: null,
        lastAttemptId: null,
        claimConfidence: 0.8,
      },
    ]);

    render(<SkillsProfilePage />);

    expect(await screen.findByText('Not Verified')).toBeDefined();
  });
});
