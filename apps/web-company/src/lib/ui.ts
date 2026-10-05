/** Shared class tokens — same bento look as the TPO console. */

export const pageStack = 'mx-auto w-full max-w-6xl space-y-6 pt-2 pb-16 font-sans';

/* Card, title and table values mirror apps/web-tpo/src/lib/tpo-dashboard-ui.ts (bento*). */
export const card =
  'relative overflow-hidden rounded-md border border-zinc-200/80 bg-white p-5 shadow-2xs transition-[border-color,box-shadow] duration-200 hover:border-zinc-300 md:p-6 dark:border-zinc-800 dark:bg-[#161616]';

export const cardMuted =
  'relative overflow-hidden rounded-md border border-zinc-200/80 bg-zinc-50/60 p-4 transition-[border-color,box-shadow] duration-200 dark:border-zinc-800 dark:bg-zinc-900/40';

export const pageTitle =
  'text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl dark:text-white';
export const pageDescription = 'text-sm text-zinc-500 dark:text-zinc-400';
export const sectionTitle = 'text-base font-semibold tracking-tight text-zinc-950 dark:text-white';
export const sectionSubtitle = 'mt-0.5 text-xs text-zinc-500 dark:text-zinc-400';

export const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white shadow-2xs transition-colors duration-150 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200';

export const secondaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-2xs transition-colors duration-150 hover:bg-zinc-50 hover:text-zinc-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200';

export const dangerButton =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-[var(--co-red)] px-4 py-2 text-sm font-medium text-white shadow-2xs transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--co-red)]';

export const input =
  'h-10 w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

export const textarea =
  'w-full min-w-0 rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white';

export const label = 'mb-1.5 block text-[13px] font-medium text-zinc-700 dark:text-zinc-300';

export const tableShell =
  'overflow-hidden rounded-md border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-800 dark:bg-[#161616]';
export const table = 'w-full text-left text-[13px] font-sans';
export const tableHeadRow =
  'border-b border-zinc-100 bg-zinc-50/70 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40';
export const tableHeadCell = 'px-4 py-2.5 font-semibold text-zinc-500';
export const tableRow =
  'border-b border-zinc-100 last:border-0 transition-colors duration-150 hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-800/40';
export const tableCell = 'px-4 py-3.5 text-zinc-600 dark:text-zinc-300';

export const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-[var(--ds-border)] bg-[var(--ds-surface-muted)] px-2.5 py-1 text-[12px] font-medium text-[var(--ds-text-secondary)]';

export const chipToggleOn =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-black bg-black px-3 py-1.5 text-[12px] font-semibold text-white transition-colors';
export const chipToggleOff =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--ds-border)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--ds-text-secondary)] transition-colors hover:bg-[var(--ds-surface-hover)]';

/* Segmented tabs use the TPO bentoTabActive/Idle look. */
export const segmentedShell =
  'inline-flex flex-wrap gap-1 rounded-md border border-zinc-200/80 bg-white p-1 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]';
export const segmentOn =
  'rounded px-3 py-1.5 text-sm font-medium bg-zinc-950 text-white dark:bg-white dark:text-zinc-950';
export const segmentOff =
  'rounded px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white';

export type Tone = 'green' | 'blue' | 'amber' | 'red' | 'neutral' | 'lavender';

/** One state language everywhere: Verified green / In progress blue / Pending amber / Locked red. */
export const toneBadge: Record<Tone, string> = {
  green: 'border-[#cbede3] bg-[#ecf8f4] text-[#258b72]',
  blue: 'border-[#d6e5fa] bg-[#eef5ff] text-[#3568b8]',
  amber: 'border-[#f4d9a3] bg-[#fff8e8] text-[#b7791f]',
  red: 'border-[#f5c6c8] bg-[#fdecec] text-[#b4232a]',
  lavender: 'border-[#ddd6fb] bg-[#f5f3ff] text-[#5b48d6]',
  neutral: 'border-[var(--ds-border)] bg-[var(--ds-surface-muted)] text-[var(--ds-text-secondary)]',
};

export const iconWrap: Record<'blue' | 'mint' | 'lavender' | 'amber', string> = {
  blue: 'bg-[var(--co-blue-soft)] text-[var(--co-blue)]',
  mint: 'bg-[var(--co-mint-soft)] text-[var(--co-mint)]',
  lavender: 'bg-[var(--co-lavender-soft)] text-[var(--co-lavender)]',
  amber: 'bg-[var(--co-amber-soft)] text-[var(--co-amber)]',
};
