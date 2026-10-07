import { HireKiwiApiClient, createHireKiwiApi } from '@hirekiwi/api-client';

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const apiClient = new HireKiwiApiClient({
  baseUrl,
  getAccessToken: () => {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('hirekiwi.accessToken');
  },
});

export const api = createHireKiwiApi(apiClient);
