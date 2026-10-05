'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { LoadingState, MessagesWorkspace } from '@hirekiwi/ui';

function MessagesContent() {
  const params = useSearchParams();
  return <MessagesWorkspace initialConversationId={params.get('conversation')} />;
}

/** COM-01 — employers and advisors who write to you, and your replies (Th6-422 to Th6-427). */
export default function MessagesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
          Messages
        </h1>
        <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
          Conversations with verified employers and your institution&apos;s advisors.
        </p>
      </div>
      <Suspense fallback={<LoadingState message="Loading messages…" />}>
        <MessagesContent />
      </Suspense>
    </div>
  );
}
