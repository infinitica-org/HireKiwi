'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CornerDownLeft, Search } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@hirekiwi/ui/command';
import { navGroups } from './admin-sidebar';

function useIsMac(): boolean {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent));
  }, []);
  return isMac;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-zinc-200 bg-white px-1 font-sans text-[10px] font-medium text-zinc-500 shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      {children}
    </kbd>
  );
}

/** Admin command palette: jump to any admin page. Opens with Ctrl/⌘ + K (or J). */
export function SearchDialog() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const isMac = useIsMac();
  const mod = isMac ? '⌘' : 'Ctrl';

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((key === 'k' || key === 'j') && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      {/* Top-bar trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-9 w-60 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-white hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 md:inline-flex"
      >
        <Search className="size-4 shrink-0" strokeWidth={1.75} />
        <span className="flex-1 text-left">Search pages…</span>
        <span className="flex items-center gap-0.5">
          <Kbd>{mod}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search pages"
        className="flex size-9 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden"
      >
        <Search className="size-4" strokeWidth={1.75} />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search admin pages"
        description="Type to find a page, then press Enter to open it."
        className="top-[10vh] max-w-xl rounded-xl! border border-zinc-200 font-sans shadow-2xl sm:max-w-xl"
      >
        <Command className="rounded-xl bg-white">
          <div className="border-b border-zinc-100 px-2 pt-2 pb-2 [&_[data-slot=command-input-wrapper]]:p-0 [&_[data-slot=input-group]]:h-11! [&_[data-slot=input-group]]:rounded-md! [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_input]:text-[15px]">
            <CommandInput placeholder="Search pages, e.g. plans, audit, students…" />
          </div>

          <CommandList className="max-h-[min(70vh,520px)] px-2 py-2">
            <CommandEmpty>
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <Search className="size-5" />
                </span>
                <p className="text-sm font-medium text-zinc-900">No matching pages</p>
                <p className="text-xs text-zinc-500">
                  Try a different word, like “users” or “health”.
                </p>
              </div>
            </CommandEmpty>

            {navGroups.map((group) => (
              <CommandGroup
                key={group.label}
                heading={group.label}
                className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-zinc-400 [&_[cmdk-group-heading]]:uppercase"
              >
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.href}
                      value={`${item.name} ${group.label} ${item.href}`}
                      onSelect={() => go(item.href)}
                      className="group/item gap-3 rounded-md px-2 py-2 data-[selected=true]:bg-zinc-100"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500 group-data-[selected=true]/item:border-zinc-300 group-data-[selected=true]/item:text-zinc-900">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-900">
                          {item.name}
                        </span>
                        <span className="block truncate text-[11px] text-zinc-400">
                          {item.href}
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-zinc-300 opacity-0 transition-opacity group-data-[selected=true]/item:opacity-100" />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>

          <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/80 px-4 py-2.5 text-[11px] text-zinc-500">
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <Kbd>
                  <CornerDownLeft className="size-3" />
                </Kbd>
                open
              </span>
              <span className="flex items-center gap-1">
                <Kbd>Esc</Kbd>
                close
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <Kbd>{mod}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
        </Command>
      </CommandDialog>
    </>
  );
}
