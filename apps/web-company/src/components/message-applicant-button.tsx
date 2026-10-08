'use client';

import { useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { StartConversationDialog } from '@hirekiwi/ui';

/** Opens the "Message" dialog for one applicant; on send, goes straight to the conversation. */
export function MessageApplicantButton({
  applicationId,
  candidateName,
  className = 'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-zinc-700 hover:bg-zinc-50',
}: {
  applicationId: string;
  candidateName: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Message ${candidateName}`}
        className={className}
      >
        <MessageSquareText className="size-3.5" aria-hidden />
        Message
      </button>
      {open ? (
        <StartConversationDialog
          open
          onClose={() => setOpen(false)}
          target={{ applicationId }}
          recipientName={candidateName}
          onStarted={(conversationId) =>
            window.location.assign(`/messages?conversation=${conversationId}`)
          }
          verificationHint={
            <a href="/company" className="underline">
              Complete company verification
            </a>
          }
        />
      ) : null}
    </>
  );
}
