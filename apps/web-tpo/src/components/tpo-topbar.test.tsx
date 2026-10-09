import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TpoTopbar } from './tpo-topbar';

const navState = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navState.pathname,
}));

vi.mock('../lib/api', () => ({
  api: {
    auth: { me: vi.fn().mockResolvedValue({ fullName: 'Pilot TPO', role: 'INSTITUTION_ADMIN' }) },
    onboarding: { listTpoStudents: vi.fn().mockResolvedValue([]) },
  },
  openingsApi: { list: vi.fn().mockResolvedValue({ openings: [] }) },
}));

beforeEach(() => {
  navState.pathname = '/';
});

afterEach(() => {
  cleanup();
});

function primaryNav() {
  return screen.getByRole('navigation', { name: 'University console' });
}

describe('TpoTopbar brand', () => {
  it('shows the HireKiwi logo linking home', () => {
    render(<TpoTopbar />);
    expect(screen.getByRole('link', { name: 'HireKiwi home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('img', { name: 'HireKiwi logo' })).toBeDefined();
  });
});

describe('TpoTopbar navigation', () => {
  it.each([
    ['Home', '/'],
    ['Students', '/students'],
  ])('links %s to %s in the bar', (name, href) => {
    render(<TpoTopbar />);
    expect(within(primaryNav()).getByRole('link', { name }).getAttribute('href')).toBe(href);
  });

  it.each([
    ['Invitations', '/whitelist'],
    ['Reports', '/reports'],
  ])('opens %s from the Students menu at %s', (name, href) => {
    render(<TpoTopbar />);
    const menu = screen.getByRole('menu', { name: 'Students menu' });
    expect(within(menu).getByRole('menuitem', { name }).getAttribute('href')).toBe(href);
  });

  it('links Settings from the topbar', () => {
    render(<TpoTopbar />);
    expect(screen.getByRole('link', { name: 'Settings' }).getAttribute('href')).toBe('/settings');
  });

  it.each([
    ['/', 'Home'],
    ['/students', 'Students'],
    ['/batches', 'Students'],
    ['/onboarding', 'Invitations'],
    ['/reports', 'Reports'],
  ] as const)('marks %s as current for %s', (pathname, label) => {
    navState.pathname = pathname;
    render(<TpoTopbar />);
    const current = [
      ...within(primaryNav()).getAllByRole('link'),
      ...within(primaryNav()).queryAllByRole('menuitem'),
    ]
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent);
    expect(current).toEqual([label]);
  });
});

describe('TpoTopbar mobile menu', () => {
  it('opens a menu with every link and closes it when a link is chosen', () => {
    render(<TpoTopbar />);
    expect(screen.queryByRole('navigation', { name: 'University console (mobile)' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const mobile = screen.getByRole('navigation', { name: 'University console (mobile)' });
    for (const name of ['Home', 'Students', 'Invitations', 'Reports', 'Settings']) {
      expect(within(mobile).getByRole('link', { name })).toBeDefined();
    }

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'University console (mobile)' })).toBeNull();
  });
});

describe('TpoTopbar profile menu', () => {
  it('opens profile menu with account and legal options', () => {
    render(<TpoTopbar />);
    fireEvent.click(screen.getByRole('button', { name: /User menu for/i }));
    expect(screen.getByText('Profile')).toBeDefined();
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms & Conditions')).toBeDefined();
  });
});
