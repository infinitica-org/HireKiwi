'use client';

import { queryKeys } from '@hirekiwi/api-client';
import { useQuery } from '@hirekiwi/ui';
import { api } from '@/lib/api';

/** Shared onboarding payload — dedupes parallel profile-section fetches. */
export function useOnboarding() {
  return useQuery({
    queryKey: queryKeys.myOnboarding(),
    queryFn: () => api.users.getOnboarding(),
    staleTime: 60_000,
  });
}
