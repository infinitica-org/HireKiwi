import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HireKiwiApiError } from '@hirekiwi/api-client';
import { api, storeSession } from '../../lib/api';
import { LoginForm } from './login-form';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock('../../lib/api', () => ({
  api: {
    auth: { identify: vi.fn(), login: vi.fn(), resendEmailVerification: vi.fn() },
  },
  storeSession: vi.fn(),
  redirectForRole: vi.fn(),
}));

function submitClosestForm(input: HTMLElement) {
  const form = input.closest('form');
  if (!form) throw new Error('form missing');
  fireEvent.submit(form);
}

async function identifyAndReachPasswordStage(email: string) {
  render(<LoginForm />);
  const emailInput = screen.getByLabelText('Email');
  fireEvent.change(emailInput, { target: { value: email } });
  submitClosestForm(emailInput);
  await screen.findByLabelText('Password');
}

describe('LoginForm identify-first flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  it('shows the password field when the email already has an account', async () => {
    vi.mocked(api.auth.identify).mockResolvedValue({ exists: true });

    await identifyAndReachPasswordStage('jane@psgtech.ac.in');

    expect(api.auth.identify).toHaveBeenCalledWith({ email: 'jane@psgtech.ac.in' });
    expect(screen.getByLabelText('Password')).toBeTruthy();
  });

  it('offers student/company signup choices when the email has no account', async () => {
    vi.mocked(api.auth.identify).mockResolvedValue({ exists: false });

    render(<LoginForm />);
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'new.person@example.com' } });
    submitClosestForm(emailInput);

    expect(await screen.findByText(/I'm a student/i)).toBeTruthy();
    expect(screen.getByText(/I'm hiring/i)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Create student account/i }).getAttribute('href')).toBe(
      '/register?email=new.person%40example.com',
    );
    expect(screen.getByRole('link', { name: /Create company account/i }).getAttribute('href')).toBe(
      '/company/register?email=new.person%40example.com',
    );
  });

  it('explains why sign-in failed and offers a new verification link', async () => {
    vi.mocked(api.auth.identify).mockResolvedValue({ exists: true });
    vi.mocked(api.auth.login).mockRejectedValue(
      new HireKiwiApiError({
        error: 'email_not_verified',
        message: 'Verify your email before signing in.',
        statusCode: 403,
      }),
    );
    vi.mocked(api.auth.resendEmailVerification).mockResolvedValue(undefined);

    await identifyAndReachPasswordStage('jane@psgtech.ac.in');

    const password = screen.getByLabelText('Password');
    fireEvent.change(password, { target: { value: 'Password123!' } });
    submitClosestForm(password);

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Verify your email before signing in.',
    );
    expect(storeSession).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Send a new verification link/i }));
    await waitFor(() =>
      expect(api.auth.resendEmailVerification).toHaveBeenCalledWith({
        email: 'jane@psgtech.ac.in',
      }),
    );
  });
});

describe('LoginForm accessibility (S6-VV-161)', () => {
  afterEach(() => {
    cleanup();
  });

  it('gives the email input an accessible name', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email').getAttribute('type')).toBe('email');
  });

  it('gives the password input an accessible name once reached', async () => {
    vi.mocked(api.auth.identify).mockResolvedValue({ exists: true });
    await identifyAndReachPasswordStage('jane@psgtech.ac.in');
    expect(screen.getByLabelText('Password').getAttribute('type')).toBe('password');
  });
});
