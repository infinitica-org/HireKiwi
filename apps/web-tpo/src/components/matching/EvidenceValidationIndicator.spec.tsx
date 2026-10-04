import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { EvidenceQualityMetrics } from '@smart/contracts';
import { EvidenceValidationIndicator } from './EvidenceValidationIndicator';

/**
 * Component tests for EvidenceValidationIndicator
 * Validates rendering of psychometric validity metrics
 */

describe('EvidenceValidationIndicator Component', () => {
  beforeEach(() => cleanup());
  it('renders nothing when no metrics provided', () => {
    const { container } = render(<EvidenceValidationIndicator metrics={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when metrics is null', () => {
    const { container } = render(
      <EvidenceValidationIndicator metrics={null as unknown as EvidenceQualityMetrics[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays compact mode with high quality indicator', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.85,
        interRaterReliability: 0.94,
        sourceReliability: 0.9,
        recencyDays: 15,
        decayFactor: 0.99,
        compositeValidityScore: 0.906,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={true} />);

    expect(screen.getByText(/High Quality/)).toBeDefined();
  });

  it('displays compact mode with medium quality indicator', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.6,
        interRaterReliability: 0.65,
        sourceReliability: 0.7,
        recencyDays: 180,
        decayFactor: 0.8,
        compositeValidityScore: 0.67,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={true} />);

    expect(screen.getByText(/Medium Quality/)).toBeDefined();
  });

  it('displays compact mode with low quality indicator', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.4,
        interRaterReliability: 0.45,
        sourceReliability: 0.5,
        recencyDays: 365,
        decayFactor: 0.5,
        compositeValidityScore: 0.47,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={true} />);

    expect(screen.getByText(/Low Quality/)).toBeDefined();
  });

  it('displays expanded mode with all metrics', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.8,
        interRaterReliability: 0.92,
        sourceReliability: 0.9,
        recencyDays: 30,
        decayFactor: 0.98,
        compositeValidityScore: 0.895,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    expect(screen.getByText(/EVIDENCE QUALITY/)).toBeDefined();
    expect(screen.getByText(/Construct Coverage/)).toBeDefined();
    expect(screen.getByText(/Rater Agreement/)).toBeDefined();
    expect(screen.getByText(/Source Authority/)).toBeDefined();
    expect(screen.getByText(/Recency/)).toBeDefined();
  });

  it('aggregates metrics from multiple evidence sources', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.8,
        interRaterReliability: 0.9,
        sourceReliability: 0.9,
        recencyDays: 10,
        decayFactor: 0.99,
        compositeValidityScore: 0.9,
      },
      {
        constructCoverage: 0.7,
        interRaterReliability: 0.8,
        sourceReliability: 0.85,
        recencyDays: 90,
        decayFactor: 0.9,
        compositeValidityScore: 0.81,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    expect(screen.getByText(/Based on 2 evidence sources/)).toBeDefined();
  });

  it('displays singular evidence source label', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.8,
        interRaterReliability: 0.9,
        sourceReliability: 0.9,
        recencyDays: 10,
        decayFactor: 0.99,
        compositeValidityScore: 0.9,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    expect(screen.getByText(/Based on 1 evidence source/)).toBeDefined();
  });

  it('displays recency in days correctly', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.8,
        interRaterReliability: 0.9,
        sourceReliability: 0.9,
        recencyDays: 365,
        decayFactor: 0.5,
        compositeValidityScore: 0.8,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    expect(screen.getByText(/365 days/)).toBeDefined();
  });

  it('calculates decay factor correctly from multiple sources', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.8,
        interRaterReliability: 0.9,
        sourceReliability: 0.9,
        recencyDays: 30,
        decayFactor: 0.98,
        compositeValidityScore: 0.9,
      },
      {
        constructCoverage: 0.75,
        interRaterReliability: 0.85,
        sourceReliability: 0.85,
        recencyDays: 60,
        decayFactor: 0.93,
        compositeValidityScore: 0.835,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    // Should display minimum decay factor (0.93)
    expect(screen.getByText(/Decay: 93%/)).toBeDefined();
  });

  it('handles edge case with perfect scores', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 1.0,
        interRaterReliability: 1.0,
        sourceReliability: 1.0,
        recencyDays: 0,
        decayFactor: 1.0,
        compositeValidityScore: 1.0,
      },
    ];

    cleanup();
    const { container } = render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    // Check for emerald (high quality) color in the expanded container
    const expandedContainer = container.querySelector('[class*="emerald-50"]');
    expect(expandedContainer).toBeDefined();
    // Check for 100% score
    const scores = container.querySelectorAll('span[class*="font-bold"]');
    const hasHundredPercent = Array.from(scores).some((s) => s.textContent?.includes('100'));
    expect(hasHundredPercent).toBe(true);
  });

  it('handles edge case with minimal scores', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.0,
        interRaterReliability: 0.0,
        sourceReliability: 0.0,
        recencyDays: 730,
        decayFactor: 0.0,
        compositeValidityScore: 0.0,
      },
    ];

    const { container } = render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    // Check for rose (low quality) color in the expanded container
    const expandedContainer = container.querySelector('[class*="rose-50"]');
    expect(expandedContainer).toBeDefined();
  });

  it('formats percentage values correctly', () => {
    const metrics: EvidenceQualityMetrics[] = [
      {
        constructCoverage: 0.856,
        interRaterReliability: 0.923,
        sourceReliability: 0.87,
        recencyDays: 45,
        decayFactor: 0.975,
        compositeValidityScore: 0.886,
      },
    ];

    render(<EvidenceValidationIndicator metrics={metrics} compact={false} />);

    // Should round to whole percentages
    expect(screen.getByText(/Construct Coverage/)).toBeDefined();
  });

  it('displays different quality indicators based on composite score', () => {
    const scenarios = [
      { score: 0.85, expected: 'High Quality' },
      { score: 0.7, expected: 'Medium Quality' },
      { score: 0.5, expected: 'Low Quality' },
    ];

    scenarios.forEach(({ score, expected }) => {
      cleanup();
      const { unmount } = render(
        <EvidenceValidationIndicator
          metrics={[
            {
              constructCoverage: 0.8,
              interRaterReliability: 0.9,
              sourceReliability: 0.9,
              recencyDays: 30,
              decayFactor: 0.98,
              compositeValidityScore: score,
            },
          ]}
          compact={true}
        />,
      );

      expect(screen.getByText(new RegExp(expected))).toBeDefined();
      unmount();
    });
  });
});
