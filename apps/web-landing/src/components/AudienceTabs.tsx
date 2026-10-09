'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Code2,
  Terminal,
  Zap,
  Search,
  Sparkles,
} from 'lucide-react';
import { AUDIENCE_TABS_CONTENT } from '@/lib/landing-content';
import { authSignUpUrl } from '@/lib/portal-urls';
import { useDemoModal } from '@/context/DemoModalContext';

export default function AudienceTabs() {
  const { openModal } = useDemoModal();

  return (
    <section
      id="audience-tabs"
      data-section="audience-tabs"
      className="relative w-full overflow-hidden py-12 sm:py-20 border-b border-zinc-200/80 mt-6 sm:mt-8 bg-white"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-[#d9fa61]/40 px-3.5 py-1 text-xs font-semibold text-zinc-900 mb-3.5">
            <Sparkles className="size-3.5 text-zinc-900" />
            <span>Unified Talent Ecosystem</span>
          </div>
          <h2 className="font-manrope text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            Designed for every side of talent.
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-zinc-600">
            A single platform connecting students, companies, universities, and accreditation
            bodies.
          </p>
        </div>

        {/* Quick Audience Navigation Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-14 sm:mb-20">
          <a
            href="#students"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 shadow-2xs hover:bg-[#d9fa61] hover:text-zinc-950 hover:border-lime-400 transition-all"
          >
            <span>🎓 For Students</span>
          </a>
          <a
            href="#employers"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 shadow-2xs hover:bg-[#d9fa61] hover:text-zinc-950 hover:border-lime-400 transition-all"
          >
            <span>🏢 For Companies</span>
          </a>
          <a
            href="#universities"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-xs sm:text-sm font-semibold text-zinc-800 shadow-2xs hover:bg-[#d9fa61] hover:text-zinc-950 hover:border-lime-400 transition-all"
          >
            <span>🏛️ For Universities</span>
          </a>
        </div>

        {/* Alternating Layout Sections */}
        <div className="space-y-16 sm:space-y-28">
          {AUDIENCE_TABS_CONTENT.map((audience, index) => {
            // Even indices: Preview on Left, Content on Right (matching 1st and 3rd row in image)
            // Odd indices: Content on Left, Preview on Right (matching 2nd row in image)
            const isPreviewFirst = index % 2 === 0;

            return (
              <div
                key={audience.id}
                id={audience.hash}
                className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center"
              >
                {/* Content Column */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className={`lg:col-span-5 flex flex-col text-left ${
                    isPreviewFirst ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {audience.tabLabel}
                  </span>
                  <h3 className="mt-2 font-manrope text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl">
                    {audience.headline}
                  </h3>
                  <p className="mt-3 text-base text-zinc-600 font-medium leading-relaxed">
                    {audience.tagline}
                  </p>

                  {/* 3 Benefits Points */}
                  <div className="mt-8 space-y-4">
                    {audience.benefits.map((benefit) => (
                      <div key={benefit.title} className="flex items-start gap-3.5">
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d9fa61]/60 text-zinc-950 mt-0.5 border border-[#c4eb46]">
                          <CheckCircle2 className="size-4 text-zinc-950" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900">{benefit.title}</h4>
                          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button styled in vibrant lime pill */}
                  <div className="mt-9">
                    {audience.cta.actionType === 'signup' ? (
                      <a
                        href={authSignUpUrl()}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9fa61] px-7 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-[#d9fa61]/30 hover:bg-[#cbf248] hover:shadow-lg hover:scale-[1.02] transition-all"
                      >
                        <span>{audience.cta.label}</span>
                        <ArrowRight className="size-4" />
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => openModal(e.currentTarget)}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d9fa61] px-7 py-3 text-sm font-bold text-zinc-950 shadow-md shadow-[#d9fa61]/30 hover:bg-[#cbf248] hover:shadow-lg hover:scale-[1.02] transition-all"
                      >
                        <span>{audience.cta.label}</span>
                        <ArrowRight className="size-4" />
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Preview Card Column: Radiant Lime/Cyan Gradient with Floating White UI Cards */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`lg:col-span-7 ${
                    isPreviewFirst ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
                  }`}
                >
                  <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-[#d9fa61] via-[#86efac] to-[#67e8f9] shadow-xl shadow-lime-500/10 min-h-[380px] sm:min-h-[440px] flex flex-col justify-center">
                    {/* Ambient glowing radial highlights */}
                    <div
                      className="pointer-events-none absolute -top-12 -left-12 size-60 rounded-full bg-[#d9fa61]/60 blur-2xl"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute -bottom-12 -right-12 size-60 rounded-full bg-[#38bdf8]/50 blur-2xl"
                      aria-hidden="true"
                    />

                    {/* Preview Content Inside Glowing Card */}
                    {audience.id === 'students' && (
                      <div className="relative z-10 space-y-3.5 text-left">
                        {/* Interactive Student Credential Card */}
                        <div className="rounded-2xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60">
                          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white font-extrabold text-sm shadow-xs">
                                AS
                              </div>
                              <div>
                                <div className="text-sm sm:text-base font-bold text-zinc-950">
                                  Ananya Sharma
                                </div>
                                <div className="text-xs text-zinc-500 font-medium">
                                  B.Tech Computer Science · Class of &apos;26
                                </div>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                              <ShieldCheck className="size-3.5 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          </div>

                          {/* Certified Track & Score Gauge */}
                          <div className="mt-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 p-3.5">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[11px] font-semibold text-zinc-500">
                                  Certified Track
                                </span>
                                <p className="text-sm font-bold text-zinc-900">
                                  Backend Software Engineer
                                </p>
                              </div>
                              <span className="rounded-md bg-[#d9fa61] px-2 py-0.5 text-xs font-extrabold text-zinc-950 border border-[#c6ec44]">
                                Level 2 · Practitioner
                              </span>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-zinc-200/60 flex items-baseline justify-between">
                              <span className="text-xs text-zinc-600 font-medium">
                                BARS Competency Index
                              </span>
                              <span className="text-base font-extrabold text-zinc-950">
                                94
                                <span className="text-xs font-semibold text-zinc-500">/100</span>
                              </span>
                            </div>
                            <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                              <div className="h-full w-[94%] rounded-full bg-zinc-900" />
                            </div>
                          </div>

                          {/* Evaluated Competencies */}
                          <div className="mt-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/90 border border-zinc-200/70">
                              <span className="flex items-center gap-1.5 font-medium text-zinc-800">
                                <Code2 className="size-3.5 text-zinc-500" />
                                API Design &amp; REST Architecture
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                96% Match
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/90 border border-zinc-200/70">
                              <span className="flex items-center gap-1.5 font-medium text-zinc-800">
                                <Terminal className="size-3.5 text-zinc-500" />
                                Database Indexing &amp; Prisma Schemas
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                92% Match
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-100/90 border border-zinc-200/70">
                              <span className="flex items-center gap-1.5 font-medium text-zinc-800">
                                <Zap className="size-3.5 text-zinc-500" />
                                Concurrency &amp; Edge Caching
                              </span>
                              <span className="font-mono font-bold text-emerald-700">
                                94% Match
                              </span>
                            </div>
                          </div>

                          {/* Cryptographic Proof Footer */}
                          <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span>Ed25519: 8f9b...a34e</span>
                            <span className="text-emerald-700 font-sans font-semibold flex items-center gap-1">
                              ● 100% Cryptographic Match
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {audience.id === 'universities' && (
                      <div className="relative z-10 space-y-3.5 text-left">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                            <span className="text-xs text-zinc-500 font-medium">
                              Cohort Placement Rate
                            </span>
                            <div className="text-2xl sm:text-3xl font-medium text-zinc-950 mt-1">
                              92.4%
                            </div>
                            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
                              +14% vs. unverified
                            </span>
                          </div>
                          <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                            <span className="text-xs text-zinc-500 font-medium">
                              Average Time-to-Offer
                            </span>
                            <div className="text-xl sm:text-3xl font-medium text-zinc-950 mt-1">
                              18 Days
                            </div>
                            <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
                              3.2× industry average
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                            Institutional Accreditation Export
                          </span>
                          <div className="mt-2.5 flex items-center justify-between text-xs sm:text-sm text-zinc-800">
                            <span className="font-medium">Institutional Outcome Evidence</span>
                            <span className="font-bold text-zinc-950 bg-[#d9fa61] px-2.5 py-1 rounded-full text-xs">
                              Audit Ready
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {audience.id === 'employers' && (
                      <div className="relative z-10 space-y-3.5 text-left">
                        {/* Interactive Recruiter Talent Discovery Card */}
                        <div className="rounded-2xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60">
                          {/* Search Header */}
                          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                            <div className="flex items-center gap-2">
                              <div className="size-2.5 rounded-full bg-rose-400" />
                              <div className="size-2.5 rounded-full bg-amber-400" />
                              <div className="size-2.5 rounded-full bg-emerald-400" />
                              <span className="ml-1 text-xs font-semibold text-zinc-500">
                                Recruiter Talent Discovery
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                              Live Pool: 24,190 Certified
                            </span>
                          </div>

                          {/* Filter Query Bar */}
                          <div className="mt-3 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 px-3 py-2 text-xs text-zinc-600">
                            <Search className="size-3.5 text-zinc-400 shrink-0" />
                            <span className="font-medium truncate">
                              Backend Engineer · Level 2+ · BARS &gt; 90
                            </span>
                          </div>

                          {/* Candidate Rows */}
                          <div className="mt-3 space-y-2">
                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 hover:bg-white hover:border-zinc-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs sm:text-sm text-zinc-900">
                                      Devansh K.
                                    </span>
                                    <span className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-700">
                                      IIT Madras
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500">
                                    Full-Stack Engineer
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block rounded-md bg-[#d9fa61] px-2 py-0.5 text-[9px] font-extrabold text-zinc-950 border border-[#c5ec42]">
                                    Level 2 · Gold
                                  </span>
                                  <div className="text-[11px] font-mono font-bold text-zinc-900 mt-0.5">
                                    95/100 BARS
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-zinc-200/50 flex items-center justify-between text-[10px] text-zinc-500">
                                <span>React · NestJS · PostgreSQL</span>
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="size-3" /> Signed Evidence
                                </span>
                              </div>
                            </div>

                            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-3 hover:bg-white hover:border-zinc-300 transition-colors">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs sm:text-sm text-zinc-900">
                                      Pooja Iyer
                                    </span>
                                    <span className="rounded-md bg-zinc-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-700">
                                      BITS Pilani
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-500">
                                    Cloud &amp; DevOps Engineer
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="inline-block rounded-md bg-purple-100 text-purple-900 border border-purple-200 px-2 py-0.5 text-[9px] font-extrabold">
                                    Level 3 · Mastery
                                  </span>
                                  <div className="text-[11px] font-mono font-bold text-zinc-900 mt-0.5">
                                    98/100 BARS
                                  </div>
                                </div>
                              </div>
                              <div className="mt-2 pt-1.5 border-t border-zinc-200/50 flex items-center justify-between text-[10px] text-zinc-500">
                                <span>Kubernetes · Terraform · AWS</span>
                                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="size-3" /> Signed Evidence
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Recruiter Stats Bar */}
                          <div className="mt-3 pt-2.5 border-t border-zinc-100 grid grid-cols-2 gap-2 text-center">
                            <div className="rounded-lg bg-zinc-100/80 p-2">
                              <div className="text-sm sm:text-base font-extrabold text-zinc-950">
                                −62%
                              </div>
                              <div className="text-[10px] text-zinc-500 font-medium">
                                Cost Per Hire
                              </div>
                            </div>
                            <div className="rounded-lg bg-zinc-100/80 p-2">
                              <div className="text-sm sm:text-base font-extrabold text-zinc-950">
                                −80%
                              </div>
                              <div className="text-[10px] text-zinc-500 font-medium">
                                Screening Time
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
