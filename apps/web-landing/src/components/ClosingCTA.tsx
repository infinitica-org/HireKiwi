'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { authSignUpUrl } from '@/lib/portal-urls';
import { useDemoModal } from '@/context/DemoModalContext';

export default function ClosingCTA() {
  const { openModal } = useDemoModal();

  return (
    <section
      data-section="final-cta"
      className="relative w-full overflow-hidden bg-white py-20 sm:py-28 px-6 sm:px-10 lg:px-12 select-none "
    >
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center"
        >
          {/* Clean Headline */}
          <h2 className="font-manrope text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            Ready to hire or place verified talent?
          </h2>

          {/* Subtitle */}
          <p className="mt-4 text-xs sm:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
            Join over 15M+ students, 1M+ hiring companies, and 1,600+ partner universities building
            on objective, verifiable skill proof.
          </p>

          {/* Minimalist Action Buttons */}
          <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
            <button
              type="button"
              onClick={(e) => openModal(e.currentTarget)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9fa61] px-7 py-3 text-sm font-bold text-zinc-950 shadow-xs hover:bg-[#cbf248] hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Book Demo</span>
              <ArrowRight className="size-4" />
            </button>

            <a
              href={authSignUpUrl()}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-7 py-3 text-sm font-semibold text-zinc-800 shadow-2xs hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950 transition-all"
            >
              <span>Sign up free</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
