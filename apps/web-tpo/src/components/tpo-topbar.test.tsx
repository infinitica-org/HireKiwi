import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TpoTopbar } from './tpo-topbar';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
}));

vi.mock('../lib/api', () => ({
  api: {
    auth: { me: vi.fn().mockResolvedValue({ fullName: 'Pilot TPO', role: 'INSTITUTION_ADMIN' }) },
    onboarding: { listTpoStudents: vi.fn().mockResolvedValue([]) },
  },
  openingsApi: { list: vi.fn().mockResolvedValue({ openings: [] }) },
}));

afterEach(() => {
  cleanup();
});

describe('TpoTopbar', () => {
  it('has breadcrumb navigation and profile menu', () => {
    render(<TpoTopbar onToggleSidebar={vi.fn()} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeDefined();
    expect(screen.getByText('Dashboard')).toBeDefined();
  });

  it('opens sidebar via toggle button', () => {
    const onToggle = vi.fn();
    render(<TpoTopbar onToggleSidebar={onToggle} />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle navigation sidebar' }));
    expect(onToggle).toHaveBeenCalled();
  });

  it('opens profile menu with account options', async () => {
    render(<TpoTopbar onToggleSidebar={vi.fn()} />);
    const menuBtn = screen.getByRole('button', { name: /User menu for/i });
    expect(menuBtn).toBeDefined();
    fireEvent.click(menuBtn);
    expect(screen.getByText('Profile')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
  });
});
