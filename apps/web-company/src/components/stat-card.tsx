import type { LucideIcon } from 'lucide-react';
import { card, iconWrap } from '../lib/ui';

/**
 * Server-safe on purpose: pages pass a lucide icon component as a prop, which cannot
 * cross a server -> client boundary, so this must not live in a 'use client' module.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent: 'blue' | 'mint' | 'lavender' | 'amber';
}) {
  return (
    <div className={`${card} flex items-center gap-4`}>
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconWrap[accent]}`}
      >
        <Icon className="size-4.5" strokeWidth={1.5} />
      </span>
      <div className="min-w-0">
        <p className="font-heading text-2xl font-extrabold leading-none tracking-tight text-zinc-900 sm:text-3xl">
          {value}
        </p>
        <p className="mt-1 text-xs font-semibold text-zinc-500">{label}</p>
      </div>
    </div>
  );
}
