import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { EVIDENCE_USAGE } from '@hirekiwi/contracts';
import { EvidenceUsageCard } from '../account/EvidenceUsageCard';
import { EvidenceUsageNote } from './EvidenceUsageNote';

afterEach(() => cleanup());

describe('Evidence usage explanations (S6-VV-114)', () => {
  it('shows what work experience is used for, who sees it, retention and withdrawal', () => {
    render(<EvidenceUsageNote type="WORK_EXPERIENCE" />);
    expect(screen.getByText('How this is used')).toBeTruthy();
    const usage = EVIDENCE_USAGE.WORK_EXPERIENCE;
    for (const text of [usage.usedFor, usage.visibleTo, usage.retainedFor, usage.canWithdraw]) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('lists every evidence type in Settings', () => {
    render(<EvidenceUsageCard />);
    for (const usage of Object.values(EVIDENCE_USAGE)) {
      expect(screen.getByText(usage.label)).toBeTruthy();
    }
  });
});
