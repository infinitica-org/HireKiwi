import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@hirekiwi/ui';

export type IconTone = 'accent' | 'teal' | 'inverse' | 'muted';

/** TPO-console accent wells: soft tinted square with a coloured glyph. */
const ICON_TONE_CLASS: Record<IconTone, string> = {
  accent: 'bg-[var(--admin-dash-accent-blue-soft)] text-[var(--admin-dash-accent-blue)]',
  teal: 'bg-[var(--admin-dash-accent-mint-soft)] text-[var(--admin-dash-accent-mint)]',
  inverse: 'bg-zinc-900 text-white',
  muted: 'bg-[var(--admin-dash-accent-lavender-soft)] text-[var(--admin-dash-accent-lavender)]',
};

export function IconWell({
  icon: Icon,
  tone = 'accent',
  className,
}: {
  icon: LucideIcon;
  tone?: IconTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-lg',
        ICON_TONE_CLASS[tone],
        className,
      )}
    >
      <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden />
    </span>
  );
}

/**
 * Page title in the TPO console style (Candidates, Placement, Campus, Reports, Settings):
 * large bold heading, muted one-line description, actions on the right — no card, no icon.
 * `icon`/`tone` are still accepted so existing call sites keep compiling.
 */
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: IconTone;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 px-1 pt-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-medium tracking-tight text-zinc-950 sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </header>
  );
}
