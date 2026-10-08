'use client';

import { useState } from 'react';
import {
  ConversionMetricsCard,
  conversionRangeQuery,
  useQuery,
  useHireKiwiApi,
  type ConversionRange,
} from '@hirekiwi/ui';

/** Th6-421 — platform-wide conversion. Needs a HireKiwiApiProvider above it (MessagingProvider). */
export function ConversionPanel() {
  const api = useHireKiwiApi();
  const [range, setRange] = useState<ConversionRange>('90d');
  const query = useQuery({
    queryKey: ['admin', 'conversion', range],
    queryFn: () => api.adminApplications.conversion(conversionRangeQuery(range)),
    retry: false,
  });
  return (
    <ConversionMetricsCard
      title="Platform conversion"
      description="Across every company. A rate shows once at least 5 candidates reach a stage."
      metrics={query.data}
      isLoading={query.isPending}
      isError={query.isError}
      onRetry={() => void query.refetch()}
      range={range}
      onRangeChange={setRange}
    />
  );
}
