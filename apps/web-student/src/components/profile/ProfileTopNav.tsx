'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { PROFILE_SECTION_NAV, type ProfileSectionId } from '@/lib/profile-sections';

interface ProfileTopNavProps {
  activeSection: ProfileSectionId;
  onSelect: (section: ProfileSectionId) => void;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function ProfileTopNav({ activeSection, onSelect, className }: ProfileTopNavProps) {
  const items = PROFILE_SECTION_NAV.flatMap((group) => group.items);
  const trackRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const hasPlacedIndicator = useRef(false);

  // Entrance: tabs fade and rise in, one after another.
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.from('[data-profile-tab]', {
        opacity: 0,
        y: 8,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'opacity,transform',
      });
    }, track);
    return () => ctx.revert();
  }, []);

  // Active pill: slides to the selected tab; the tab's icon gives a small pop.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    const button = track?.querySelector<HTMLButtonElement>(`[data-profile-tab="${activeSection}"]`);
    if (!track || !indicator || !button) return;

    const target = {
      x: button.offsetLeft,
      y: button.offsetTop,
      width: button.offsetWidth,
      height: button.offsetHeight,
      opacity: 1,
    };
    const animate = hasPlacedIndicator.current && !prefersReducedMotion();
    hasPlacedIndicator.current = true;

    const ctx = gsap.context(() => {
      if (animate) {
        gsap.to(indicator, { ...target, duration: 0.45, ease: 'power3.out' });
        gsap.fromTo(
          button.querySelector('svg'),
          { scale: 0.6, rotate: -15 },
          { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(3)', clearProps: 'transform' },
        );
      } else {
        gsap.set(indicator, target);
      }
    }, track);

    button.scrollIntoView?.({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    return () => ctx.kill();
  }, [activeSection]);

  // Keep the pill on its tab when the bar resizes (fonts loading, window resize).
  useLayoutEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      const button = track.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (!button) return;
      gsap.set(indicator, {
        x: button.offsetLeft,
        y: button.offsetTop,
        width: button.offsetWidth,
        height: button.offsetHeight,
      });
    });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Profile sections"
      data-testid="profile-top-nav"
      className={`min-w-0 max-w-full font-sans select-none ${className ?? ''}`}
    >
      <div
        ref={trackRef}
        className="relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-md border border-zinc-200/90 bg-white p-1.5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 rounded-md bg-zinc-950 opacity-0 shadow-xs dark:bg-white"
        />
        {items.map((item) => {
          const active = item.id === activeSection;
          const Icon = item.icon;
          const visibleLabel = item.navLabel ?? item.label;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              data-active={active ? 'true' : undefined}
              data-profile-tab={item.id}
              className={`relative z-10 flex shrink-0 items-center gap-1.5 rounded-md px-4 py-2 text-xs sm:text-sm font-medium transition-colors duration-200 ${
                active
                  ? 'font-bold text-white dark:text-zinc-950'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              <Icon className="size-3.5 stroke-[1.75]" />
              <span>{visibleLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
