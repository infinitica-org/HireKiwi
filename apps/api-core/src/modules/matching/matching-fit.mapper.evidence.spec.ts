import { describe, expect, it } from 'vitest';
import { EvidenceQualityMetricsSchema } from '@hirekiwi/contracts';
import { aggregateEvidenceMetrics } from './matching-fit.mapper.js';

describe('aggregateEvidenceMetrics', () => {
  it('returns no metrics when there is no evidence', () => {
    expect(aggregateEvidenceMetrics([])).toEqual([]);
    expect(aggregateEvidenceMetrics([{ evidenceSource: 'NONE', hitScore: 0 }])).toEqual([]);
  });

  it('never synthesises rater agreement, recency or decay', () => {
    const [metrics] = aggregateEvidenceMetrics([
      { evidenceSource: 'ASSESSMENT', hitScore: 0.9 },
      { evidenceSource: 'PROJECT', hitScore: 0.9 },
    ]);
    expect(metrics.interRaterReliability).toBeNull();
    expect(metrics.recencyDays).toBeNull();
    expect(metrics.decayFactor).toBeNull();
    expect(EvidenceQualityMetricsSchema.safeParse(metrics).success).toBe(true);
  });

  it('computes coverage as the evidence-backed share of rows, independent of hitScore', () => {
    const [metrics] = aggregateEvidenceMetrics([
      { evidenceSource: 'ASSESSMENT', hitScore: 0.1 },
      { evidenceSource: 'NONE', hitScore: 0 },
    ]);
    expect(metrics.constructCoverage).toBe(0.5);
    expect(metrics.sourceAuthorityWeight).toBe(0.95);
  });

  it('renormalises the composite over coverage and source weight only', () => {
    const [metrics] = aggregateEvidenceMetrics([{ evidenceSource: 'ASSESSMENT', hitScore: 0.5 }]);
    // (0.35*1 + 0.2*0.95) / 0.55
    expect(metrics.compositeValidityScore).toBeCloseTo(0.98, 2);
  });
});
