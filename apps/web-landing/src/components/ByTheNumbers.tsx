'use client';

import React from 'react';
import { motion } from 'motion/react';

const STATS = [
  {
    value: '15M+',
    label: 'students and alumni',
    subtext: 'Pre-verified across 200+ specialized tracks',
  },
  {
    value: '1M+',
    label: 'companies hiring',
    subtext: 'From fast-moving startups to Global 2000',
  },
  {
    value: '1,600+',
    label: 'partner schools',
    subtext: 'Directly integrated with verified registrar feeds',
  },
] as const;

const COMPANY_LOGOS = [
  {
    name: 'Nexora',
    mark: (
      <svg className="size-5 shrink-0 text-zinc-900" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 3h3.5l9 12.5V3H20v18h-3.5L7.5 8.5V21H4V3z" />
      </svg>
    ),
  },
  {
    name: 'Veltriq',
    mark: (
      <svg
        className="size-5 shrink-0 text-[#2563eb]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="m9 9 6 6m0-6-6 6" />
      </svg>
    ),
  },
  {
    name: 'Fyntra',
    mark: (
      <svg className="size-5 shrink-0 text-[#ea580c]" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H6zm12 0a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4h-3z" />
      </svg>
    ),
  },
  {
    name: 'Fluxenta',
    mark: (
      <svg
        className="size-5 shrink-0 text-[#059669]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <circle cx="12" cy="12" r="3.5" />
        <path d="M12 2v2.5m0 15V22M4.93 4.93l1.77 1.77m10.6 10.6 1.77 1.77M2 12h2.5m15 0H22M6.7 17.3l-1.77 1.77M18.97 5.03l-1.77 1.77" />
      </svg>
    ),
  },
  {
    name: 'Novacrest',
    mark: (
      <svg
        className="size-5 shrink-0 text-[#e11d48]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
] as const;

export default function ByTheNumbers() {
  return (
    <section
      data-section="by-the-numbers"
      aria-labelledby="by-the-numbers-heading"
      className="relative overflow-hidden border-b border-zinc-200/80 bg-white"
    >
      {/* 1. Full-Width Logo Strip Above Numbers (NO CARD) */}
      <div className="w-full border-t border-zinc-100 bg-white py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:px-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Left Text */}
          <div className="shrink-0 max-w-xs text-left">
            <p className="font-manrope text-sm sm:text-[15px] font-bold leading-snug text-zinc-900">
              Embraced by startups, agencies,
              <br className="hidden sm:inline" /> and sales teams around the world.
            </p>
          </div>

          {/* Right Logo Strip (Seamless & Borderless) */}
          <div className="flex flex-wrap items-center gap-7 sm:gap-10 lg:gap-14">
            {COMPANY_LOGOS.map((company) => (
              <div
                key={company.name}
                className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-105"
              >
                {company.mark}
                <span className="font-manrope text-base sm:text-[17px] font-bold tracking-tight text-zinc-900">
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. By The Numbers Section */}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Subtle Ambient Background Highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(217,250,97,0.14),transparent_70%)]"
          aria-hidden="true"
        />

        {/* Header Title */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex flex-col items-center text-center sm:mb-16"
        >
          <h2
            id="by-the-numbers-heading"
            className="font-manrope text-3xl font-extrabold tracking-tight text-zinc-950 sm:text-4xl lg:text-[2.75rem]"
          >
            A network built for verified talent at scale.
          </h2>
          <p className="mt-3.5 max-w-xl text-base text-zinc-600 sm:text-lg">
            Role-specific readiness assessed on a multi-tier grid and cryptographically certified.
          </p>
        </motion.div>

        {/* 3 Metric Cards */}
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {STATS.map((item, index) => (
            <motion.li
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.5,
                delay: index * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="relative flex h-full flex-col items-center justify-between rounded-2xl border border-zinc-200/90 bg-white p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all duration-300 hover:border-zinc-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.07)] sm:p-9">
                {/* Accent Top Border On Hover */}
                <div
                  className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-transparent transition-colors duration-300 group-hover:bg-[#d9fa61]"
                  aria-hidden="true"
                />

                <div className="flex flex-col items-center">
                  <span className="font-manrope text-4xl font-extrabold tracking-tight text-zinc-950 sm:text-5xl lg:text-[3.25rem]">
                    {item.value}
                  </span>
                  <span className="mt-2.5 text-base font-semibold capitalize text-zinc-800 sm:text-lg">
                    {item.label}
                  </span>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500 sm:text-sm">
                    {item.subtext}
                  </p>
                </div>

                <div
                  className="mt-6 h-1 w-8 rounded-full bg-zinc-100 transition-colors group-hover:bg-[#d9fa61]"
                  aria-hidden="true"
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
