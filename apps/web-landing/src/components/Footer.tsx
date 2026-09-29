'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import smartTextImg from '@smart/ui/assets/images/Logos/WebP/samrt-text.png';
import { studentAppUrl } from '@/lib/portal-urls';

export default function Footer() {
  return (
    <footer className="relative w-full border-t border-zinc-200/70 bg-white text-zinc-500 py-10 sm:py-14 select-none">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 sm:gap-8">
          {/* Brand & Tagline */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <Link
              href="/"
              aria-label="SMART home"
              className="inline-block transition-opacity hover:opacity-85"
            >
              <Image src={smartTextImg} alt="SMART" className="h-7 w-auto object-contain" />
            </Link>
            <span className="hidden sm:inline text-zinc-200" aria-hidden="true">
              |
            </span>
            <p className="text-xs sm:text-sm text-zinc-500 font-normal">
              The verifiable role-readiness certification platform.
            </p>
          </div>

          {/* Clean Navigation Links */}
          <nav
            aria-label="Footer links"
            className="flex flex-wrap items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium text-zinc-600"
          >
            <Link href="/students" className="transition-colors hover:text-zinc-950">
              Students
            </Link>
            <Link href="/universities" className="transition-colors hover:text-zinc-950">
              Universities
            </Link>
            <Link href="/company" className="transition-colors hover:text-zinc-950">
              Company
            </Link>
            <Link href="/#accreditation" className="transition-colors hover:text-zinc-950">
              Accreditation
            </Link>
            <a href={`${studentAppUrl()}/jobs`} className="transition-colors hover:text-zinc-950">
              Jobs
            </a>
            <Link href="/privacy" className="transition-colors hover:text-zinc-950">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-zinc-950">
              Terms
            </Link>
          </nav>
        </div>

        {/* Minimal Sub-bar */}
        <div className="mt-8 pt-6 border-t border-zinc-100 items-center gap-3 text-xs text-zinc-400">
          <div>© {new Date().getFullYear()} SMART. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
}
