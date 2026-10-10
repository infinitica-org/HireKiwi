'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingState, MessagesWorkspace } from '@hirekiwi/ui';

function MessagesContent() {
  const params = useSearchParams();
  return <MessagesWorkspace fullScreen initialConversationId={params.get('conversation')} />;
}

/** COM-01 — employers and advisors who write to you, and your replies (Th6-422 to Th6-427). */
export default function MessagesPage() {
  return (
    <div className="h-full min-h-0">
      <Suspense fallback={<LoadingState message="Loading messages…" />}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
