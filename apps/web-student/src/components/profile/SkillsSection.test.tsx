import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SKILL_DEFINITIONS } from '@hirekiwi/contracts';

import { SkillsSection } from './SkillsSection';

const listSkillClaimsMock = vi.fn();

vi.mock('@/lib/api', () => ({
  api: { assessment: { listSkillClaims: () => listSkillClaimsMock() } },
}));

describe('SkillsSection', () => {
  beforeEach(() => {
    listSkillClaimsMock.mockReset().mockResolvedValue([]);
  });
  afterEach(() => cleanup());

  it('shows an empty box with an Add button that goes to the Skills page', async () => {
    render(<SkillsSection />);
    expect(await screen.findByText('No skills yet')).toBeDefined();
    for (const link of screen.getAllByRole('link', { name: /Add skills/i })) {
      expect(link.getAttribute('href')).toBe('/skills');
    }
    expect(screen.getAllByRole('link', { name: /Add skills/i })).toHaveLength(2);
  });

  it('lists only the skills the student has added', async () => {
    const first = SKILL_DEFINITIONS[0];
    listSkillClaimsMock.mockResolvedValue([
      { claimId: 'clm-1', skillCode: first?.code ?? '', status: 'DECLARED' },
    ]);
    render(<SkillsSection />);

    expect(await screen.findByText(first?.name ?? '')).toBeDefined();
    expect(screen.queryByText('No skills yet')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: /Add skills/i })).toHaveLength(1);
  });

  it('shows an error when the skills list cannot be loaded', async () => {
    listSkillClaimsMock.mockRejectedValue(new Error('Failed to load skills.'));
    render(<SkillsSection />);
    expect(await screen.findByText('Failed to load skills.')).toBeDefined();
  });
});
