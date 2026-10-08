'use client';

import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  HireKiwiApiClient,
  type HireKiwiClientOptions,
  createHireKiwiApi,
  type HireKiwiApi,
} from '@hirekiwi/api-client';

const HireKiwiApiContext = createContext<HireKiwiApi | null>(null);

export interface HireKiwiApiProviderProps extends Omit<HireKiwiClientOptions, 'fetchImpl'> {
  children: React.ReactNode;
}

/**
 * Initializes the typed API client and a TanStack QueryClient, providing both
 * to the React tree.
 */
export function HireKiwiApiProvider({ children, ...options }: HireKiwiApiProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false, // Let the HireKiwiApiClient handle 429 retries
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const api = useMemo(() => {
    const client = new HireKiwiApiClient(options);
    return createHireKiwiApi(client);
  }, [
    options.baseUrl,
    options.getAccessToken,
    options.refreshAccessToken,
    options.onUnauthorized,
    options.getCorrelationId,
  ]);

  return (
    <HireKiwiApiContext.Provider value={api}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </HireKiwiApiContext.Provider>
  );
}

/**
 * Hook to access the fully typed HireKiwi API client.
 */
export function useHireKiwiApi(): HireKiwiApi {
  const api = useContext(HireKiwiApiContext);
  if (!api) {
    throw new Error('useHireKiwiApi must be used within a HireKiwiApiProvider');
  }
  return api;
}

export { useQuery, useMutation, useQueryClient };
