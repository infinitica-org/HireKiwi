'use client';

import { useEffect, useState } from 'react';
import { Eye, X } from 'lucide-react';
import { PublicProfilePreview } from '@/components/public-profile/public-profile-preview';

/** Th6-600 — opens the student's public profile, exactly as employers see it, in a modal. */
export function RecruiterPreviewButton() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 hover:text-zinc-950"
      >
        <Eye className="size-4" aria-hidden />
        Preview as recruiter
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 font-sans sm:p-8"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Preview as recruiter"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-6xl rounded-md border border-zinc-200 bg-zinc-50 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-md border-b border-zinc-200 bg-white px-5 py-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">Preview as recruiter</p>
                <p className="text-xs text-zinc-500">
                  Exactly what employers see at your public link.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close preview"
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-5">
              <PublicProfilePreview embedded />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
