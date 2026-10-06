import { fireEvent, render, screen } from '@testing-library/react';

import { describe, expect, it, vi } from 'vitest';

import { SkillVerifyReport } from './skill-verify-report';

describe('SkillVerifyReport', () => {
  it('shows the under-verification placeholder and navigation', () => {
    const onDone = vi.fn();

    render(<SkillVerifyReport catalogSkillCode="SQL_QUERY_OPTIMIZATION" onDone={onDone} />);

    expect(screen.getByText(/Assessment complete/)).toBeDefined();
    expect(screen.getByText(/This skill is under verification/)).toBeDefined();

    expect(screen.getByRole('button', { name: /back to skills/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /view assessments/i }).getAttribute('href')).toBe(
      '/student/assessments',
    );

    fireEvent.click(screen.getByRole('button', { name: /back to skills/i }));

    expect(onDone).toHaveBeenCalled();
  });
});
