'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { L1McqPlayer } from '@/components/assessment/l1-mcq-player';
import { ProctoringShell } from '@/components/proctoring/proctoring-shell';

/** Segments reserved by nested `/student/assessments/*` routes — not L1 attempt ids. */
const RESERVED_ATTEMPT_IDS = new Set(['skills']);

export default function L1McqAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();
  const attemptId = params.attemptId;

  useEffect(() => {
    if (attemptId && RESERVED_ATTEMPT_IDS.has(attemptId)) {
      router.replace('/student/assessments');
    } else if (attemptId && (attemptId.startsWith('clm_') || attemptId.startsWith('clm-'))) {
      router.replace(`/student/assessments/skills/${attemptId}`);
    }
  }, [attemptId, router]);

  if (
    !attemptId ||
    RESERVED_ATTEMPT_IDS.has(attemptId) ||
    attemptId.startsWith('clm_') ||
    attemptId.startsWith('clm-')
  ) {
    return null;
  }

  return (
    <ProctoringShell attemptId={attemptId}>
      <L1McqPlayer attemptId={attemptId} />
    </ProctoringShell>
  );
}
