'use client';

import React from 'react';
import { motion } from 'motion/react';
import TpoContactForm from '@/components/tpo-contact';

export default function UniversityContactPage() {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900">
      {/* ------------------- HERO SECTION (CENTERED, MINIMAL) ------------------- */}
      <section className="relative overflow-hidden pt-32 pb-12 sm:pt-40 sm:pb-16 bg-white">
        {/* Subtle Ambient Radial Highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(217,250,97,0.15),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1
            className="animate-enter-lcp font-cabinet font-medium text-4xl sm:text-5xl lg:text-6xl leading-[1.08] tracking-tight text-slate-950"
            style={{ '--enter-y': '16px' } as React.CSSProperties}
          >
            Let&apos;s Connect
          </h1>

          <p
            className="animate-enter-lcp mx-auto mt-4 sm:mt-5 max-w-2xl text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-slate-600"
            style={{ '--enter-y': '16px', animationDelay: '150ms' } as React.CSSProperties}
          >
            Discover how HireKiwi equips career centers and placement offices with verifiable 5×3
            grid competency assessments, automated drive workflows, and real-time student readiness
            intelligence.
          </p>
        </div>
      </section>

      {/* ------------------- NUMBERING / STATS SECTION (MATCHING SCREENSHOT) ------------------- */}
      <section className="bg-white pt-4 pb-16 sm:pt-6 sm:pb-24 ">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Salmon / Peach Highlight Header Badge Matching User Reference */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-10 sm:mb-14 inline-block"
          >
            <span className="inline-block bg-[#fed7aa] text-zinc-950 font-bold px-4 py-1.5 sm:px-5 sm:py-2 rounded-xs text-base sm:text-xl tracking-tight shadow-xs">
              Universities that switch to HireKiwi see:
            </span>
          </motion.div>

          {/* 3 Metric Columns */}
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-8 lg:gap-12">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <span className="font-cabinet font-extrabold text-6xl sm:text-7xl lg:text-8xl tracking-tight text-zinc-950 leading-none">
                3x
              </span>
              <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-zinc-600 max-w-[220px] leading-relaxed">
                average increase in number of job postings
              </p>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <span className="font-cabinet font-extrabold text-6xl sm:text-7xl lg:text-8xl tracking-tight text-zinc-950 leading-none">
                78%
              </span>
              <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-zinc-600 max-w-[220px] leading-relaxed">
                increase in student satisfaction
              </p>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <span className="font-cabinet font-extrabold text-6xl sm:text-7xl lg:text-8xl tracking-tight text-zinc-950 leading-none">
                65%
              </span>
              <p className="mt-4 text-xs sm:text-sm font-medium tracking-wide text-zinc-600 max-w-[240px] leading-relaxed">
                more students engaging in career readiness
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------- FORM SECTION ------------------- */}
      <section
        id="contact-form"
        className="scroll-mt-20 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-xl shadow-slate-900/5 text-slate-900">
              <TpoContactForm />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
