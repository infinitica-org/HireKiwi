import { describe, expect, it } from 'vitest';
import { ACTIVE_TAXONOMY_VERSION } from '@smart/contracts';
import { DEFAULT_SIGNAL_WEIGHT_MODEL } from './default-weights.js';
import { fuseSignals } from './fusion.js';

const dim = (key: string) => ({
  taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
  dimensionKey: key,
  skillCode: key,
});

describe('fuseSignals', () => {
  it('returns passive-only readout when assessment Y is absent', () => {
    const result = fuseSignals({
      passiveX: {
        userId: '00000000-0000-4000-8000-000000000001',
        sourceId: 'GITHUB',
        taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
        encodedAt: '2026-09-11T00:00:00.000Z',
        entries: [
          {
            dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
            sourceId: 'GITHUB',
            score: 0.6,
            confidence: 0.8,
          },
        ],
      },
      assessmentY: null,
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts).toHaveLength(1);
    expect(result.readouts[0]?.passiveScore).toBe(0.6);
    expect(result.readouts[0]?.assessmentScore).toBeNull();
    expect(result.readouts[0]?.contradictionFlag).toBe(false);
    expect(result.contradictionDimensions).toHaveLength(0);
  });

  it('computes high agreement when passive and assessment align', () => {
    const result = fuseSignals({
      passiveX: {
        userId: '00000000-0000-4000-8000-000000000001',
        sourceId: 'GITHUB',
        taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
        encodedAt: '2026-09-11T00:00:00.000Z',
        entries: [
          {
            dimension: dim('LANGUAGE_PROFICIENCY'),
            sourceId: 'GITHUB',
            score: 0.75,
            confidence: 0.9,
          },
        ],
      },
      assessmentY: {
        userId: '00000000-0000-4000-8000-000000000001',
        claimId: '00000000-0000-4000-8000-000000000002',
        skillCode: 'LANGUAGE_PROFICIENCY',
        assessedAt: '2026-09-11T01:00:00.000Z',
        entries: [
          {
            dimension: dim('LANGUAGE_PROFICIENCY'),
            scorePercent: 78,
            passed: true,
            proficiencyLevel: 'INTERMEDIATE',
          },
        ],
      },
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts[0]?.corroborationScore).toBeGreaterThan(90);
    expect(result.readouts[0]?.contradictionFlag).toBe(false);
  });

  it('flags contradiction when assessment passed but passive is very low', () => {
    const result = fuseSignals({
      passiveX: {
        userId: '00000000-0000-4000-8000-000000000001',
        sourceId: 'GITHUB',
        taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
        encodedAt: '2026-09-11T00:00:00.000Z',
        entries: [
          {
            dimension: dim('ALGORITHMIC_COMPLEXITY_PERFORMANCE_OPTIMIZATION'),
            sourceId: 'GITHUB',
            score: 0.05,
            confidence: 0.7,
          },
        ],
      },
      assessmentY: {
        userId: '00000000-0000-4000-8000-000000000001',
        claimId: '00000000-0000-4000-8000-000000000003',
        skillCode: 'ALGORITHMIC_COMPLEXITY_PERFORMANCE_OPTIMIZATION',
        assessedAt: '2026-09-11T01:00:00.000Z',
        entries: [
          {
            dimension: dim('ALGORITHMIC_COMPLEXITY_PERFORMANCE_OPTIMIZATION'),
            scorePercent: 82,
            passed: true,
            proficiencyLevel: 'INTERMEDIATE',
          },
        ],
      },
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts[0]?.contradictionFlag).toBe(true);
    expect(result.contradictionDimensions).toContain(
      'ALGORITHMIC_COMPLEXITY_PERFORMANCE_OPTIMIZATION',
    );
  });

  it('fuses multiple passive signals (array input) instead of only using one source', () => {
    const result = fuseSignals({
      passiveX: [
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'GITHUB',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'GITHUB',
              score: 0.6,
              confidence: 0.8,
            },
          ],
        },
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'PROFESSIONALCREDENTIAL',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('SQL_QUERY_OPTIMIZATION'),
              sourceId: 'PROFESSIONALCREDENTIAL',
              score: 0.9,
              confidence: 0.6,
            },
          ],
        },
      ],
      assessmentY: null,
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    const dimensionKeys = result.readouts.map((r) => r.dimension.dimensionKey).sort();
    expect(dimensionKeys).toEqual([
      'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      'SQL_QUERY_OPTIMIZATION',
    ]);
  });

  it('fuses QLIX passive evidence with aligned skill assessment', () => {
    const result = fuseSignals({
      passiveX: {
        userId: '00000000-0000-4000-8000-000000000001',
        sourceId: 'QLIX',
        taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
        encodedAt: '2026-09-11T00:00:00.000Z',
        entries: [
          {
            dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
            sourceId: 'QLIX',
            score: 0.78,
            confidence: 0.85,
          },
        ],
      },
      assessmentY: {
        userId: '00000000-0000-4000-8000-000000000001',
        claimId: '00000000-0000-4000-8000-000000000005',
        skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
        assessedAt: '2026-09-11T01:00:00.000Z',
        entries: [
          {
            dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
            scorePercent: 80,
            passed: true,
            proficiencyLevel: 'ADVANCED',
          },
        ],
      },
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts[0]?.corroborationScore).toBeGreaterThan(85);
    expect(result.readouts[0]?.contradictionFlag).toBe(false);
  });

  it('does not flag when assessment failed even with low passive', () => {
    const result = fuseSignals({
      passiveX: {
        userId: '00000000-0000-4000-8000-000000000001',
        sourceId: 'GITHUB',
        taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
        encodedAt: '2026-09-11T00:00:00.000Z',
        entries: [
          {
            dimension: dim('SQL_QUERY_OPTIMIZATION'),
            sourceId: 'GITHUB',
            score: 0.05,
            confidence: 0.7,
          },
        ],
      },
      assessmentY: {
        userId: '00000000-0000-4000-8000-000000000001',
        claimId: '00000000-0000-4000-8000-000000000004',
        skillCode: 'SQL_QUERY_OPTIMIZATION',
        assessedAt: '2026-09-11T01:00:00.000Z',
        entries: [
          {
            dimension: dim('SQL_QUERY_OPTIMIZATION'),
            scorePercent: 40,
            passed: false,
            proficiencyLevel: 'BEGINNER',
          },
        ],
      },
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts[0]?.contradictionFlag).toBe(false);
  });

  it('detects internal contradiction when independent passive sources strongly disagree (e.g. GitHub vs QLIX/Work Experience)', () => {
    const result = fuseSignals({
      passiveX: [
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'GITHUB',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'GITHUB',
              score: 0.95, // Strong GitHub claim
              confidence: 0.8,
            },
          ],
        },
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'QLIX',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'QLIX',
              score: 0.2, // Drastically divergent QLIX signal (delta > 0.40)
              confidence: 0.8,
            },
          ],
        },
      ],
      assessmentY: null, // Even without assessment, internal disagreement is flagged!
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts).toHaveLength(1);
    expect(result.readouts[0]?.contradictionFlag).toBe(true);
    expect(result.contradictionDimensions).toContain('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
    // GITHUB weight is 1.0 (reliability = 0.8 * 1.0 = 0.8), QLIX weight is 0.85 (reliability = 0.8 * 0.85 = 0.68)
    // Anchors to higher reliability source (GITHUB = 0.95 * 1.0 = 0.95), but confidence is penalized (0.8 * 0.6 = 0.48)
    expect(result.readouts[0]?.passiveScore).toBe(0.95);
    expect(result.readouts[0]?.confidence).toBe(0.48);
  });

  it('anchors to highest-reliability source (not highest score) when conflicting source has lower score but higher reliability', () => {
    const result = fuseSignals({
      passiveX: [
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'LINKEDIN', // weight 0.6
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'LINKEDIN',
              score: 1.0, // High raw claim, but lower reliability (0.6 * 0.4 = 0.24)
              confidence: 0.4,
            },
          ],
        },
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'GITHUB', // weight 1.0
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'GITHUB',
              score: 0.15, // Lower score, but much higher reliability (1.0 * 0.9 = 0.9)
              confidence: 0.9,
            },
          ],
        },
      ],
      assessmentY: null,
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts).toHaveLength(1);
    expect(result.readouts[0]?.contradictionFlag).toBe(true);
    // Crucial check: anchors to GITHUB (0.15), NOT to LINKEDIN (0.6), because GITHUB reliability is higher!
    expect(result.readouts[0]?.passiveScore).toBe(0.15);
    // Confidence is dampened from 0.9 by 0.6x = 0.54 due to the disagreement
    expect(result.readouts[0]?.confidence).toBe(0.54);
  });

  it('multi-source consensus: when 2 sources agree and 1 is an outlier, the agreeing cluster outvotes the isolated outlier', () => {
    // GitHub: 0.85 (weight 1.0 -> 0.85)
    // Hackerrank: 0.90 (weight 0.8 -> 0.72, delta from GitHub = 0.13 <= 0.40 agreement)
    // QLIX: 0.20 (weight 0.85 -> 0.17, isolated outlier, delta > 0.40)
    const result = fuseSignals({
      passiveX: [
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'GITHUB',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'GITHUB',
              score: 0.85,
              confidence: 0.8,
            },
          ],
        },
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'HACKERRANK',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'HACKERRANK',
              score: 0.9,
              confidence: 0.75,
            },
          ],
        },
        {
          userId: '00000000-0000-4000-8000-000000000001',
          sourceId: 'QLIX',
          taxonomyVersion: ACTIVE_TAXONOMY_VERSION,
          encodedAt: '2026-09-11T00:00:00.000Z',
          entries: [
            {
              dimension: dim('PYTHON_APPLICATION_BACKEND_DEVELOPMENT'),
              sourceId: 'QLIX',
              score: 0.2, // Disagrees with both GitHub and Hackerrank
              confidence: 0.85,
            },
          ],
        },
      ],
      assessmentY: null,
      weights: DEFAULT_SIGNAL_WEIGHT_MODEL,
    });

    expect(result.readouts).toHaveLength(1);
    expect(result.readouts[0]?.contradictionFlag).toBe(true);
    // Consensus cluster (GitHub + Hackerrank avg = (0.85 + 0.72) / 2 = 0.785) outvotes the isolated outlier (0.17)
    expect(result.readouts[0]?.passiveScore).toBeCloseTo(0.785, 2);
    // Confidence is based on cluster max (0.8) penalized by policy multiplier (0.6x = 0.48)
    expect(result.readouts[0]?.confidence).toBe(0.48);
  });
});
