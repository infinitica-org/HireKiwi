import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * One look for every saved profile entry (education, projects, certificates, credentials,
 * languages, resume): a flat card with a thin border, plain label/value rows and quiet badges.
 * Fonts follow the brand theme: Manrope (`font-sans`) for text, Cabinet Grotesk (`font-heading`)
 * for titles. They are set on the card itself because the student page body uses a system font.
 */

export type EntryTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_CLASS: Record<EntryTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  info: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  neutral: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300',
};

export const entryCardClass =
  'rounded-lg border border-zinc-200 bg-white font-sans text-zinc-900 select-none dark:border-zinc-800 dark:bg-[#161616] dark:text-white';

export function EntryCard({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={`${entryCardClass} ${className ?? ''}`}>{children}</article>;
}

export function EntryBadge({
  tone = 'neutral',
  icon: Icon,
  children,
}: {
  tone?: EntryTone;
  icon?: LucideIcon;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}
    >
      {Icon ? <Icon className="size-3 shrink-0" aria-hidden /> : null}
      {children}
    </span>
  );
}

export function EntryHeader({
  leading,
  title,
  subtitle,
  badges,
  actions,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-3">
      <div className="flex min-w-0 items-start gap-3">
        {leading}
        <div className="min-w-0">
          <h3 className="font-heading text-[15px] leading-snug font-semibold tracking-tight break-words text-zinc-950 dark:text-white">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-snug break-words text-zinc-500 dark:text-zinc-400">
              {subtitle}
            </p>
          ) : null}
          {badges ? <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-0.5">{actions}</div> : null}
    </div>
  );
}

/** Small neutral square for an icon or logo in front of a title. */
export function EntryIconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
      <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

export function EntryFacts({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-zinc-100 px-5 py-4 text-sm dark:border-zinc-800">
      {children}
    </dl>
  );
}

export function EntryFact({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-xs text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="mt-0.5 min-w-0 font-medium break-words text-zinc-900 dark:text-white">
        {children}
      </dd>
    </div>
  );
}

export function EntryFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
      {children}
    </div>
  );
}

const iconButtonBase =
  'flex size-8 items-center justify-center rounded-md text-zinc-500 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-900 disabled:opacity-50 dark:text-zinc-400';

export function EntryIconButton({
  label,
  onClick,
  danger = false,
  disabled = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${iconButtonBase} ${
        danger
          ? 'hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
          : 'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

/** Quiet text action used in card footers (View, Manage, Take assessment). */
export const entryTextButtonClass =
  'inline-flex items-center gap-1.5 rounded-md px-2 py-1 -mx-2 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white';

/** Filled action for the one primary thing on a card. */
export const entryPrimaryButtonClass =
  'inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200';
