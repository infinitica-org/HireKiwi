import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/profile/ProfilePhotoEditControl', () => ({
  ProfilePhotoEditControl: () => <div data-testid="photo" />,
}));

import { ProfileSidebar } from './ProfileSidebar';

afterEach(() => {
  cleanup();
});

describe('ProfileSidebar', () => {
  it('renders a separate link for every profile section', () => {
    render(<ProfileSidebar activeSection="experience" user={undefined} />);
    const links = screen.getAllByRole('link');
    expect(links[0]?.getAttribute('href')).toBe('/student/profile?section=profile');
    expect(screen.getByRole('link', { name: 'Education' }).getAttribute('href')).toBe(
      '/student/profile?section=education',
    );
    expect(screen.getByRole('link', { name: 'Resume' }).getAttribute('href')).toBe(
      '/student/profile?section=resume',
    );
  });

  it('marks the active section', () => {
    render(<ProfileSidebar activeSection="experience" user={undefined} />);
    expect(screen.getByRole('link', { name: 'Work Experience' }).getAttribute('aria-current')).toBe(
      'page',
    );
    expect(screen.getByRole('link', { name: 'Education' }).getAttribute('aria-current')).toBeNull();
  });
});
