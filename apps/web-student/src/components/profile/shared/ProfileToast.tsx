'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';

export const PROFILE_TOAST_MS = 3000;

/**
 * A short confirmation ("GitHub disconnected.") that slides in at the top right and goes away on
 * its own after 3 seconds. The thin bar along the bottom shows the time left; the X closes it now.
 */
export function ProfileToast({
  message,
  onDismiss,
  durationMs = PROFILE_TOAST_MS,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}) {
  // Keep the latest callback without restarting the timer when the parent re-renders.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => dismissRef.current(), durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm justify-end font-sans">
      <motion.div
        key={message}
        role="status"
        aria-live="polite"
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="pointer-events-auto relative w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-[#161616]"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          >
            <Check className="size-4" strokeWidth={2.5} />
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-zinc-900 dark:text-white">
            {message}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <motion.div
          aria-hidden
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: durationMs / 1000, ease: 'linear' }}
          className="h-0.5 bg-emerald-500"
        />
      </motion.div>
    </div>
  );
}
