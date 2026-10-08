import {
  HireKiwiApiClient,
  createRefreshAccessToken,
  createHireKiwiApi,
  getAccessToken,
} from '@hirekiwi/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = new HireKiwiApiClient({
  baseUrl,
  getAccessToken,
  refreshAccessToken: createRefreshAccessToken(() => api.auth.refresh()),
});

export const api = createHireKiwiApi(apiClient);
