'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { TpoNavLink } from '../../lib/tpo-nav';
import { isNavLinkActive } from '../../lib/tpo-nav';

export type TpoWorkspaceSectionNavProps = {
  sectionTitle: string;
  sectionDescription?: string;
  items: TpoNavLink[];
  navAriaLabel: string;
};

/**
 * Product-level subsection switcher: section label, text tabs, teal underline — no pills/cards.
 */
export function TpoWorkspaceSectionNav({
  sectionTitle,
  sectionDescription,
  items,
  navAriaLabel,
}: TpoWorkspaceSectionNavProps) {
  const pathname = usePathname();

  return (
    <div className="tpo-workspace-section ">
      {sectionTitle ? (
        <div className="mb-4 px-4 pt-4 ">
          <h1 className="font-heading text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl">
            {sectionTitle}
          </h1>
          {sectionDescription ? (
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-zinc-500">
              {sectionDescription}
            </p>
          ) : null}
        </div>
      ) : null}

      <nav aria-label={navAriaLabel} className="mt-2 mb-4">
        <ul className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/90 p-1 shadow-2xs overflow-x-auto max-w-full">
          {items.map((item) => {
            const active = isNavLinkActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <li key={item.href} className="shrink-0">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs sm:text-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 ${
                    active
                      ? 'bg-black font-bold text-white shadow-2xs'
                      : 'font-semibold text-zinc-600 hover:text-zinc-950 hover:bg-white/60'
                  }`}
                >
                  {Icon ? (
                    <Icon
                      className={`size-4 shrink-0 stroke-[2] ${
                        active ? 'text-white' : 'text-black'
                      }`}
                      aria-hidden
                    />
                  ) : null}
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
