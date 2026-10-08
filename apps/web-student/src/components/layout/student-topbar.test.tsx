import type * as UiModule from '@hirekiwi/ui';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StudentTopbar } from './student-topbar';

const navState = vi.hoisted(() => ({ pathname: '/student/dashboard', unread: 0 }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navState.pathname,
}));

vi.mock('@/lib/auth', () => ({ signOut: vi.fn() }));

vi.mock('@/lib/candidate-identity', () => ({
  useCurrentUser: () => ({
    data: { fullName: 'Ada Lovelace', email: 'ada@example.com', profilePhotoUrl: null },
  }),
}));

vi.mock('./notifications-menu', () => ({ NotificationsMenu: () => null }));

vi.mock('@hirekiwi/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UiModule>()),
  useUnreadMessageCount: () => navState.unread,
}));

beforeEach(() => {
  navState.pathname = '/student/dashboard';
  navState.unread = 0;
});

afterEach(() => {
  cleanup();
});

function primaryNav() {
  return screen.getByRole('navigation', { name: 'Student navigation' });
}

describe('StudentTopbar', () => {
  it('shows the HireKiwi logo and wordmark linking home', () => {
    render(<StudentTopbar />);
    const home = screen.getByRole('link', { name: 'HireKiwi home' });
    expect(home.getAttribute('href')).toBe('/student/dashboard');
    expect(within(home).getByText('HireKiwi')).toBeDefined();
    expect(screen.getByRole('img', { name: 'HireKiwi logo' })).toBeDefined();
  });

  it.each([
    ['Home', '/student/dashboard'],
    ['Jobs', '/student/jobs'],
    ['My profile', '/student/profile'],
  ])('links %s to %s in the bar', (name, href) => {
    render(<StudentTopbar />);
    expect(within(primaryNav()).getByRole('link', { name }).getAttribute('href')).toBe(href);
  });

  it.each([
    ['Jobs menu', 'Saved', '/student/jobs?view=saved'],
    ['Jobs menu', 'Applied', '/student/applications'],
    ['Jobs menu', 'Opportunities', '/student/opportunities'],
  ])('opens %s item %s at %s', (menuName, name, href) => {
    render(<StudentTopbar />);
    const menu = screen.getByRole('menu', { name: menuName });
    expect(within(menu).getByRole('menuitem', { name }).getAttribute('href')).toBe(href);
    expect(within(primaryNav()).queryByRole('link', { name })).toBeNull();
  });

  it.each([
    ['/student/dashboard', 'Home'],
    ['/student/jobs', 'Jobs'],
    ['/student/profile', 'My profile'],
  ] as const)('marks %s as current for %s', (pathname, label) => {
    navState.pathname = pathname;
    render(<StudentTopbar />);
    const current = within(primaryNav())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent);
    expect(current).toEqual([label]);
  });

  it('keeps a parent lit on a page in its menu', () => {
    navState.pathname = '/student/opportunities';
    render(<StudentTopbar />);
    const menu = screen.getByRole('menu', { name: 'Jobs menu' });
    expect(
      within(menu).getByRole('menuitem', { name: 'Opportunities' }).getAttribute('aria-current'),
    ).toBe('page');
    expect(within(primaryNav()).getByRole('link', { name: 'Jobs' }).className).toContain(
      'font-semibold',
    );
  });

  it('shows Messages with its label on the right, not in the main bar', () => {
    render(<StudentTopbar />);
    expect(within(primaryNav()).queryByRole('link', { name: /Messages/ })).toBeNull();
    const link = screen.getByRole('link', { name: /Messages/ });
    expect(link.getAttribute('href')).toBe('/student/messages');
    expect(link.textContent).toContain('Messages');
  });

  it('opens a mobile menu with every link plus Settings and closes it on Escape', () => {
    render(<StudentTopbar />);
    expect(screen.queryByRole('navigation', { name: 'Student navigation (mobile)' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Student navigation (mobile)' });
    for (const name of ['Home', 'Jobs', 'Opportunities', 'My profile', 'Settings']) {
      expect(within(mobile).getByRole('link', { name })).toBeDefined();
    }

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('navigation', { name: 'Student navigation (mobile)' })).toBeNull();
  });

  it('opens the profile menu with account and legal options', () => {
    render(<StudentTopbar />);
    fireEvent.click(screen.getByRole('button', { name: /User menu for Ada Lovelace/i }));
    expect(screen.getByText('Public profile')).toBeDefined();
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms & Conditions')).toBeDefined();
  });
});
