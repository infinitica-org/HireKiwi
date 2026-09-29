'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
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
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <h2 className="font-manrope text-3xl font-medium tracking-tight text-zinc-950 sm:text-4xl lg:text-5xl">
            Designed for every side of talent.
          </h2>
          <p className="mt-3.5 text-base sm:text-lg text-zinc-600">
            A single platform connecting students, universities, employers, and accreditation
            bodies.
          </p>
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
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
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
                        <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#d9fa61]/50 text-zinc-950 mt-0.5 border border-[#c4eb46]/50">
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

                  {/* CTA Button styled in vibrant lime pill like the image */}
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
                  <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-br from-[#d9fa61] via-[#86efac] to-[#67e8f9] shadow-xl shadow-lime-500/10 min-h-[360px] sm:min-h-[420px] flex flex-col justify-center">
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
                      <div className="relative z-10 space-y-3.5">
                        {/* Floating Job / Track Card */}
                        <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 ">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex size-11 items-center justify-center rounded-xl bg-zinc-950 text-white font-extrabold text-sm shadow-xs">
                                SE
                              </div>
                              <div>
                                <div className="text-sm sm:text-base font-bold text-zinc-950">
                                  Senior Engineering Track
                                </div>
                                <div className="text-xs text-zinc-500 font-medium">
                                  Tier Trail: L1 Gold · L2 Gold · L3 Gold
                                </div>
                              </div>
                            </div>
                            <span className="rounded-full bg-[#d9fa61] px-3 py-1 text-xs font-bold text-zinc-950 shadow-xs">
                              Gold Tier
                            </span>
                          </div>
                        </div>

                        {/* Evidence Audit Card */}
                        <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 mb-3">
                            <span className="text-[11px] font-medium tracking-wider text-zinc-400">
                              Evidence Audit Record
                            </span>
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              100% Cryptographic Match
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 border border-zinc-200/70">
                              <span className="font-medium text-zinc-800">
                                Distributed Systems Concurrency
                              </span>
                              <span className="font-medium text-emerald-600">98.4% Match</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 border border-zinc-200/70">
                              <span className="font-medium text-zinc-800">
                                PostgreSQL Index Execution
                              </span>
                              <span className="font-medium text-emerald-600">95.2% Match</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 border border-zinc-200/70">
                              <span className="font-medium text-zinc-800">
                                Cryptographic Proof Verification
                              </span>
                              <span className="font-medium text-emerald-600">100% Verified</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {audience.id === 'universities' && (
                      <div className="relative z-10 space-y-3.5">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                            <span className="text-xs text-zinc-500 font-medium">
                              Cohort Placement Rate
                            </span>
                            <div className="text-2xl sm:text-3xl font-medium text-zinc-950 mt-1">
                              92.4%
                            </div>
                            <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">
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
                            <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">
                              3.2× industry average
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
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
                      <div className="relative z-10 space-y-3.5">
                        <div className="rounded-xl bg-white/95 p-4 sm:p-5 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 pb-2">
                            <span className="text-xs font-bold text-zinc-900">
                              Pre-Qualified Pipeline
                            </span>
                            <span className="text-xs font-bold text-emerald-600">
                              Zero false resumes
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 border border-zinc-200/70 text-xs">
                              <span className="font-semibold text-zinc-900">
                                Full-Stack Engineer (L3 Gold)
                              </span>
                              <span className="font-bold text-zinc-950 bg-[#d9fa61] px-2.5 py-1 rounded-full">
                                Ready to Hire
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-100 border border-zinc-200/70 text-xs">
                              <span className="font-semibold text-zinc-900">
                                AI / ML Systems Engineer
                              </span>
                              <span className="font-bold text-zinc-950 bg-[#d9fa61] px-2.5 py-1 rounded-full">
                                Ready to Hire
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="rounded-xl bg-white/95 text-zinc-950 p-3.5 sm:p-4 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                              −62%
                            </div>
                            <div className="text-xs text-zinc-500 font-medium mt-0.5">
                              Cost Per Hire
                            </div>
                          </div>
                          <div className="rounded-xl bg-white/95 text-zinc-950 p-3.5 sm:p-4 shadow-xl shadow-black/8 border border-white/60 backdrop-blur-md">
                            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-950">
                              −80%
                            </div>
                            <div className="text-xs text-zinc-500 font-medium mt-0.5">
                              Screening Time
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
