'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@hirekiwi/ui';
import type { TpoNavLink } from '../../lib/tpo-nav';
import { isNavLinkActive } from '../../lib/tpo-nav';

export type TpoWorkspaceSectionNavProps = {
  sectionTitle: string;
  sectionDescription?: string;
  items: TpoNavLink[];
  navAriaLabel: string;
};

/**
 * Product-level subsection switcher: section label, text tabs, bottom underline — matches CampusTabs.
 */
export function TpoWorkspaceSectionNav({
  sectionTitle,
  sectionDescription,
  items,
  navAriaLabel,
}: TpoWorkspaceSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className="tpo-workspace-section mb-6">
      {sectionTitle ? (
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            {sectionTitle}
          </h1>
          {sectionDescription ? (
            <p className="mt-1 text-xs sm:text-sm font-medium text-zinc-500">
              {sectionDescription}
            </p>
          ) : null}
        </div>
      ) : null}

      <nav
        aria-label={navAriaLabel}
        className="flex gap-2 border-b border-zinc-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const active = isNavLinkActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                '-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors shrink-0',
                active
                  ? 'border-zinc-900 font-semibold text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800',
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    'size-4 shrink-0 stroke-[1.75]',
                    active ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600',
                  )}
                  aria-hidden
                />
              ) : null}
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
