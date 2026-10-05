'use client';

import React from 'react';
import type { EvidenceQualityMetrics } from '@hirekiwi/contracts';

export interface EvidenceValidationIndicatorProps {
  metrics: EvidenceQualityMetrics[];
  compact?: boolean;
}

function averageKnown(values: Array<number | null>): number | null {
  const known = values.filter((v): v is number => v !== null);
  return known.length === 0 ? null : known.reduce((sum, v) => sum + v, 0) / known.length;
}

/**
 * Displays evidence quality metrics showing psychometric validity.
 * Helps TPOs understand the confidence level in candidate's demonstrated skills.
 */
export function EvidenceValidationIndicator({
  metrics,
  compact = false,
}: EvidenceValidationIndicatorProps) {
  if (!metrics || metrics.length === 0) {
    return null;
  }

  // Calculate aggregate metrics
  const avgConstructCoverage =
    metrics.reduce((sum, m) => sum + m.constructCoverage, 0) / metrics.length;
  const avgInterRaterReliability = averageKnown(metrics.map((m) => m.interRaterReliability));
  const avgSourceAuthorityWeight =
    metrics.reduce((sum, m) => sum + m.sourceAuthorityWeight, 0) / metrics.length;
  const avgCompositeValidity =
    metrics.reduce((sum, m) => sum + m.compositeValidityScore, 0) / metrics.length;

  // null = not measured upstream; never shown as a value.
  const knownRecencyDays = metrics.flatMap((m) => (m.recencyDays === null ? [] : [m.recencyDays]));
  const maxRecencyDays = knownRecencyDays.length > 0 ? Math.max(...knownRecencyDays) : null;

  // The composite is renormalised over measured components only; say which ones those are.
  const contributing = ['construct coverage', 'source authority (policy weight)'];
  const notMeasured: string[] = [];
  (avgInterRaterReliability === null ? notMeasured : contributing).push('rater agreement');
  (maxRecencyDays === null ? notMeasured : contributing).push('recency');
  const isPartial = notMeasured.length > 0;
  const partialSuffix = isPartial ? ' (partial)' : '';
  const compositeBasis = isPartial
    ? `Based on: ${contributing.join(', ')}. Not measured: ${notMeasured.join(', ')}.`
    : null;

  // Color coding for composite validity
  const getValidityColor = (score: number) => {
    if (score >= 0.8) return 'bg-emerald-50 text-emerald-900 border-emerald-200';
    if (score >= 0.6) return 'bg-amber-50 text-amber-900 border-amber-200';
    return 'bg-rose-50 text-rose-900 border-rose-200';
  };

  const getValidityLabel = (score: number) => {
    if (score >= 0.8) return 'High Quality';
    if (score >= 0.6) return 'Medium Quality';
    return 'Low Quality';
  };

  const ProgressBar = ({ value, label }: { value: number | null; label: string }) => {
    if (value === null) {
      return (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[var(--ds-text-muted)]">{label}</span>
          <span className="text-[var(--ds-text-muted)]">Not available</span>
        </div>
      );
    }
    const pct = Math.round(value * 100);
    return (
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-[var(--ds-text-muted)]">{label}</span>
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
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getValidityColor(avgCompositeValidity)}`}
        title={`Composite Validity: ${(avgCompositeValidity * 100).toFixed(0)}%${compositeBasis ? `. ${compositeBasis}` : ''}`}
      >
        ✓ Evidence Quality: {getValidityLabel(avgCompositeValidity)}
        {partialSuffix}
      </div>
    );
  }

  return (
    <div className={`space-y-3 rounded-lg border p-3 ${getValidityColor(avgCompositeValidity)}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wide text-[var(--ds-text)]">
          EVIDENCE QUALITY
        </h4>
        <span className="text-xs font-bold">{(avgCompositeValidity * 100).toFixed(0)}%</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ProgressBar label="Construct Coverage" value={avgConstructCoverage} />
        <ProgressBar label="Rater Agreement" value={avgInterRaterReliability} />
        <ProgressBar label="Source Authority (policy weight)" value={avgSourceAuthorityWeight} />
        <div className="space-y-1">
          <p className="text-xs text-[var(--ds-text-muted)]">
            Recency: {maxRecencyDays === null ? 'not measured' : `${maxRecencyDays} days`}
          </p>
        </div>
      </div>

      <p className="text-[10px] text-[var(--ds-text-muted)]">
        Based on {metrics.length} evidence source{metrics.length > 1 ? 's' : ''}
      </p>
      {compositeBasis ? (
        <p className="text-[10px] text-[var(--ds-text-muted)]">
          Score is partial. {compositeBasis}
        </p>
      ) : null}
    </div>
  );
}
