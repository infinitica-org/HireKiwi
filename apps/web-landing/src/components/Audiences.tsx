'use client';

import React from 'react';
import { motion } from 'motion/react';

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

const METRICS = [
  {
    stat: '15M+',
    title: 'Students & Alumni',
    desc: 'Pre-verified talent across 200+ specialized engineering and business tracks.',
  },
  {
    stat: '1M+',
    title: 'Companies Hiring',
    desc: 'From fast-moving AI startups to Global 2000 enterprise leaders.',
  },
  {
    stat: '1,600+',
    title: 'Partner Schools',
    desc: 'Directly integrated with placement centers and official registrar feeds.',
  },
  {
    stat: '100%',
    title: 'Verified Profiles',
    desc: 'Cryptographically signed credentials with instant tamper verification.',
  },
] as const;

export default function Audiences() {
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <section
      id="universities"
      data-section="facts-stats"
      className="w-full bg-white text-zinc-900 border-b border-zinc-200/80 scroll-mt-28 select-none"
    >
      {/* Full-Width Partner Logos Bar */}
      <div className="w-full border-b border-zinc-100 bg-white py-8 sm:py-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:px-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Left Text */}
          <div className="shrink-0 max-w-xs text-left">
            <p className="font-manrope text-sm sm:text-[15px] font-bold leading-snug text-zinc-900">
              Embraced by startups, agencies,
              <br className="hidden sm:inline" /> and sales teams around the world.
            </p>
          </div>

          {/* Right Logo Strip */}
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

      {/* Main Metrics Section */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-20 sm:py-28">
        {/* Top Header Section */}
        <div className="mb-14 sm:mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="font-manrope font-bold text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight max-w-4xl text-zinc-950"
          >
            <span>SMART&apos;s proven</span> <br />
            <span className="relative inline-block mt-1">
              <span className="relative z-10">Performance at scale.</span>
              <span
                className="absolute inset-x-0 bottom-1 sm:bottom-2 -z-10 h-3 sm:h-5 rounded-md bg-[#d9fa61]"
                aria-hidden="true"
              />
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4 max-w-xl text-base sm:text-lg text-zinc-600 font-normal"
          >
            A transparent readiness network built for verified candidates, hiring companies, and
            partner schools.
          </motion.p>
        </div>

        {/* 4 Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {METRICS.map((metric, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              whileHover={{ y: -4 }}
              className="relative flex flex-col bg-white border border-zinc-200/90 hover:border-zinc-300 transition-all duration-300 p-8 sm:p-9 rounded-2xl h-[300px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] group overflow-hidden"
            >
              {/* Top Accent Line on Hover */}
              <div
                className="absolute inset-x-0 top-0 h-1 bg-transparent transition-colors duration-300 group-hover:bg-[#d9fa61]"
                aria-hidden="true"
              />

              {/* Top Stats */}
              <div>
                <div className="font-manrope font-extrabold text-5xl sm:text-6xl lg:text-[64px] tracking-tight text-zinc-950 mb-2 transition-colors duration-300 leading-none">
                  {metric.stat}
                </div>
                <div className="font-manrope font-bold text-lg sm:text-xl text-zinc-800 tracking-tight mt-3">
                  {metric.title}
                </div>
              </div>

              {/* Bottom Text */}
              <div className="mt-auto">
                <div className="text-[13.5px] font-manrope font-normal text-zinc-500 leading-relaxed group-hover:text-zinc-700 transition-colors duration-300">
                  {metric.desc}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
