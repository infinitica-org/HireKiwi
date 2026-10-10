'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { X } from 'lucide-react';

export interface ProfilePopupProps {
  open: boolean;
  title: string;
  /** Small line under the title (issuer, status, ...). */
  subtitle?: ReactNode;
  /** Small icon shown in a tinted square before the title. */
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Buttons pinned to the bottom of the popup. */
  footer?: ReactNode;
  /** `between` puts a secondary action on the left and the primary one on the right. */
  footerAlign?: 'end' | 'between';
  size?: 'md' | 'lg';
}

/**
 * The popup used by the profile's Certificates and Credentials sections. It matches the
 * Education and Work experience popups: compact header with a subtitle and close button, a
 * scrolling body and a pinned footer. Clicking the backdrop, pressing Esc or the X dismisses it.
 */
export function ProfilePopup({
  open,
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  footerAlign = 'end',
  size = 'md',
}: ProfilePopupProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 font-sans sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-md border border-[var(--ds-border)] bg-[var(--ds-surface)] shadow-[var(--ds-card-shadow)] ${
          size === 'lg' ? 'max-w-[720px]' : 'max-w-[560px]'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="border-b border-[var(--ds-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              {icon ? (
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--ds-surface-muted)] text-[var(--ds-text)] ring-1 ring-[var(--ds-border)]"
                >
                  {icon}
                </span>
              ) : null}
              <div className="min-w-0">
                <h2
                  id={titleId}
                  className="text-lg font-semibold tracking-[-0.02em] text-[var(--ds-text)]"
                >
                  {title}
                </h2>
                {subtitle ? (
                  <div className="mt-1 text-sm text-[var(--ds-text-muted)]">{subtitle}</div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1.5 text-[var(--ds-text-muted)] hover:bg-[var(--ds-surface-hover)]"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer ? (
          <footer
            className={`flex flex-wrap items-center gap-3 border-t border-[var(--ds-border)] px-6 py-4 ${
              footerAlign === 'between' ? 'justify-between' : 'justify-end'
            }`}
          >
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/** One label + value row in a detail popup. Hidden when there is nothing to show. */
export function PopupField({ label, children }: { label: string; children: ReactNode }) {
  if (children === null || children === undefined || children === '' || children === false) {
    return null;
  }
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[var(--ds-text-muted)]">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line break-words text-sm text-[var(--ds-text)]">
        {children}
      </dd>
    </div>
  );
}

/** A titled group of fields, separated from the next group by a hairline. */
export function PopupSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 border-t border-[var(--ds-border)] pt-5 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[var(--ds-text)]">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--ds-text-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
