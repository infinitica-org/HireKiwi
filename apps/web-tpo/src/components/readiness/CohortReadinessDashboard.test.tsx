import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UniversityReadinessAnalyticsResponse } from '@hirekiwi/contracts';
import { CohortReadinessDashboard, heatColor } from './CohortReadinessDashboard';
import { universityApi } from '../../lib/api';

const replace = vi.fn();
let search = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => '/students/readiness/cohort',
  useSearchParams: () => new URLSearchParams(search),
}));
vi.mock('../../lib/api', () => ({
  universityApi: { readinessAnalytics: vi.fn() },
}));

const cell = (domainId: string, averageScore: number | null, weakest = false) => ({
  domainId,
  studentCount: averageScore === null ? 0 : 10,
  averageScore,
  belowTargetPercent: averageScore === null ? null : 40,
  weakest,
});

const response: UniversityReadinessAnalyticsResponse = {
  generatedAt: '2026-10-06T10:00:00.000Z',
  totalStudents: 10,
  targetScore: 60,
  tiers: [
    { tier: 'GOLD', count: 2, percent: 20 },
    { tier: 'SILVER', count: 3, percent: 30 },
    { tier: 'BRONZE', count: 4, percent: 40 },
    { tier: 'NEEDS_IMPROVEMENT', count: 1, percent: 10 },
  ],
  heatmap: {
    domains: [
      { id: 'DATABASES_DATA_MANAGEMENT', name: 'Databases & Data Management' },
      { id: 'CLOUD_PLATFORMS', name: 'Cloud Platforms' },
    ],
    rows: [
      {
        department: 'CSE',
        studentCount: 6,
        cells: [cell('DATABASES_DATA_MANAGEMENT', 82), cell('CLOUD_PLATFORMS', 31, true)],
      },
      {
        department: 'ECE',
        studentCount: 4,
        cells: [cell('DATABASES_DATA_MANAGEMENT', null), cell('CLOUD_PLATFORMS', 55)],
      },
    ],
  },
  filterOptions: { departments: ['CSE', 'ECE'], campuses: ['Main'], gradYears: [2027, 2026] },
};

describe('CohortReadinessDashboard', () => {
  beforeEach(() => {
    search = '';
    replace.mockReset();
    vi.mocked(universityApi.readinessAnalytics).mockReset();
    vi.mocked(universityApi.readinessAnalytics).mockResolvedValue(response);
  });
  afterEach(cleanup);

  it('shows a loading state, then tier percentages with counts', async () => {
    render(<CohortReadinessDashboard />);
    expect(screen.getByText(/Loading cohort readiness/i)).toBeDefined();
    const chart = await screen.findByRole('img', { name: /Gold 20%/ });
    expect(chart.getAttribute('aria-label')).toBe(
      'Gold 20%, Silver 30%, Bronze 40%, Needs improvement 10%',
    );
    expect(screen.getByText('Needs improvement')).toBeDefined();
    expect(screen.getByText('(4)')).toBeDefined();
  });

  it('draws the heatmap and highlights the weakest cell', async () => {
    render(<CohortReadinessDashboard />);
    const table = await screen.findByRole('table');
    expect(within(table).getByText('Cloud Platforms')).toBeDefined();
    const weakest = table.querySelector('[data-weakest="true"]');
    expect(weakest?.textContent).toContain('31');
    expect(weakest?.textContent).toContain('(weakest)');
    // A domain nobody is scored in shows a dash, not a zero.
    expect(within(table).getAllByText('-').length).toBe(1);
  });

  it('reads all three filters from the URL and sends them together', async () => {
    search = 'department=CSE&campus=Main&gradYear=2026';
    render(<CohortReadinessDashboard />);
    await waitFor(() =>
      expect(universityApi.readinessAnalytics).toHaveBeenCalledWith({
        department: 'CSE',
        campus: 'Main',
        gradYear: 2026,
      }),
    );
  });

  it('writes a changed filter back to the URL, and clears everything', async () => {
    search = 'department=CSE';
    render(<CohortReadinessDashboard />);
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText(/Graduation year/i), { target: { value: '2026' } });
    expect(replace).toHaveBeenCalledWith('/students/readiness/cohort?department=CSE&gradYear=2026');
    fireEvent.click(screen.getByRole('button', { name: /Clear all/i }));
    expect(replace).toHaveBeenLastCalledWith('/students/readiness/cohort');
  });

  it('shows the empty state when no student matches', async () => {
    search = 'department=CIVIL';
    vi.mocked(universityApi.readinessAnalytics).mockResolvedValue({
      ...response,
      totalStudents: 0,
      tiers: response.tiers.map((t) => ({ ...t, count: 0, percent: 0 })),
      heatmap: { ...response.heatmap, rows: [] },
    });
    render(<CohortReadinessDashboard />);
    expect(await screen.findByText('No students match these filters')).toBeDefined();
  });

  it('shows an error with a working retry', async () => {
    vi.mocked(universityApi.readinessAnalytics).mockRejectedValueOnce(new Error('Server down'));
    render(<CohortReadinessDashboard />);
    expect(await screen.findByText('Server down')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /retry|try again/i }));
    expect(await screen.findByRole('table')).toBeDefined();
    expect(universityApi.readinessAnalytics).toHaveBeenCalledTimes(2);
  });
});

describe('heatColor', () => {
  it('goes from red (low) to green (high) and is blank for no data', () => {
    expect(heatColor(null)).toBeUndefined();
    expect(heatColor(0)).toBe('hsl(0 70% 88%)');
    expect(heatColor(100)).toBe('hsl(120 70% 88%)');
  });
});
