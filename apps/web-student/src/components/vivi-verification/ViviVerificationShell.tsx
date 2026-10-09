'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';
import { ViviLogo } from './ViviLogo';

export interface ViviSelectedItem {
  code: string;
  label: string;
  /** A small status shown beside the label, e.g. Verified. */
  badge?: { text: string; tone: 'ok' | 'warn' | 'muted' };
}

export interface ViviVerificationShellProps {
  open: boolean;
  /** Leave out for a screen that cannot be closed (the interview setup). */
  onClose?: () => void;
  /** Id of the heading, for the dialog's accessible name. */
  titleId: string;
  /** Short name of what is being verified, e.g. "Project Verification". */
  title: string;
  /** Names of every step, in order. */
  steps: readonly string[];
  /** Zero-based index of the step being shown. */
  stepIndex: number;
  /** The side panel's list, e.g. the skills picked so far. */
  selectedHeading: string;
  /** One line under the list heading, explaining what appears there. */
  selectedHint?: string;
  selectedEmpty: ReactNode;
  selected: readonly ViviSelectedItem[];
  onRemoveSelected?: (code: string) => void;
  /** Heading and hint for the right-hand side. */
  heading: string;
  description?: string;
  children: ReactNode;
  /** Back / Continue buttons for the footer. */
  actions: ReactNode;
  /** Show the popup at its full size with grey placeholders while its content gets ready. */
  loading?: boolean;
}

const BADGE_TONE: Record<'ok' | 'warn' | 'muted', string> = {
  ok: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  muted: 'bg-zinc-100 text-zinc-600',
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The Vivi verification popup: a light pink side panel with the steps and what has been picked, a
 * white panel for the current step, and a footer saying who verifies. One solid pink accent is used
 * for the active step and the main action. It eases in when it opens, and while its content loads
 * it shows grey placeholders that fade out as the real content fades up.
 */
export function ViviVerificationShell({
  open,
  onClose,
  titleId,
  title,
  steps,
  stepIndex,
  selectedHeading,
  selectedHint,
  selectedEmpty,
  selected,
  onRemoveSelected,
  heading,
  description,
  children,
  actions,
  loading = false,
}: ViviVerificationShellProps) {
  useEffect(() => {
    if (!open || !onClose) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 font-sans sm:p-6"
      role="presentation"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={loading}
        className="relative flex h-[min(92dvh,700px)] w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-[#161616]"
        onClick={(event) => event.stopPropagation()}
        initial={{ opacity: 0, y: 16, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.32, ease: EASE }}
      >
        {loading ? null : (
          <motion.div
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.36, ease: EASE }}
          >
            <div className="grid min-h-0 flex-1 md:grid-cols-[380px_minmax(0,1fr)]">
              {/* Left: steps and what has been picked. */}
              <aside className="m-4 hidden min-h-0 flex-col rounded-xl border border-pink-100 bg-pink-50 p-6 text-zinc-900 md:flex">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-pink-500 text-white">
                      <ShieldCheck className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-heading text-base leading-tight font-semibold text-zinc-950">
                        {title}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-600">
                        Step {stepIndex + 1} of {steps.length} · {steps[stepIndex]}
                      </p>
                    </div>
                  </div>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-[10px] leading-none text-zinc-500">
                    Powered by
                    <ViviLogo className="h-4" />
                  </span>
                </div>

                <div
                  className="mt-5 flex gap-1.5"
                  role="progressbar"
                  aria-valuemin={1}
                  aria-valuemax={steps.length}
                  aria-valuenow={stepIndex + 1}
                  aria-label={`Step ${String(stepIndex + 1)} of ${String(steps.length)}`}
                >
                  {steps.map((name, index) => (
                    <span
                      key={name}
                      className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                        index <= stepIndex ? 'bg-pink-500' : 'bg-pink-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-6 flex min-h-0 flex-1 flex-col">
                  <p className="font-heading text-sm font-semibold text-zinc-950">
                    {selectedHeading}
                  </p>
                  {selectedHint ? (
                    <p className="mt-1 text-[13px] leading-relaxed text-zinc-600">{selectedHint}</p>
                  ) : null}
                  {selected.length === 0 ? (
                    <div className="mt-4 rounded-lg border border-dashed border-pink-200 bg-white/60 px-4 py-3.5 text-[13px] leading-relaxed text-zinc-500">
                      {selectedEmpty}
                    </div>
                  ) : (
                    <ul className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {selected.map((item) => (
                          <motion.li
                            key={item.code}
                            layout
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.2, ease: EASE }}
                            className="flex items-center justify-between gap-2 rounded-lg border border-pink-100 bg-white px-3.5 py-2.5 text-sm text-zinc-800"
                          >
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge ? (
                              <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${BADGE_TONE[item.badge.tone]}`}
                              >
                                {item.badge.text}
                              </span>
                            ) : null}
                            {onRemoveSelected ? (
                              <button
                                type="button"
                                onClick={() => onRemoveSelected(item.code)}
                                aria-label={`Remove ${item.label}`}
                                className="shrink-0 rounded p-0.5 text-zinc-400 hover:bg-pink-50 hover:text-pink-700"
                              >
                                <X className="size-4" aria-hidden />
                              </button>
                            ) : null}
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}
                </div>
              </aside>

              {/* Right: the current step. */}
              <section className="flex min-h-0 min-w-0 flex-col px-6 pt-8 pb-2 md:pr-8 md:pl-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="mb-1 text-xs font-medium text-zinc-500 md:hidden">
                      Step {stepIndex + 1} of {steps.length} · {steps[stepIndex]}
                    </p>
                    <h2
                      id={titleId}
                      className="font-heading text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white"
                    >
                      {heading}
                    </h2>
                    {description ? (
                      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
                    ) : null}
                  </div>
                  {onClose ? (
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Close"
                      className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white"
                    >
                      <X className="size-5" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-5 min-h-0 flex-1 overflow-y-auto pb-4">{children}</div>
              </section>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
              <p className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                Powered by
                <ViviLogo className="h-5" />
              </p>
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            </footer>
          </motion.div>
        )}

        {/* Placeholders sit on top while loading and fade away as the content fades up. */}
        <AnimatePresence>
          {loading ? (
            <motion.div
              key="placeholders"
              className="absolute inset-0 z-10 flex flex-col bg-white dark:bg-[#161616]"
              role="status"
              aria-label="Loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <ViviSkeletonBody />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Bar({ className = '' }: { className?: string }) {
  return <span className={`block animate-pulse rounded-md bg-zinc-200/80 ${className}`} />;
}

/** The popup's inside as grey placeholders, laid out exactly like the real content. */
function ViviSkeletonBody() {
  return (
    <>
      <div className="grid min-h-0 flex-1 md:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="m-4 hidden min-h-0 flex-col rounded-xl border border-pink-100 bg-pink-50 p-6 md:flex">
          <div className="flex items-center gap-3">
            <span className="block size-11 shrink-0 animate-pulse rounded-lg bg-pink-200/70" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-40 bg-pink-200/70" />
              <Bar className="h-3 w-28 bg-pink-200/70" />
            </div>
          </div>
          <div className="mt-5 flex gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <span key={index} className="h-1 flex-1 animate-pulse rounded-full bg-pink-200" />
            ))}
          </div>
          <div className="mt-6 space-y-2.5">
            <Bar className="h-4 w-52 bg-pink-200/70" />
            <Bar className="h-3 w-64 bg-pink-200/70" />
            <Bar className="h-3 w-40 bg-pink-200/70" />
          </div>
        </aside>
        <section className="flex min-h-0 min-w-0 flex-col px-6 pt-8 pb-2 md:pr-8 md:pl-4">
          <div className="space-y-3">
            <Bar className="h-7 w-72" />
            <Bar className="h-3.5 w-96 max-w-full" />
          </div>
          <div className="mt-7 space-y-3">
            <Bar className="h-10 w-full" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3.5 py-1.5">
                <span className="block size-9 shrink-0 animate-pulse rounded-lg bg-zinc-200/80" />
                <Bar className="h-4 w-56 max-w-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
      <footer className="flex items-center justify-between gap-3 border-t border-zinc-200 px-5 py-3.5 dark:border-zinc-800">
        <Bar className="h-4 w-32" />
        <Bar className="h-10 w-28" />
      </footer>
    </>
  );
}
