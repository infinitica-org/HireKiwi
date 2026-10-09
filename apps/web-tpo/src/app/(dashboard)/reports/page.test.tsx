import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReportsPage from './page';

const apiMock = vi.hoisted(() => ({
  listTpoStudents: vi.fn(),
  listSkillClaims: vi.fn(),
  openingsList: vi.fn(),
  employersList: vi.fn(),
  countApplications: vi.fn(),
}));

vi.mock('../../../lib/api', () => ({
  api: {
    onboarding: { listTpoStudents: apiMock.listTpoStudents },
    assessment: { listSkillClaims: apiMock.listSkillClaims },
  },
  openingsApi: { list: apiMock.openingsList },
  employersApi: { list: apiMock.employersList },
}));

vi.mock('../../../lib/placement-application-count', () => ({
  countInstitutionPlacementApplications: apiMock.countApplications,
}));

beforeEach(() => {
  apiMock.listTpoStudents.mockResolvedValue([
    {
      userId: '00000000-0000-4000-8000-000000000001',
      email: 'ada@school.edu',
      fullName: 'Ada Lovelace',
      batchId: null,
      batchName: 'Comp. Sci',
      inviteStatus: 'ACCEPTED',
      lastSentAt: null,
      acceptedAt: null,
      heldAt: null,
      linkedinUrl: null,
      githubUrl: null,
    },
    {
      userId: '00000000-0000-4000-8000-000000000002',
      email: 'grace@school.edu',
      fullName: 'Grace Hopper',
      batchId: null,
      batchName: null,
      inviteStatus: 'PENDING',
      lastSentAt: null,
      acceptedAt: null,
      heldAt: null,
      linkedinUrl: null,
      githubUrl: null,
    },
  ]);
  apiMock.listSkillClaims.mockResolvedValue([
    {
      claimId: '00000000-0000-4000-8000-000000000099',
      studentId: '00000000-0000-4000-8000-000000000001',
      skillCode: 'PYTHON_APPLICATION_BACKEND_DEVELOPMENT',
      proficiency: 'INTERMEDIATE',
      status: 'VERIFIED',
      strikes: 0,
      lockedUntil: null,
      lastAttemptId: null,
    },
  ]);
  apiMock.openingsList.mockResolvedValue({
    openings: [
      {
        openingId: 'job-1',
        title: 'Backend Engineer',
        status: 'OPEN',
        employerId: 'emp-1',
      },
    ],
  });
  apiMock.employersList.mockResolvedValue({
    employers: [
      {
        employerId: 'emp-1',
        name: 'Tech Corp',
        openingCount: 1,
        activeOpeningCount: 1,
      },
    ],
  });
  apiMock.countApplications.mockResolvedValue({
    total: 5,
    byOpeningId: new Map([['job-1', 5]]),
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ReportsPage', () => {
  it('renders report sections, updated Cohort / Batch and Pending columns, and accessible progress bars', async () => {
    render(<ReportsPage />);

    expect(
      await screen.findByRole('heading', { name: 'Verification Completion by Major' }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: 'Employer Engagement by Institution' }),
    ).toBeDefined();

    // Check table headers
    expect(screen.getByText('Cohort / Batch')).toBeDefined();
    expect(screen.getByText('Pending')).toBeDefined();

    // Check data rendering
    expect(screen.getByText('Applications Matched')).toBeDefined();
    expect(screen.getByText('Comp. Sci')).toBeDefined();
    expect(screen.getByText('Undeclared')).toBeDefined();

    // Check progress bar accessibility attributes
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    const firstBar = progressBars[0];
    expect(firstBar).toBeDefined();
    expect(firstBar?.getAttribute('aria-valuenow')).toBe('100');
    expect(firstBar?.getAttribute('aria-valuemin')).toBe('0');
    expect(firstBar?.getAttribute('aria-valuemax')).toBe('100');
    expect(firstBar?.getAttribute('aria-label')).toContain('verification completion: 100%');

    // Global export button is enabled on successful load
    const exportBtn = screen.getByRole('button', { name: /Export All Metrics \(CSV\)/i });
    expect(exportBtn.hasAttribute('disabled')).toBe(false);
  });

  it('renders zero state when no data exists', async () => {
    apiMock.listTpoStudents.mockResolvedValueOnce([]);
    apiMock.listSkillClaims.mockResolvedValueOnce([]);
    apiMock.openingsList.mockResolvedValueOnce({ openings: [] });
    apiMock.employersList.mockResolvedValueOnce({ employers: [] });
    apiMock.countApplications.mockResolvedValueOnce({ total: 0, byOpeningId: new Map() });

    render(<ReportsPage />);

    expect(await screen.findByText('No students on the whitelist yet.')).toBeDefined();
    expect(screen.getByText('No employers in the repository yet.')).toBeDefined();
  });

  it('displays error alert and does not mask failure with zero when an API call fails', async () => {
    apiMock.listTpoStudents.mockRejectedValueOnce(new Error('Network error'));
    render(<ReportsPage />);

    // Non-intrusive alert banner with role="alert" appears
    const alert = await screen.findByRole('alert');
    expect(alert).toBeDefined();
    expect(screen.getByText('Failed to load some report metrics')).toBeDefined();

    // Whitelisted Students and Fully Verified show "Unavailable" rather than misleading zero
    expect(screen.getAllByText('Unavailable').length).toBeGreaterThanOrEqual(1);

    // Global export button is disabled on failure
    const exportBtn = screen.getByRole('button', { name: /Export All Metrics \(CSV\)/i });
    expect(exportBtn.hasAttribute('disabled')).toBe(true);
  });

  it('allows clicking Retry to re-fetch and recover after an initial failure', async () => {
    apiMock.listTpoStudents.mockRejectedValueOnce(new Error('Network error'));
    render(<ReportsPage />);

    expect(await screen.findByRole('alert')).toBeDefined();

    // Next call succeeds
    apiMock.listTpoStudents.mockResolvedValueOnce([
      {
        userId: 's-retry',
        email: 'retry@school.edu',
        fullName: 'Retry Student',
        batchId: null,
        batchName: 'Engineering',
        inviteStatus: 'ACCEPTED',
        lastSentAt: null,
        acceptedAt: null,
        heldAt: null,
        linkedinUrl: null,
        githubUrl: null,
      },
    ]);

    const retryButton = screen.getByRole('button', { name: /Retry/i });
    fireEvent.click(retryButton);

    // After retry, data appears and alert is dismissed
    expect(await screen.findByText('Engineering')).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
