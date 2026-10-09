import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobOpeningDto } from '@hirekiwi/contracts';
import { countInstitutionPlacementApplications } from './placement-application-count';
import { applicationsApi, openingsApi } from './api';

vi.mock('./api', () => ({
  openingsApi: {
    list: vi.fn(),
  },
  applicationsApi: {
    listForOpening: vi.fn(),
  },
}));

describe('countInstitutionPlacementApplications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles zero openings without calling applicationsApi', async () => {
    const result = await countInstitutionPlacementApplications([]);
    expect(result.total).toBe(0);
    expect(result.byOpeningId.size).toBe(0);
    expect(applicationsApi.listForOpening).not.toHaveBeenCalled();
    expect(openingsApi.list).not.toHaveBeenCalled();
  });

  it('fetches openings when none provided and reuses when provided', async () => {
    const mockOpenings: JobOpeningDto[] = [{ openingId: 'job-1' } as JobOpeningDto];
    vi.mocked(openingsApi.list).mockResolvedValue({ openings: mockOpenings });
    vi.mocked(applicationsApi.listForOpening).mockResolvedValue({
      applications: [{ applicationId: 'app-1' } as never, { applicationId: 'app-2' } as never],
    });

    // 1. Without provided openings -> calls openingsApi.list
    const res1 = await countInstitutionPlacementApplications();
    expect(openingsApi.list).toHaveBeenCalledTimes(1);
    expect(res1.total).toBe(2);
    expect(res1.byOpeningId.get('job-1')).toBe(2);

    // 2. With provided openings -> does NOT call openingsApi.list again
    vi.mocked(openingsApi.list).mockClear();
    const res2 = await countInstitutionPlacementApplications(mockOpenings);
    expect(openingsApi.list).not.toHaveBeenCalled();
    expect(res2.total).toBe(2);
  });

  it('counts across more than 20 openings without truncation', async () => {
    // Generate 25 openings
    const mockOpenings: JobOpeningDto[] = Array.from({ length: 25 }, (_, i) => ({
      openingId: `opening-${i + 1}`,
    })) as JobOpeningDto[];

    vi.mocked(applicationsApi.listForOpening).mockImplementation(async (id) => ({
      applications: [{ applicationId: `app-for-${id}` } as never],
    }));

    const result = await countInstitutionPlacementApplications(mockOpenings);
    expect(result.total).toBe(25);
    expect(result.byOpeningId.size).toBe(25);
    expect(applicationsApi.listForOpening).toHaveBeenCalledTimes(25);
    expect(result.byOpeningId.get('opening-25')).toBe(1);
  });

  it('throws an error instead of silently defaulting to zero when an application fetch fails', async () => {
    const mockOpenings: JobOpeningDto[] = [
      { openingId: 'job-ok' } as JobOpeningDto,
      { openingId: 'job-fail' } as JobOpeningDto,
    ];

    vi.mocked(applicationsApi.listForOpening).mockImplementation(async (id) => {
      if (id === 'job-fail') {
        throw new Error('Network timeout fetching applications');
      }
      return { applications: [{ applicationId: 'app-1' } as never] };
    });

    await expect(countInstitutionPlacementApplications(mockOpenings)).rejects.toThrow(
      /Network timeout fetching applications/,
    );
  });

  it('bounds concurrent requests to 6 at any given time', async () => {
    let currentInFlight = 0;
    let maxInFlight = 0;

    const mockOpenings: JobOpeningDto[] = Array.from({ length: 18 }, (_, i) => ({
      openingId: `opening-${i + 1}`,
    })) as JobOpeningDto[];

    vi.mocked(applicationsApi.listForOpening).mockImplementation(async () => {
      currentInFlight++;
      maxInFlight = Math.max(maxInFlight, currentInFlight);
      await new Promise((resolve) => setTimeout(resolve, 5));
      currentInFlight--;
      return { applications: [] };
    });

    await countInstitutionPlacementApplications(mockOpenings);
    expect(maxInFlight).toBeLessThanOrEqual(6);
    expect(applicationsApi.listForOpening).toHaveBeenCalledTimes(18);
  });
});
