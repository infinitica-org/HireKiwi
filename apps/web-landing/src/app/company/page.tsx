'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  BarChart3,
  Building2,
  Users,
  Clock,
  Sparkles,
  ExternalLink,
  Laptop,
  Check,
} from 'lucide-react';
import { authLoginUrl } from '@/lib/portal-urls';
import { useDemoModal } from '@/context/DemoModalContext';

const COMPANY_METRICS = [
  { value: '−62%', label: 'Cost Per Technical Hire' },
  { value: '3×', label: 'Faster Time-to-Offer' },
  { value: '0%', label: 'Fake Resumes or Inflated Claims' },
  { value: '1,600+', label: 'Integrated Campus Pipelines' },
];

const RECRUITER_PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Ed25519 Cryptographic Proof',
    desc: 'Every candidate line of code, sandbox execution, and test pass is signed cryptographically. Zero resume fraud, zero fake certificates.',
  },
  {
    icon: BarChart3,
    title: 'Calibrated 5×3 BARS Rubric',
    desc: 'Candidates are evaluated against Behaviorally Anchored Rating Scales across 5 industry domains and 3 progression tiers for objective comparability.',
  },
  {
    icon: Clock,
    title: 'Save 80% Technical Screening Hours',
    desc: 'Eliminate tedious first-round coding interviews. Candidates arrive pre-vetted with sandbox replays and comprehensive architecture reviews.',
  },
  {
    icon: Building2,
    title: 'Direct University Placement Access',
    desc: 'Access verified cohorts from top accredited engineering institutions nationally without sending teams on dozens of expensive campus visits.',
  },
];

const CANDIDATES_PREVIEW = [
  {
    name: 'Devansh K.',
    role: 'Full Stack Engineer',
    tier: 'Level 2 · Practitioner',
    score: 95,
    topSkill: 'React · NestJS · PostgreSQL',
    campus: 'IIT Madras',
  },
  {
    name: 'Pooja Iyer',
    role: 'Cloud & DevOps Engineer',
    tier: 'Level 3 · Mastery',
    score: 98,
    topSkill: 'Kubernetes · Terraform · AWS',
    campus: 'BITS Pilani',
  },
  {
    name: 'Rahul Verma',
    role: 'Backend Systems Engineer',
    tier: 'Level 2 · Practitioner',
    score: 92,
    topSkill: 'Go · Kafka · Redis',
    campus: 'NIT Trichy',
  },
];

const TRUSTED_COMPANIES = ['Nexora', 'Veltriq', 'Fyntra', 'Fluxenta', 'Novacrest'];

export default function CompanyPage() {
  const { openModal } = useDemoModal();

  return (
    <div className="relative min-h-screen bg-white text-zinc-900 select-none">
      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Glow ambient background */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 size-[600px] rounded-full bg-gradient-to-b from-[#d9fa61]/40 via-sky-100/30 to-transparent blur-3xl -z-10"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left: Headlines & CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-col items-start"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3.5 py-1 text-xs sm:text-sm font-semibold text-zinc-800 mb-6">
                <Sparkles className="size-3.5 text-emerald-600" />
                <span>Enterprise Talent Intelligence for Hiring Teams</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-manrope text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.1]">
                Zero fake resumes.{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span
                    className="absolute inset-x-0 bottom-1 sm:bottom-2 -z-10 h-4 sm:h-6 rounded-sm bg-[#d9fa61]"
                    aria-hidden="true"
                  />
                  Pre-calibrated
                </span>{' '}
                engineers ready to execute.
              </h1>

              {/* Subhead */}
              <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
                Stop burning hundreds of senior engineering hours filtering unvetted applications.
                SMART gives your recruiters instant access to candidates with tamper-proof code
                sandboxes, objective BARS scores, and verified college credentials.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={(e) => openModal(e.currentTarget)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Schedule Enterprise Demo</span>
                  <ArrowRight className="size-4" />
                </button>
                <a
                  href={authLoginUrl()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 hover:text-black"
                >
                  <span>Recruiter Login</span>
                </a>
              </div>

              {/* Quick Trust Checks */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Customizable 5×3 Grids</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>ATS & HRIS Integrations</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Instant Candidate Verification</span>
                </div>
              </div>
            </motion.div>

            {/* Right: Mock Recruiter Talent Discovery Dashboard */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                {/* Glow behind card */}
                <div
                  className="pointer-events-none absolute -bottom-4 -left-4 size-40 rounded-full bg-[#d9fa61]/40 blur-2xl -z-10"
                  aria-hidden="true"
                />

                {/* Dashboard Search Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-full bg-rose-400" />
                    <div className="size-3 rounded-full bg-amber-400" />
                    <div className="size-3 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-xs font-semibold text-zinc-400">
                      SMART Enterprise Sourcing
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                    Live Pool: 24,190 Certified
                  </span>
                </div>

                {/* Search & Filter Bar */}
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200/80 px-3 py-2 text-xs text-zinc-500">
                  <Search className="size-4 text-zinc-400" />
                  <span className="text-zinc-700 font-medium">
                    Backend Engineer · Level 2+ · BARS &gt; 90
                  </span>
                </div>

                {/* Candidate Feed */}
                <div className="mt-4 space-y-3">
                  {CANDIDATES_PREVIEW.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-2xl border border-zinc-200/70 p-3.5 transition-colors hover:border-zinc-300 hover:bg-zinc-50/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-zinc-900">{c.name}</span>
                            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-600">
                              {c.campus}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">{c.role}</div>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-md bg-[#d9fa61] px-2 py-0.5 text-[10px] font-extrabold text-zinc-950 border border-[#c5ec42]">
                            {c.tier}
                          </span>
                          <div className="text-xs font-mono font-bold text-zinc-900 mt-1">
                            {c.score}/100 BARS
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>{c.topSkill}</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <ShieldCheck className="size-3" /> Signed Evidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Action */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">1-click direct interview invite</span>
                  <button
                    type="button"
                    onClick={(e) => openModal(e.currentTarget)}
                    className="text-xs font-bold text-zinc-950 hover:underline flex items-center gap-1"
                  >
                    Export Pipeline <ExternalLink className="size-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* -------------------- STATS BAND -------------------- */}
      <section className="border-y border-zinc-200/80 bg-zinc-50 py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {COMPANY_METRICS.map((m) => (
              <div key={m.label} className="p-3">
                <div className="font-manrope text-3xl sm:text-4xl font-extrabold text-zinc-950">
                  {m.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm font-medium text-zinc-600">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- 4 VALUE PILLARS -------------------- */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Enterprise Advantages
            </span>
            <h2 className="mt-2 font-manrope text-3xl sm:text-4xl font-extrabold text-zinc-950">
              Why top engineering teams recruit with SMART
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Move beyond keyword guessing and unverified resumes to a mathematically sound hiring
              pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RECRUITER_PILLARS.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all hover:shadow-md"
                >
                  <div>
                    <div className="size-10 rounded-xl bg-[#d9fa61]/60 flex items-center justify-center text-zinc-950 mb-4 border border-[#c4eb46]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">{pillar.title}</h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------- HOW COMPANIES HIRE -------------------- */}
      <section className="py-20 sm:py-24 bg-zinc-50/70 border-t border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Streamlined Process
            </span>
            <h2 className="mt-2 font-manrope text-3xl sm:text-4xl font-extrabold text-zinc-950">
              How modern enterprises hire on SMART
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="rounded-3xl border border-zinc-200 bg-white p-7">
              <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Step 01
              </div>
              <h3 className="mt-3 font-manrope text-xl font-bold text-zinc-950">
                Select Your Role Profile
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Choose from standard 5×3 archetypes (Backend, Frontend, Full Stack, DevOps, Data) or
                configure your own company rubric.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-7">
              <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Step 02
              </div>
              <h3 className="mt-3 font-manrope text-xl font-bold text-zinc-950">
                Filter by Proven Tier
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Access pre-screened talent filtered by verified capability levels (Level 1, 2, or 3)
                and direct university alignments.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-200 bg-white p-7">
              <div className="font-mono text-xs font-bold text-emerald-600 uppercase tracking-widest">
                Step 03
              </div>
              <h3 className="mt-3 font-manrope text-xl font-bold text-zinc-950">
                Audit Real Evidence & Offer
              </h3>
              <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                Inspect authentic sandbox test runs, code commits, and BARS grading notes before
                scheduling final executive conversations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- TRUSTED COMPANIES -------------------- */}
      <section className="py-14 border-t border-zinc-200/80 bg-white text-center">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-6">
            Trusted by forward-thinking hiring organizations
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75">
            {TRUSTED_COMPANIES.map((company) => (
              <span
                key={company}
                className="font-manrope text-lg sm:text-xl font-extrabold text-zinc-700 tracking-tight"
              >
                {company}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- FINAL CALL TO ACTION BANNER -------------------- */}
      <section className="py-20 sm:py-24 bg-zinc-50 border-t border-zinc-200/80">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="relative rounded-3xl bg-zinc-950 p-8 sm:p-14 text-center text-white overflow-hidden shadow-2xl">
            {/* Ambient Lime Glow behind CTA */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-[#d9fa61]/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-cyan-500/20 blur-3xl"
              aria-hidden="true"
            />

            <h2 className="relative z-10 font-manrope text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to transform your technical hiring?
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed">
              Book a live walkthrough with our enterprise talent solutions team to see how SMART can
              integrate with your ATS and campus recruitment drives.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={(e) => openModal(e.currentTarget)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9fa61] px-7 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-[#d9fa61]/20 transition-all hover:bg-[#cbf248] hover:scale-105 active:scale-95"
              >
                <span>Book Live Enterprise Demo</span>
                <ArrowRight className="size-4" />
              </button>
              <a
                href={authLoginUrl()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Company Login
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
