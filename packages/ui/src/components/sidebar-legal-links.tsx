import { Shield } from 'lucide-react';
import { cn } from '../lib/cn';

export interface SidebarLegalLinksProps {
  /** Base URL of the auth app, which hosts /privacy and /terms. */
  authUrl: string;
  /** Full text links when the sidebar is expanded; a single icon on the collapsed rail. */
  expanded: boolean;
  className?: string;
}

const linkClass =
  'rounded-sm text-zinc-400 transition-colors hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-500 dark:hover:text-zinc-300';

/** Sidebar footer: "Privacy Policy | Terms & Conditions", shared by every portal. */
export function SidebarLegalLinks({ authUrl, expanded, className }: SidebarLegalLinksProps) {
  const base = authUrl.replace(/\/+$/, '');

  if (!expanded) {
    return (
      <a
        href={`${base}/privacy`}
        target="_blank"
        rel="noreferrer"
        title="Privacy Policy & Terms"
        aria-label="Privacy Policy and Terms & Conditions"
        className={cn('flex size-10 items-center justify-center', linkClass, className)}
      >
        <Shield className="size-4" strokeWidth={1.75} />
      </a>
    );
  }

  return (
    <p
      className={cn(
        'flex flex-wrap items-center gap-x-1.5 px-3 py-1 text-xs font-medium text-zinc-400 dark:text-zinc-500',
        className,
      )}
    >
      <a href={`${base}/privacy`} target="_blank" rel="noreferrer" className={linkClass}>
        Privacy Policy
      </a>
      <span aria-hidden="true">|</span>
      <a href={`${base}/terms`} target="_blank" rel="noreferrer" className={linkClass}>
        Terms &amp; Conditions
      </a>
    </p>
  );
}
