import { describe, it, expect } from 'vitest';
import { friendlyExplanation } from './friendly-skill-copy';

const INTERNAL_TOKENS =
  /NOT_TESTED|NOT_DEMONSTRATED|Critical competency|Assessment-only|Conservative min|Rule R-|V-ASSESS|admissible|evidence fusion|proficiency\.?/i;

describe('friendlyExplanation', () => {
  it('rewrites the assessment-only / critical competency reason into plain language', () => {
    const out = friendlyExplanation(
      'Assessment results support beginner proficiency. Assessment-only MEDIUM: Critical competency NOT_TESTED or NOT_DEMONSTRATED caps at MEDIUM',
    );
    expect(out).toContain('Your skill check points to Beginner.');
    expect(out).not.toMatch(INTERNAL_TOKENS);
  });

  it('rewrites internal rule and veto IDs in competency rows', () => {
    expect(friendlyExplanation('Rule R-DEFAULT-01; vetoes V-ASSESS-FLOOR-01')).toBe(
      'Some checks on your work kept this at a conservative level.',
    );
    expect(friendlyExplanation('Rule R-ASSESS-PASS-01')).toBe(
      'Worked out from your skill check and your projects.',
    );
  });

  it('rewrites the competency assessment summary sentence', () => {
    expect(
      friendlyExplanation('Competency assessment supports BEGINNER with medium confidence.'),
    ).toBe("Your skill check points to Beginner, and we're fairly sure.");
  });

  it('rewrites the aligned headline into simple words', () => {
    expect(
      friendlyExplanation('Verified, assessment, and evidence signals align at beginner.'),
    ).toBe('Your profile, skill check, and projects all agree at Beginner.');
  });

  it('keeps sentences that are already user-friendly untouched', () => {
    expect(friendlyExplanation('Consistent algorithmic mastery observed.')).toBe(
      'Consistent algorithmic mastery observed.',
    );
  });

  it('rewrites empty-state wording', () => {
    const out = friendlyExplanation('No admissible assessment or project evidence.');
    expect(out).not.toMatch(/admissible/i);
    expect(out).toContain('skill checks or projects');
  });

  it('rewrites a mixed detail payload without leaving internal terms', () => {
    const out = friendlyExplanation(
      'Verified on your profile at beginner. Competency assessment supports BEGINNER with medium confidence. Assessment-only MEDIUM: Critical competency NOT_TESTED or NOT_DEMONSTRATED caps at MEDIUM',
    );
    expect(out).not.toMatch(INTERNAL_TOKENS);
    expect(out).toContain('Verified on your profile at Beginner.');
  });

  it('falls back to generic copy when internal phrasing has no rule yet', () => {
    expect(friendlyExplanation('Cluster consensus MEDIUM; fusionRule drift detected')).toBe(
      "We're still working out the details here.",
    );
  });

  it('keeps friendly sentences when only a later sentence is unmapped', () => {
    const out = friendlyExplanation(
      'Verified on your profile at beginner. Signal fusion uses confidenceReason ruleSetVersion v3.',
    );
    expect(out).toContain('Verified on your profile at Beginner.');
    expect(out).toContain("We're still working out the details here.");
  });

  it('dedupes consecutive fallback sentences', () => {
    const out = friendlyExplanation('contradictionDimensions LOW. corroborationScore MEDIUM.');
    expect(out).toBe("We're still working out the details here.");
  });
});
