import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HireKiwiApiError } from '@hirekiwi/api-client';
import { ProfessionalLinksSection } from '@/components/profile/ProfessionalLinksSection';

vi.mock('@/lib/use-onboarding', () => ({
  useOnboarding: vi.fn(),
}));

vi.mock('@/components/onboarding/steps/SocialVerification', () => ({
  default: () => <div data-testid="social-verification">Social form</div>,
}));

vi.mock('@/components/profile/CodingPlatformIntegrations', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  CodingPlatformIntegrations: () => null,
}));
vi.mock('@hirekiwi/ui', () => ({
  useQuery: () => ({ data: undefined }),
  useQueryClient: () => ({ invalidateQueries: vi.fn().mockResolvedValue(undefined) }),
}));

const { saveOnboarding, fetchGithubProfile } = vi.hoisted(() => ({
  saveOnboarding: vi.fn(),
  fetchGithubProfile: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  api: { users: { saveOnboarding, fetchGithubProfile } },
}));

const { useOnboarding } = await import('@/lib/use-onboarding');

describe('ProfessionalLinksSection', () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    saveOnboarding.mockReset().mockResolvedValue({});
    fetchGithubProfile
      .mockReset()
      .mockImplementation(async ({ githubUrl }: { githubUrl: string }) => {
        const login = githubUrl.split('/').pop() ?? '';
        if (login === 'nobody') {
          throw new HireKiwiApiError({
            error: 'github_user_not_found',
            message: 'GitHub profile not found.',
            statusCode: 404,
          } as never);
        }
        return {
          login,
          name: 'The Octocat',
          avatarUrl: 'https://avatars.githubusercontent.com/u/583231',
          publicRepoCount: 8,
        };
      });
    vi.mocked(useOnboarding).mockReturnValue({
      data: { profile: null, draft: null, onboardingCompleted: true },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
  });

  it('shows the integrations, none connected yet', () => {
    render(<ProfessionalLinksSection />);

    expect(screen.getByRole('heading', { name: 'Integrations' })).toBeTruthy();
    const cards = screen.getByTestId('integration-cards');
    expect(cards.textContent).toContain('Not connected');
    expect(screen.getByRole('button', { name: 'Connect GitHub' })).toBeTruthy();
    expect(screen.getByText('GitHub')).toBeTruthy();
  });

  it('disconnecting GitHub sends an explicit empty link, so the server really removes it', async () => {
    vi.mocked(useOnboarding).mockReturnValue({
      data: {
        profile: null,
        draft: { githubUrl: 'https://github.com/octocat' },
        onboardingCompleted: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    render(<ProfessionalLinksSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit GitHub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(saveOnboarding).toHaveBeenCalledTimes(1));
    const body = saveOnboarding.mock.calls[0]?.[0] as Record<string, unknown>;
    // `githubUrl: ''` must survive JSON encoding; `undefined` would be dropped and the link kept.
    expect(JSON.parse(JSON.stringify(body))).toHaveProperty('githubUrl', '');
    expect(await screen.findByText('GitHub disconnected.')).toBeTruthy();
  });

  it('does not touch the LinkedIn link when GitHub is disconnected', async () => {
    vi.mocked(useOnboarding).mockReturnValue({
      data: {
        profile: null,
        draft: {
          githubUrl: 'https://github.com/octocat',
          linkedinUrl: 'https://www.linkedin.com/in/ada',
        },
        onboardingCompleted: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    render(<ProfessionalLinksSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Edit GitHub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => expect(saveOnboarding).toHaveBeenCalledTimes(1));
    const body = JSON.parse(JSON.stringify(saveOnboarding.mock.calls[0]?.[0]));
    expect(body.githubUrl).toBe('');
    expect(body.linkedinUrl).toBe('https://www.linkedin.com/in/ada');
  });

  it('shows the consent tick as soon as the GitHub dialog opens', () => {
    render(<ProfessionalLinksSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));

    const dialog = screen.getByText('Connect with GitHub').closest('div') as HTMLElement;
    expect(dialog.textContent).toContain('What HireKiwi will access');
    expect(dialog.textContent).toContain('Only your own public GitHub details');
    expect(dialog.textContent).toContain('never ask for your password');
    expect(screen.getByRole('checkbox', { name: /I agree/ })).toBeTruthy();
  });

  it('checks the username, shows the profile, and connects only after select + consent', async () => {
    render(<ProfessionalLinksSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    fireEvent.change(screen.getByPlaceholderText(/username or https:\/\/github.com/), {
      target: { value: 'octocat' },
    });

    const card = await screen.findByRole(
      'radio',
      { name: 'Select The Octocat' },
      { timeout: 4000 },
    );
    expect(card.textContent).toContain('@octocat');
    expect(card.textContent).toContain('8 public repos');

    const connect = screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement;
    expect(connect.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect(connect.disabled).toBe(true); // profile not selected yet
    fireEvent.click(card);
    expect(connect.disabled).toBe(false);

    fireEvent.click(connect);
    await waitFor(() => expect(saveOnboarding).toHaveBeenCalledTimes(1));
    const body = saveOnboarding.mock.calls[0]?.[0] as {
      githubUrl: string;
      socialVerification: { github: { verified: boolean; login: string } };
    };
    expect(body.githubUrl).toBe('https://github.com/octocat');
    expect(body.socialVerification.github).toMatchObject({ verified: true, login: 'octocat' });
    expect(await screen.findByText('GitHub connected.')).toBeTruthy();
  });

  it('says so when the GitHub username does not exist, and will not connect it', async () => {
    render(<ProfessionalLinksSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    fireEvent.change(screen.getByPlaceholderText(/username or https:\/\/github.com/), {
      target: { value: 'nobody' },
    });
    expect((await screen.findByRole('alert', {}, { timeout: 4000 })).textContent).toContain(
      'No public GitHub profile found for "nobody"',
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(saveOnboarding).not.toHaveBeenCalled();
  });

  it('needs a username before GitHub connects, even with consent given', () => {
    render(<ProfessionalLinksSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Connect GitHub' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /I agree/ }));
    expect((screen.getByRole('button', { name: 'Connect' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect(saveOnboarding).not.toHaveBeenCalled();
    expect(fetchGithubProfile).not.toHaveBeenCalled();
  });

  it('does not ask for consent again when editing or disconnecting a connected GitHub', () => {
    vi.mocked(useOnboarding).mockReturnValue({
      data: {
        profile: null,
        draft: { githubUrl: 'https://github.com/octocat' },
        onboardingCompleted: true,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as never);
    render(<ProfessionalLinksSection />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit GitHub' }));
    expect(screen.queryByRole('checkbox', { name: /I agree/ })).toBeNull();
    expect((screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });
});
