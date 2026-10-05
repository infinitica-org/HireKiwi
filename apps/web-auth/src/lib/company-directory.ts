import { API_PREFIX } from '@smart/contracts';
import { isSmartApiError } from '@smart/api-client';
import { apiClient } from './api';

/**
 * Company directory for the "find your company" onboarding step.
 *
 * The api-core endpoints below are not built yet. Until they ship, search
 * reports `available: false` so the wizard falls back to creating a company,
 * and join requests surface the API error. Move these into
 * `@smart/api-client` (with contract schemas) once the backend lands.
 *
 *   GET  /api/v1/public/companies/search?q=<text>
 *        -> { items: CompanySearchResult[] }
 *   POST /api/v1/public/companies/:orgId/join-requests
 *        { fullName, workEmail } -> 201
 */

export interface CompanySearchResult {
  readonly orgId: string;
  readonly displayName: string;
  readonly website: string | null;
  readonly city: string | null;
  readonly verified: boolean;
}

export type CompanySearchOutcome =
  | { readonly available: true; readonly items: readonly CompanySearchResult[] }
  | { readonly available: false };

export interface CompanyJoinRequest {
  readonly fullName: string;
  readonly workEmail: string;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function parseResult(raw: unknown): CompanySearchResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const orgId = asString(row.orgId);
  const displayName = asString(row.displayName);
  if (!orgId || !displayName) return null;
  return {
    orgId,
    displayName,
    website: asString(row.website),
    city: asString(row.city),
    verified: row.verified === true,
  };
}

export async function searchCompanies(
  query: string,
  signal?: AbortSignal,
): Promise<CompanySearchOutcome> {
  try {
    const body = await apiClient.get<unknown>(`${API_PREFIX}/public/companies/search`, {
      query: { q: query },
      anonymous: true,
      signal,
    });
    const items =
      body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items)
        ? (body as { items: unknown[] }).items
        : [];
    return {
      available: true,
      items: items.map(parseResult).filter((r): r is CompanySearchResult => r !== null),
    };
  } catch (err) {
    if (isSmartApiError(err) && (err.statusCode === 404 || err.statusCode === 501)) {
      return { available: false };
    }
    throw err;
  }
}

export async function requestToJoinCompany(orgId: string, body: CompanyJoinRequest): Promise<void> {
  await apiClient.post<unknown>(
    `${API_PREFIX}/public/companies/${encodeURIComponent(orgId)}/join-requests`,
    body,
    { anonymous: true },
  );
}

/** `ada@acme.co.in` -> `acme`: a sensible first search for the user's company. */
export function companyQueryFromEmail(email: string): string {
  const domain = email.split('@')[1]?.trim().toLowerCase() ?? '';
  return domain.split('.')[0] ?? '';
}
