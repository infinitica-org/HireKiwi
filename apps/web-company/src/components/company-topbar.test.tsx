import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CompanyTopbar } from './company-topbar';
import type * as UiModule from '@hirekiwi/ui';

const navState = vi.hoisted(() => ({ pathname: '/', unread: 0 }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => navState.pathname,
}));

vi.mock('@/lib/auth', () => ({ signOut: vi.fn() }));

vi.mock('@/lib/use-company-account', () => ({
  useCompanyAccount: () => ({
    data: { companyName: 'Acme Corp', fullName: 'Riya Rao', email: 'riya@acme.test' },
  }),
}));

vi.mock('@hirekiwi/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof UiModule>()),
  NotificationsMenu: () => null,
  useUnreadMessageCount: () => navState.unread,
}));

beforeEach(() => {
  navState.pathname = '/';
  navState.unread = 0;
});

afterEach(() => {
  cleanup();
});

function primaryNav() {
  return screen.getByRole('navigation', { name: 'Company portal navigation' });
}

describe('CompanyTopbar', () => {
  it('shows the HireKiwi logo linking home', () => {
    render(<CompanyTopbar />);
    expect(screen.getByRole('link', { name: 'HireKiwi home' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('img', { name: 'HireKiwi logo' })).toBeDefined();
  });

  it.each([
    ['Home', '/'],
    ['Jobs', '/jobs'],
    ['Applicants', '/applicants'],
  ])('links %s to %s', (name, href) => {
    render(<CompanyTopbar />);
    expect(within(primaryNav()).getByRole('link', { name }).getAttribute('href')).toBe(href);
  });

  it('opens Search students from the Applicants menu', () => {
    render(<CompanyTopbar />);
    const menu = screen.getByRole('menu', { name: 'Applicants menu' });
    expect(
      within(menu).getByRole('menuitem', { name: 'Search students' }).getAttribute('href'),
    ).toBe('/students');
    expect(within(primaryNav()).queryByRole('link', { name: 'Search students' })).toBeNull();
  });

  it.each([
    ['/', 'Home'],
    ['/jobs', 'Jobs'],
    ['/jobs/new', 'Jobs'],
    ['/applicants', 'Applicants'],
  ] as const)('marks %s as current for %s', (pathname, label) => {
    navState.pathname = pathname;
    render(<CompanyTopbar />);
    const current = within(primaryNav())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('aria-current') === 'page')
      .map((link) => link.textContent);
    expect(current).toEqual([label]);
  });

  it('opens a mobile menu with every link plus Settings and closes it on Escape', () => {
    render(<CompanyTopbar />);
    expect(
      screen.queryByRole('navigation', { name: 'Company portal navigation (mobile)' }),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const mobile = screen.getByRole('navigation', { name: 'Company portal navigation (mobile)' });
    for (const name of ['Home', 'Jobs', 'Applicants', 'Search students', 'Settings']) {
      expect(within(mobile).getByRole('link', { name })).toBeDefined();
    }

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('navigation', { name: 'Company portal navigation (mobile)' }),
    ).toBeNull();
  });

  it('opens the profile menu with account and legal options', () => {
    render(<CompanyTopbar />);
    fireEvent.click(screen.getByRole('button', { name: /User menu for Riya Rao/i }));
    expect(screen.getByText('My account')).toBeDefined();
    expect(screen.getByText('Billing & plan')).toBeDefined();
    expect(screen.getByText('Privacy Policy')).toBeDefined();
    expect(screen.getByText('Terms & Conditions')).toBeDefined();
  });
});
