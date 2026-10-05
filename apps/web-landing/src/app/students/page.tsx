'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  Sparkles,
  Terminal,
  Code2,
  ExternalLink,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { authSignUpUrl, studentAppUrl } from '@/lib/portal-urls';

const TIER_STEPS = [
  {
    tier: 'Tier 1',
    name: 'Foundation',
    badge: 'Level 1',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-300 text-amber-900',
    description:
      'Demonstrate rigorous syntax fluency, core algorithms, and reproducible coding hygiene.',
    skills: ['Algorithmic Logic', 'Data Structures', 'Git & Branching Hygiene', 'Unit Test Basics'],
    deliverable: 'Audited benchmark score & foundational badge.',
  },
  {
    tier: 'Tier 2',
    name: 'Practitioner',
    badge: 'Level 2 · Most Hired',
    color: 'from-lime-400/20 to-emerald-500/10 border-lime-300 text-emerald-950',
    description:
      'Build and deploy realistic microservices, relational schemas, and authenticated REST APIs.',
    skills: [
      'Production API Design',
      'PostgreSQL / Prisma',
      'Concurrency & Auth',
      'Dockerized Sandboxes',
    ],
    deliverable: 'Certified role-readiness credential unlocked for top recruiters.',
  },
  {
    tier: 'Tier 3',
    name: 'Mastery',
    badge: 'Level 3 · Elite',
    color: 'from-indigo-500/20 to-purple-500/10 border-indigo-300 text-indigo-950',
    description:
      'Architect distributed systems, mitigate latency bottlenecks, and defend design trade-offs.',
    skills: [
      'High-Throughput Caching',
      'Event-Driven Queues',
      'Failure Mode Analysis',
      'Peer Code Auditing',
    ],
    deliverable: 'Distinction credential with direct fast-track executive interviews.',
  },
];

const STUDENT_ADVANTAGES = [
  {
    icon: ShieldCheck,
    title: 'Bypass the Resume Black Hole',
    desc: 'Don’t let automated ATS keyword parsers discard your hard work. Hiring managers on SMART search directly by verified competency scores.',
  },
  {
    icon: GraduationCap,
    title: 'Direct Campus Placement Sync',
    desc: 'Your college placement cell (TPO) sees your validated tiers in real time. Qualify for top-tier campus drives without repeating preliminary tests.',
  },
  {
    icon: Zap,
    title: 'Objective BARS Evaluation',
    desc: 'No subjective recruiter bias. Every task is graded against industry-calibrated Behaviorally Anchored Rating Scales with actionable feedback.',
  },
  {
    icon: Award,
    title: 'Cryptographically Signed Badge',
    desc: 'Your credential includes an Ed25519 cryptographic signature. Embed it on your GitHub README, LinkedIn profile, and resume with instant public verification.',
  },
];

const METRICS = [
  { value: '15M+', label: 'Registered Students' },
  { value: '3.4×', label: 'Higher Interview Rate' },
  { value: '89.4%', label: 'Placed within 90 Days' },
  { value: '1,600+', label: 'Campus Partners' },
];

export default function StudentsPage() {
  return (
    <div className="relative min-h-screen bg-white text-zinc-900 select-none">
      {/* -------------------- HERO SECTION -------------------- */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Subtle decorative background shapes */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 size-[650px] rounded-full bg-gradient-to-b from-[#d9fa61]/40 via-emerald-100/30 to-transparent blur-3xl -z-10"
          aria-hidden="true"
        />

        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div
              className="animate-enter-lcp lg:col-span-7 flex flex-col items-start"
              style={{ '--enter-y': '24px' } as React.CSSProperties}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-[#d9fa61]/40 px-3.5 py-1 text-xs sm:text-sm font-semibold text-zinc-900 mb-6">
                <Sparkles className="size-3.5 text-zinc-900" />
                <span>Built for Early Talent & University Students</span>
              </div>

              {/* Main Title */}
              <h1 className="font-manrope text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 leading-[1.1]">
                Skip the resume black hole.{' '}
                <span className="relative inline-block whitespace-nowrap">
                  <span
                    className="absolute inset-x-0 bottom-1 sm:bottom-2 -z-10 h-4 sm:h-6 rounded-sm bg-[#d9fa61]"
                    aria-hidden="true"
                  />
                  Get hired
                </span>{' '}
                on verified capability.
              </h1>

              {/* Tagline */}
              <p className="mt-6 text-base sm:text-lg text-zinc-600 max-w-2xl leading-relaxed">
                Traditional resumes are full of buzzwords that bots discard. SMART lets you build
                real code in sandbox environments, earning an authenticated credential that 1,000+
                top tech employers trust and hire from immediately.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={authSignUpUrl()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-zinc-800 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Create Free Student Profile</span>
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href={`${studentAppUrl()}/jobs`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-3.5 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-50 hover:text-black"
                >
                  <Briefcase className="size-4 text-zinc-500" />
                  <span>Browse Campus Jobs</span>
                </a>
              </div>

              {/* Quick Perks */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>100% Free for Students</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Permanent Verifiable Proof</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>Accepted by 1,000+ Hiring Teams</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Credential Showcase Card */}
            <div className="animate-enter-scale lg:col-span-5" style={{ animationDelay: '150ms' }}>
              <div className="relative rounded-3xl border border-zinc-200/90 bg-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
                {/* Glow pill behind card */}
                <div
                  className="pointer-events-none absolute -bottom-4 -right-4 size-44 rounded-full bg-[#d9fa61]/50 blur-2xl -z-10"
                  aria-hidden="true"
                />

                {/* Header of Credential */}
                <div className="flex items-center justify-between pb-5 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-2xl bg-zinc-950 text-white flex items-center justify-center font-bold text-lg">
                      S
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-wider font-semibold text-zinc-500">
                        Official SMART Credential
                      </div>
                      <div className="font-bold text-zinc-900 text-sm sm:text-base">
                        Ananya Sharma
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="size-3.5" />
                    Verified
                  </span>
                </div>

                {/* Role & Level Pill */}
                <div className="mt-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-zinc-500">Certified Track</span>
                      <p className="text-base font-bold text-zinc-900">Backend Software Engineer</p>
                    </div>
                    <span className="rounded-lg bg-[#d9fa61] px-2.5 py-1 text-xs font-extrabold text-zinc-950 border border-[#c6ec44]">
                      Level 2 · Practitioner
                    </span>
                  </div>

                  {/* Score Gauge */}
                  <div className="mt-4 pt-3 border-t border-zinc-200/60 flex items-baseline justify-between">
                    <span className="text-xs text-zinc-600 font-medium">BARS Competency Index</span>
                    <span className="text-xl font-extrabold text-zinc-950">
                      94<span className="text-xs font-semibold text-zinc-500">/100</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 w-full rounded-full bg-zinc-200 overflow-hidden">
                    <div className="h-full w-[94%] rounded-full bg-zinc-900" />
                  </div>
                </div>

                {/* Evaluated Skill Competencies */}
                <div className="mt-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Verified Competency Breakdown
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="size-3.5 text-zinc-500" />
                        API Design & REST Architecture
                      </span>
                      <span className="font-mono text-zinc-900">96%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="size-3.5 text-zinc-500" />
                        Database Indexing & Prisma Schemas
                      </span>
                      <span className="font-mono text-zinc-900">92%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold text-zinc-700">
                      <span className="flex items-center gap-1.5">
                        <Zap className="size-3.5 text-zinc-500" />
                        Concurrency & Edge Caching
                      </span>
                      <span className="font-mono text-zinc-900">94%</span>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Signature Footer */}
                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                  <span>Ed25519: 8f9b...a34e</span>
                  <span className="text-zinc-600 font-sans font-medium flex items-center gap-1">
                    Public Audit Key <ExternalLink className="size-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- STATS BAND -------------------- */}
      <section className="border-y border-zinc-200/80 bg-zinc-50 py-10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {METRICS.map((m) => (
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

      {/* -------------------- THE 3-TIER PATHWAY -------------------- */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Clear Progression
            </span>
            <h2 className="mt-2 font-manrope text-3xl sm:text-4xl font-extrabold text-zinc-950">
              The 3-Tier Readiness Grid
            </h2>
            <p className="mt-3 text-base text-zinc-600">
              Level up through transparent benchmarks. Each tier unlocks higher salary bands and
              exclusive company pipelines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TIER_STEPS.map((step) => (
              <div
                key={step.tier}
                className="relative rounded-3xl border border-zinc-200 bg-white p-7 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-widest">
                      {step.tier}
                    </span>
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold border ${step.color}`}
                    >
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="mt-4 font-manrope text-2xl font-bold text-zinc-950">
                    {step.name}
                  </h3>
                  <p className="mt-2.5 text-sm text-zinc-600 leading-relaxed">{step.description}</p>

                  <div className="mt-6 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Core Milestones
                    </div>
                    {step.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-2 text-xs font-medium text-zinc-700"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        <span>{skill}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-5 border-t border-zinc-100">
                  <div className="text-xs text-zinc-500 font-medium leading-tight">
                    <strong className="text-zinc-900 font-semibold">Outcome: </strong>
                    {step.deliverable}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- 4 ADVANTAGES GRID -------------------- */}
      <section className="py-20 sm:py-24 bg-zinc-50/70 border-t border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Why SMART Works
            </span>
            <h2 className="mt-2 font-manrope text-3xl sm:text-4xl font-extrabold text-zinc-950">
              Built to give students an unfair advantage
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STUDENT_ADVANTAGES.map((adv) => {
              const Icon = adv.icon;
              return (
                <div
                  key={adv.title}
                  className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-xs flex flex-col"
                >
                  <div className="size-10 rounded-xl bg-[#d9fa61]/60 flex items-center justify-center text-zinc-950 mb-4 border border-[#c4eb46]">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900">{adv.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    {adv.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------- FINAL CALL TO ACTION BANNER -------------------- */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="relative rounded-3xl bg-zinc-950 p-8 sm:p-14 text-center text-white overflow-hidden shadow-2xl">
            {/* Ambient Lime Glow behind CTA */}
            <div
              className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-[#d9fa61]/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 size-72 rounded-full bg-emerald-500/20 blur-3xl"
              aria-hidden="true"
            />

            <h2 className="relative z-10 font-manrope text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to prove what you can build?
            </h2>
            <p className="relative z-10 mx-auto mt-4 max-w-xl text-sm sm:text-base text-zinc-300 leading-relaxed">
              Create your profile in 60 seconds, choose your track, and take your first benchmark
              assessment for free.
            </p>

            <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={authSignUpUrl()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d9fa61] px-7 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-[#d9fa61]/20 transition-all hover:bg-[#cbf248] hover:scale-105 active:scale-95"
              >
                <span>Get Started Free</span>
                <ArrowRight className="size-4" />
              </a>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
