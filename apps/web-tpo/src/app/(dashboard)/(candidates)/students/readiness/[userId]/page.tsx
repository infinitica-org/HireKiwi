import { StudentReadinessDetail } from '../../../../../../components/readiness/StudentReadinessDetail';

export const metadata = { title: 'Student readiness · HireKiwi TPO' };

/** UNI-04 (Th6-440/441/443) — one student's verification summary. */
export default async function StudentReadinessDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <StudentReadinessDetail userId={userId} />;
}
