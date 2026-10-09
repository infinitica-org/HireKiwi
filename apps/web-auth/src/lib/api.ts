import {
  HireKiwiApiClient,
  buildPortalRedirectUrl,
  createRefreshAccessToken,
  createHireKiwiApi,
  getAccessToken,
  portalHomeForRole,
  resolvePortalOriginsFromEnv,
  returnToForRole,
  storeAccessToken,
} from '@hirekiwi/api-client';
import { API_PREFIX } from '@hirekiwi/contracts';
import type { AuthenticatedUser } from '@hirekiwi/contracts';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const portalOrigins = resolvePortalOriginsFromEnv();
const { student: studentUrl, tpo: tpoUrl, admin: adminUrl, company: companyUrl } = portalOrigins;

export const apiClient = new HireKiwiApiClient({
  baseUrl,
  getAccessToken,
  refreshAccessToken: createRefreshAccessToken(() => api.auth.refresh()),
});
export const api = createHireKiwiApi(apiClient);

export function storeSession(accessToken: string): void {
  storeAccessToken(accessToken);
}

export function redirectForRole(
  role: AuthenticatedUser['role'],
  accessToken: string,
  returnTo?: string | null,
): void {
  const target =
    returnToForRole(role, returnTo ?? null, portalOrigins) ??
    portalHomeForRole(role, portalOrigins) ??
    studentUrl;
  window.location.href = buildPortalRedirectUrl(target, accessToken);
}

export { buildPortalRedirectUrl, studentUrl, tpoUrl, adminUrl, companyUrl, portalOrigins };

export const studentDashboardUrl = `${studentUrl.replace(/\/$/u, '')}/dashboard`;

export { baseUrl as apiBaseUrl };

/** Full-page navigation target for the "Continue with Google" button. Student-only. */
export function buildGoogleOauthUrl(returnTo?: string | null): string {
  const url = new URL(`${baseUrl.replace(/\/$/u, '')}${API_PREFIX}/auth/google`);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  return url.toString();
}
