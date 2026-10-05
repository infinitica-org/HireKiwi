'use client';

import type { ComponentProps } from 'react';
import { cn } from '@smart/ui';
import {
  Tabs,
  TabsContent,
  TabsList as BaseTabsList,
  TabsTrigger as BaseTabsTrigger,
} from '@smart/ui/tabs';

/**
 * In-page section tabs styled like the TPO console's `TpoWorkspaceSectionNav`:
 * plain text tabs on a hairline with a dark underline for the active one.
 */
function TabsList({ className, ...props }: ComponentProps<typeof BaseTabsList>) {
  return (
    <BaseTabsList
      variant="line"
      className={cn(
        'flex w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-zinc-200 p-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof BaseTabsTrigger>) {
  return (
    <BaseTabsTrigger
      className={cn(
        '-mb-px flex-none shrink-0 gap-2 rounded-none border-b-2 border-transparent px-3 py-2 text-sm font-medium text-zinc-500 hover:border-zinc-300 hover:text-zinc-800 [&_svg:not([class*=size-])]:size-4',
        'data-active:border-zinc-900 data-active:bg-transparent data-active:font-semibold data-active:text-zinc-900 data-active:shadow-none',
        className,
      )}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
