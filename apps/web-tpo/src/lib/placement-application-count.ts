import type { JobOpeningDto } from '@hirekiwi/contracts';
import { applicationsApi, openingsApi } from './api';

export type PlacementApplicationsCountResult = {
  total: number;
  byOpeningId: Map<string, number>;
};

const CONCURRENCY_LIMIT = 6;

async function mapConcurrent<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx] as T);
    }
  });

  await Promise.all(workers);
  return results;
}

/**
 * Sum application rows across all institution openings.
 * If openings are already fetched by the caller, reuses them to prevent duplicate requests.
 * Otherwise fetches the openings list via openingsApi.list().
 * Processes requests with bounded concurrency to protect network and server limits.
 */
export async function countInstitutionPlacementApplications(
  providedOpenings?: JobOpeningDto[],
): Promise<PlacementApplicationsCountResult> {
  const openings = providedOpenings ?? (await openingsApi.list().then((res) => res.openings ?? []));

  const byOpeningId = new Map<string, number>();

  if (!openings || openings.length === 0) {
    return { total: 0, byOpeningId };
  }

  // Count all openings with safe bounded concurrency (no arbitrary omission)
  const lists = await mapConcurrent(openings, CONCURRENCY_LIMIT, async (opening) => {
    const res = await applicationsApi.listForOpening(opening.openingId);
    return {
      openingId: opening.openingId,
      count: res.applications.length,
    };
  });

  let total = 0;
  for (const item of lists) {
    byOpeningId.set(item.openingId, item.count);
    total += item.count;
  }

  return { total, byOpeningId };
}
