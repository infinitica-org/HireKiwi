import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/public-profile/public-profile-preview', () => ({
  PublicProfilePreview: ({ embedded }: { embedded?: boolean }) => (
    <div data-testid="public-profile-preview">{embedded ? 'embedded' : 'page'}</div>
  ),
}));

import { RecruiterPreviewButton } from './RecruiterPreviewButton';

afterEach(() => cleanup());

describe('Th6-600 Preview as recruiter', () => {
  it('opens the public profile view in a modal and closes it', () => {
    render(<RecruiterPreviewButton />);
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Preview as recruiter/i }));
    const dialog = screen.getByRole('dialog', { name: 'Preview as recruiter' });
    expect(dialog).toBeTruthy();
    expect(screen.getByTestId('public-profile-preview').textContent).toBe('embedded');

    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('closes on Escape', () => {
    render(<RecruiterPreviewButton />);
    fireEvent.click(screen.getByRole('button', { name: /Preview as recruiter/i }));
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
