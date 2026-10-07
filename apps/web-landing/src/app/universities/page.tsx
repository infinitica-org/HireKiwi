'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Building2,
  Award,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Check,
} from 'lucide-react';

const UNIVERSITY_WORDS = ['hired.', 'verified.', 'ready.', 'placed.'] as const;

export default function UniversitiesPage() {
  const [wordIndex, setWordIndex] = useState(0);
  // Start on the first word so the server-rendered h1 has real text (LCP / crawlers).
  const [text, setText] = useState<string>(UNIVERSITY_WORDS[0]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = UNIVERSITY_WORDS[wordIndex];
    if (!currentWord) return;

    let timer: NodeJS.Timeout;

    if (!isDeleting && text === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), 2200);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % UNIVERSITY_WORDS.length);
    } else {
      const speed = isDeleting ? 60 : 120;
      timer = setTimeout(() => {
        setText((prev) =>
          isDeleting
            ? currentWord.substring(0, prev.length - 1)
            : currentWord.substring(0, prev.length + 1),
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  return (
    <div className="min-h-screen bg-white text-zinc-900 select-none">
      {/* ------------------- HERO SECTION (LANDING STYLE) ------------------- */}
      <section
        id="universities-hero"
        data-section="hero"
        className="relative w-full flex flex-col justify-center items-center overflow-hidden bg-white bg-[radial-gradient(ellipse_65%_45%_at_50%_0%,rgba(225,255,160,0.7)_0%,rgba(180,248,220,0.4)_45%,rgba(255,255,255,0)_80%)] px-5 sm:px-8 pt-32 sm:pt-40 pb-16 sm:pb-24"
      >
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-8">
          {/* Main Headline with Animated Typewriter and Lime Highlight */}
          <h1
            className="animate-enter-lcp font-header text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-slate-900 sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.25rem]"
            style={{ animationDelay: '60ms' }}
          >
            Get your students
            <span className="mt-2 block sm:mt-3">
              <span className="relative inline-block px-2 sm:px-3">
                <span
                  className="absolute inset-x-0 bottom-1 sm:bottom-2.5 md:bottom-3 -z-10 h-5 sm:h-8 md:h-10 lg:h-12 rounded-sm bg-[#d9fa61]"
                  aria-hidden="true"
                />
                <span className="inline-block min-w-[0.5ch]">{text || '\u00A0'}</span>
                <span
                  className="inline-block w-[3px] h-[0.72em] align-baseline bg-zinc-950 ml-0.5 animate-pulse"
                  aria-hidden="true"
                />
              </span>
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className="animate-enter-lcp mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg md:max-w-2xl font-normal"
            style={{ '--enter-y': '14px', animationDelay: '120ms' } as React.CSSProperties}
          >
            Strengthen your team&apos;s connections with top employers and prove student outcomes
            with verifiable capability credentials on the network built for early talent.
          </p>

          {/* Call to Action Button */}
          <div
            className="animate-enter mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-4"
            style={{ '--enter-y': '18px', animationDelay: '180ms' } as React.CSSProperties}
          >
            <Link
              href="/universities/contact"
              className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#d9fa61] px-8 py-3.5 sm:px-9 sm:py-4 text-base font-bold text-zinc-950 shadow-md shadow-[#d9fa61]/30 hover:bg-[#cbf248] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <span>Schedule a Demo</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------- VALUE PROPOSITION / CAPABILITIES BENTO SECTION (CLEAN LIGHT THEME) ------------------- */}
      <section className="bg-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-t border-zinc-100">
        <div className="mx-auto max-w-7xl">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-2 block">
              Campus Career Infrastructure
            </span>
            <h2 className="font-header text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-slate-950">
              Built for Placement Offices & Career Centers
            </h2>
            <p className="mt-4 text-slate-600 text-base sm:text-lg leading-relaxed">
              Replace subjective resume claims with verified competency proof. Give your students
              the edge they deserve and streamline your entire campus placement cycle.
            </p>
          </div>

          {/* Clean & Aesthetic 2x2 Capabilities Grid */}
          <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
            {/* Card 1: 5x3 Grid Certification */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 sm:p-9 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-700 border border-purple-100/80 shadow-xs">
                    <Award className="size-6" />
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Standardized Rubric
                  </span>
                </div>
                <h3 className="font-header text-2xl font-medium text-slate-950 tracking-tight">
                  5×3 Grid Competency Certification
                </h3>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Evaluate candidates against calibrated Behaviorally Anchored Rating Scales across
                  5 industry-defined roles and 3 progressive capability tiers.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Calibrated BARS across 5 core engineering & tech roles</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>3 Progressive tiers from Foundation to Mastery</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Cryptographically verifiable credential signatures</span>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Cohort Analytics Matrix */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 sm:p-9 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100/80 shadow-xs">
                    <TrendingUp className="size-6" />
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Real-Time Visibility
                  </span>
                </div>
                <h3 className="font-header text-2xl font-medium text-slate-950 tracking-tight">
                  Cohort Readiness Analytics
                </h3>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Track student skill growth across departments and batches in real time. Identify
                  readiness gaps months before corporate campus drive season.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Live competency distribution across all departments</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Pre-placement gap diagnosis 3–6 months early</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Automated batch benchmarks and readiness indices</span>
                </div>
              </div>
            </motion.div>

            {/* Card 3: Direct Recruiter Inflow */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.14 }}
              className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 sm:p-9 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-100/80 shadow-xs">
                    <Building2 className="size-6" />
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Employer Pipeline
                  </span>
                </div>
                <h3 className="font-header text-2xl font-medium text-slate-950 tracking-tight">
                  Direct Employer Placement Pipeline
                </h3>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Connect your student cohorts with 1,000+ active enterprise recruiters who filter
                  candidates by verified competencies rather than raw pedigree.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>3.2× faster time-to-offer vs. cold portal applications</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Direct inbound interview requests from verified tech teams</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Candidate shortlisting based on demonstrable project skills</span>
                </div>
              </div>
            </motion.div>

            {/* Card 4: Audit-Ready Accreditation Reports */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="group relative flex flex-col justify-between rounded-3xl border border-zinc-200/90 bg-white p-7 sm:p-9 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 border border-amber-100/80 shadow-xs">
                    <ShieldCheck className="size-6" />
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Accreditation Ready
                  </span>
                </div>
                <h3 className="font-header text-2xl font-medium text-slate-950 tracking-tight">
                  Audit-Ready Accreditation Evidence
                </h3>
                <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                  Export verified cohort outcome reports for NAAC, NIRF, and ABET reviews with
                  cryptographically tamper-proof student assessment ledgers.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 space-y-2.5">
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>NAAC, NIRF & ABET outcome-based education (OBE) aligned</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Tamper-proof student assessment ledgers for peer review</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs sm:text-sm text-zinc-700">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>One-click institutional compliance dossiers</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ------------------- CLEAN LIGHT THEME CLOSING CTA SECTION ------------------- */}
      <section
        data-section="universities-final-cta"
        className="relative w-full overflow-hidden bg-white py-20 sm:py-28 px-6 sm:px-10 lg:px-12 border-t border-zinc-200/80 select-none"
      >
        {/* Subtle Ambient Radial Highlight matching Landing Page */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(217,250,97,0.18),transparent_70%)]"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-600/20 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 mb-6 shadow-xs">
              <Sparkles className="size-3.5 text-emerald-600" />
              <span>Partner with HireKiwi</span>
            </div>

            {/* Clean Headline */}
            <h2 className="font-header text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
              Ready to empower your campus placement office?
            </h2>

            {/* Subtitle */}
            <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-xl font-normal leading-relaxed">
              Join over 1,600+ partner universities, 15M+ students, and 1M+ hiring companies
              building on verifiable capability credentials.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/universities/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9fa61] px-8 py-3.5 text-sm sm:text-base font-bold text-zinc-950 shadow-md shadow-[#d9fa61]/25 hover:bg-[#cbf248] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Schedule a Demo</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
