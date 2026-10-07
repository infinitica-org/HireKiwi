'use client';

import type { ReactNode } from 'react';
import hirekiwiLogoImg from '../assets/images/Logos/WebP/HireKiwi-logo.png';

export interface BrandLoadingScreenProps {
  message?: ReactNode;
  className?: string;
}

export function BrandLoadingScreen({ message, className = '' }: BrandLoadingScreenProps) {
  const logoSrc =
    typeof hirekiwiLogoImg === 'string'
      ? hirekiwiLogoImg
      : (hirekiwiLogoImg as { src?: string })?.src || '';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex min-h-screen w-full flex-col items-center justify-center bg-white px-4 text-center select-none ${className}`}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Squircle Brand Logo Badge using HireKiwi-logo.png */}
        <div className="relative flex size-20 sm:size-22 items-center justify-center overflow-hidden rounded-[22px] bg-[#d9f953] p-3 shadow-md shadow-lime-500/15 border border-black/5">
          <img src={logoSrc} alt="HireKiwi" className="size-full object-contain" />
        </div>

        {/* Minimalist Circular Ring Spinner (Matching screenshot) */}
        <div
          className="size-6 animate-spin rounded-full border-[2.5px] border-zinc-200 border-t-zinc-800"
          aria-hidden="true"
        />

        {message && <div className="text-sm font-medium text-zinc-500">{message}</div>}
      </div>
    </div>
  );
}
