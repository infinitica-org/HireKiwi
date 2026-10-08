import { Suspense } from 'react';
import { BarChart3 } from 'lucide-react';
import { CohortReadinessDashboard } from '../../../../../../components/readiness/CohortReadinessDashboard';
import { TpoBentoPageHeader } from '../../../../../../components/tpo-bento/TpoBentoPageHeader';

export const metadata = { title: 'Cohort readiness · HireKiwi TPO' };

/** Th6-607 - cohort readiness dashboard (tier distribution + skill-domain heatmap). */
export default function CohortReadinessPage() {
  return (
    <div className="space-y-4">
      <TpoBentoPageHeader
        icon={BarChart3}
        title="Cohort readiness"
        description="See how your students are spread across tiers and where each department is weakest."
      />
      {/* useSearchParams needs a Suspense boundary for static rendering. */}
      <Suspense fallback={null}>
        <CohortReadinessDashboard />
      </Suspense>
    </div>
  );
}
