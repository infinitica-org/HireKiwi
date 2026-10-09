import type * as CandidateIdentityModule from '@/lib/candidate-identity';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import type { StudentDashboardSummary } from '@hirekiwi/contracts';
import { renderWithQueryClient } from '@/test/render-with-query-client';
import DashboardPage from './page';

const { getDashboard, listJobs, listSaved, saveJob, unsaveJob } = vi.hoisted(() => ({
  getDashboard: vi.fn(),
  listJobs: vi.fn(),
  listSaved: vi.fn(),
  saveJob: vi.fn(),
  unsaveJob: vi.fn(),
}));

vi.mock('@/lib/candidate-identity', async (importOriginal) => ({
  ...(await importOriginal<typeof CandidateIdentityModule>()),
  useCurrentUser: () => ({
    data: {
      userId: 'usr_1',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      profilePhotoUrl: null,
    },
    isLoading: false,
  }),
  firstNameOf: (name?: string) => name?.split(' ')[0] ?? '',
  useTracks: () => ({ data: [] }),
  headlineFor: () => 'HireKiwi candidate',
}));

vi.mock('@/lib/api', () => ({
  api: {
    users: { getDashboard },
    studentJobs: { list: listJobs, listSaved, save: saveJob, unsave: unsaveJob },
  },
}));

const OPENING = '11111111-1111-4111-8111-111111111111';

/** One job card as the real job feed returns it. */
function jobCard(over: Record<string, unknown> = {}) {
  return {
    id: OPENING,
    roleTitle: 'Data Analyst',
    companyName: 'Globex',
    companyId: null,
    companyVerified: true,
    companyVerifiedAt: null,
    location: 'Remote',
    employmentType: 'FULL_TIME',
    workMode: 'REMOTE',
    lastDateToApply: '2026-10-15',
    postedAt: '2026-09-20T00:00:00.000Z',
    fit: null,
    applied: false,
    saved: false,
    salary: null,
    minYearsExperience: null,
    maxYearsExperience: null,
    openings: null,
    skills: [],
    tags: [],
    ...over,
  };
}

const APPLICATION = '22222222-2222-4222-8222-222222222222';

function summary(overrides: Partial<StudentDashboardSummary> = {}): StudentDashboardSummary {
  return {
    generatedAt: '2026-09-25T00:00:00.000Z',
    completion: {
      percent: 50,
      completedAreas: ['skills', 'languages'],
      incompleteAreas: ['education'],
    },
    nextAction: {
      title: 'Complete your education profile',
      description: 'Add your degree.',
      ctaLabel: 'Continue to education',
      href: '/student/profile?section=education',
    },
    attentionItems: [],
    topMatches: [],
    opportunities: { total: 0, items: [] },
    activeApplications: { total: 0, items: [] },
    recentActivity: [],
    profileViews: { visible: false, employerViews: null, windowDays: 30 },
    ...overrides,
  };
}

function renderPage() {
  return renderWithQueryClient(<DashboardPage />);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    getDashboard.mockReset();
    getDashboard.mockResolvedValue(summary());
    listJobs.mockReset();
    listJobs.mockResolvedValue({
      jobs: [],
      nextCursor: null,
      counts: { strong: 0, good: 0, all: 0 },
    });
    listSaved.mockReset();
    listSaved.mockResolvedValue({ jobs: [] });
    saveJob.mockReset();
    saveJob.mockResolvedValue({ jobId: OPENING, active: true });
    unsaveJob.mockReset();
  });

  it('welcomes the student and shows the getting-started banner, feed and profile checklist', async () => {
    renderWithQueryClient(<DashboardPage />);

    expect(
      await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening), Ada$/ }),
    ).toBeTruthy();
    expect(await screen.findByTestId('welcome-banner')).toBeTruthy();
    expect(await screen.findByTestId('complete-profile-card')).toBeTruthy();
    expect(screen.getByTestId('opportunity-feed')).toBeTruthy();
  });

  it('always shows the getting-started banner with no close button', async () => {
    renderPage();

    expect(await screen.findByTestId('welcome-banner')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /dismiss/i })).toBeNull();
  });

  it('lists unfinished profile areas first with their real weight and link', async () => {
    renderPage();

    const card = await screen.findByTestId('complete-profile-card');
    expect(card.textContent).toContain('50');
    // 3 areas in the fixture -> each is worth 33%.
    expect(card.textContent).toContain('(+33%)');
    const education = screen.getByRole('link', { name: 'Education' });
    expect(education.getAttribute('href')).toBe('/student/profile?section=education');
    expect(screen.getByRole('link', { name: 'Add your skills (done)' })).toBeTruthy();
  });

  it('shows explicit empty states and never fabricates data when nothing exists', async () => {
    renderPage();
    await screen.findByTestId('complete-profile-card');

    expect(await screen.findByText('No jobs yet')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Most Recent' }));
    expect(screen.getByText('No new jobs')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Applied' }));
    expect(screen.getByText('No active applications')).toBeTruthy();
    expect(screen.getByText(/No activity recorded yet/i)).toBeTruthy();
    // No invented default score or role.
    expect(screen.queryByText(/85%/)).toBeNull();
    expect(screen.queryByText('Software Engineer')).toBeNull();
  });

  it('does not show a needs-your-attention panel', async () => {
    getDashboard.mockResolvedValue(
      summary({
        attentionItems: [
          {
            id: 'certificate-1',
            kind: 'CERTIFICATE',
            state: 'FAILED',
            title: 'Cloud Basics (Coursera)',
            detail: 'Verification did not pass.',
            href: '/student/profile?section=certifications',
          },
        ],
      }),
    );
    renderPage();
    await screen.findByTestId('complete-profile-card');

    expect(screen.queryByTestId('attention-panel')).toBeNull();
    expect(screen.queryByText('Needs your attention')).toBeNull();
  });

  it('shows real jobs, applications and activity', async () => {
    listJobs.mockResolvedValue({
      jobs: [
        jobCard(),
        jobCard({
          id: '33333333-3333-4333-8333-333333333333',
          roleTitle: 'Backend Engineer',
          companyName: 'Acme',
          location: 'Pune',
          postedAt: '2026-09-22T00:00:00.000Z',
          lastDateToApply: null,
          fit: { band: 'STRONG', matchPercent: 88, topReason: null },
        }),
      ],
      nextCursor: null,
      counts: { strong: 1, good: 0, all: 2 },
    });
    getDashboard.mockResolvedValue(
      summary({
        topMatches: [
          {
            source: 'APPLICATION',
            applicationId: APPLICATION,
            openingId: OPENING,
            roleTitle: 'Backend Engineer',
            companyName: 'Acme',
            location: 'Pune',
            matchPercent: 88,
            stage: 'SHORTLISTED',
          },
        ],
        opportunities: {
          total: 7,
          items: [
            {
              openingId: OPENING,
              roleTitle: 'Data Analyst',
              companyName: 'Globex',
              location: 'Remote',
              employmentType: 'FULL_TIME',
              lastDateToApply: '2026-10-15',
              postedAt: '2026-09-20T00:00:00.000Z',
            },
          ],
        },
        activeApplications: {
          total: 2,
          items: [
            {
              applicationId: APPLICATION,
              openingId: OPENING,
              roleTitle: 'Backend Engineer',
              companyName: 'Acme',
              stage: 'INTERVIEW',
              updatedAt: '2026-09-24T00:00:00.000Z',
            },
          ],
        },
        recentActivity: [
          {
            id: 'audit-1',
            kind: 'VERIFICATION',
            byYou: false,
            label: 'Candidate education updated',
            occurredAt: '2026-09-24T00:00:00.000Z',
          },
        ],
      }),
    );
    renderPage();

    // My Feed: the best-fitting job first.
    expect(await screen.findByText('Backend Engineer')).toBeTruthy();
    expect(screen.getByText(/88% skills match/)).toBeTruthy();
    expect(screen.getByText('Candidate education updated')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Most Recent' }));
    expect(screen.getByText('Data Analyst')).toBeTruthy();
    expect(screen.getByText('Apply by 2026-10-15')).toBeTruthy();

    fireEvent.click(screen.getByRole('tab', { name: 'Applied' }));
    expect(screen.getByText('Interview')).toBeTruthy();
  });

  it('saves a role from the feed bookmark', async () => {
    listJobs.mockResolvedValue({
      jobs: [
        jobCard({
          roleTitle: 'Platform Engineer',
          companyName: 'Initech',
          location: null,
          fit: { band: 'STRONG', matchPercent: 91, topReason: null },
        }),
      ],
      nextCursor: null,
      counts: { strong: 1, good: 0, all: 1 },
    });
    renderPage();

    const save = await screen.findByRole('button', { name: 'Save Platform Engineer' });
    fireEvent.click(save);
    await waitFor(() => expect(saveJob).toHaveBeenCalledWith(OPENING));
    expect(
      screen.getByRole('button', { name: 'Remove Platform Engineer from saved' }),
    ).toBeTruthy();
  });

  it('says it is loading instead of claiming there is nothing to show', async () => {
    getDashboard.mockReturnValue(new Promise(() => undefined));
    renderPage();

    expect((await screen.findAllByText('Loading…')).length).toBeGreaterThan(0);
    expect(screen.queryByText('No jobs yet')).toBeNull();
  });

  it('says so when the profile is complete', async () => {
    getDashboard.mockResolvedValue(
      summary({
        completion: {
          percent: 100,
          completedAreas: ['skills', 'languages', 'education'],
          incompleteAreas: [],
        },
        nextAction: null,
      }),
    );
    renderPage();

    expect(await screen.findByText('Your profile is complete')).toBeTruthy();
  });

  it('shows a recoverable error and reloads on retry', async () => {
    getDashboard.mockRejectedValueOnce(new Error('network')).mockResolvedValue(summary());
    renderPage();

    expect((await screen.findByRole('alert')).textContent).toMatch(
      /could not load your dashboard/i,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(getDashboard).toHaveBeenCalledTimes(2));
    expect(await screen.findByTestId('complete-profile-card')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows an unapplied job as a scored match', async () => {
    listJobs.mockResolvedValue({
      jobs: [
        jobCard({
          roleTitle: 'Platform Engineer',
          companyName: 'Initech',
          location: null,
          fit: { band: 'STRONG', matchPercent: 91, topReason: null },
        }),
      ],
      nextCursor: null,
      counts: { strong: 1, good: 0, all: 1 },
    });
    renderPage();

    expect(await screen.findByText('Platform Engineer')).toBeTruthy();
    expect(screen.getByText('Initech')).toBeTruthy();
    expect(screen.getByText(/91% skills match/)).toBeTruthy();
    expect(screen.getByText('Best Match')).toBeTruthy();
    expect(screen.getByText('Matches your profile')).toBeTruthy();
  });
});
