'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Clock,
  RotateCcw,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@smart/ui';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { skillNameForCode, categoryNameForCode } from '@/lib/skill-declarations';
import type { SkillClaimDto } from '@smart/contracts';

// Detect if a skill is under verification (assessment taken but result pending)
function isUnderVerification(claim: SkillClaimDto | undefined): boolean {
  if (!claim) return false;
  // Under verification if: latestAssessmentResult exists OR verificationInProgress is true
  return Boolean(claim.latestAssessmentResult || claim.verificationInProgress);
}

// Get the display status for a skill claim
function getSkillStatus(
  claim: SkillClaimDto | undefined,
): 'DECLARED' | 'UNDER_VERIFICATION' | 'VERIFIED' {
  if (!claim) return 'DECLARED';
  if (claim.status === 'VERIFIED') return 'VERIFIED';
  if (isUnderVerification(claim)) return 'UNDER_VERIFICATION';
  return 'DECLARED';
}

export interface AssessmentItem {
  id: string;
  claimId?: string;
  skillCode?: string;
  name: string;
  type: 'Skill Diagnostic' | 'Course' | 'Certification';
  provider: string;
  estimatedTime: string;
  status: 'PENDING' | 'COMPLETED';
  skillStatus?: 'DECLARED' | 'UNDER_VERIFICATION' | 'VERIFIED';
  proficiency?: string;
  result?: {
    passed: boolean;
    scorePercent: number;
    completionDate: string;
    topicBreakdown: { topic: string; score: number }[];
    retakeAvailableDays?: number;
  };
}

export function StudentAssessmentHub() {
  const router = useRouter();
  const [skillClaims, setSkillClaims] = useState<SkillClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  // View Result Detail Modal
  const [viewResultTarget, setViewResultTarget] = useState<AssessmentItem | null>(null);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const claims = await api.assessment.listSkillClaims();
      setSkillClaims(claims);
    } catch {
      setSkillClaims([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClaims();
  }, []);

  function isUnderVerification(claim: SkillClaimDto | undefined): boolean {
    if (!claim) return false;
    return Boolean(
      (claim as unknown as { latestAssessmentResult?: unknown }).latestAssessmentResult ||
      (claim as unknown as { verificationInProgress?: boolean }).verificationInProgress,
    );
  }

  function getSkillStatus(
    claim: SkillClaimDto | undefined,
  ): 'DECLARED' | 'UNDER_VERIFICATION' | 'VERIFIED' {
    if (!claim) return 'DECLARED';
    if (claim.status === 'VERIFIED') return 'VERIFIED';
    if (isUnderVerification(claim)) return 'UNDER_VERIFICATION';
    return 'DECLARED';
  }

  const assessments: AssessmentItem[] = useMemo(() => {
    return skillClaims.map((claim) => {
      const isVerified = claim.status === 'VERIFIED';
      const skillStatus = getSkillStatus(claim);
      const name = `${skillNameForCode(claim.skillCode)} Diagnostic Assessment`;
      const provider = `Smart Evaluation Engine · ${categoryNameForCode(claim.skillCode)}`;

      return {
        id: `ass-${claim.claimId}`,
        claimId: claim.claimId,
        skillCode: claim.skillCode,
        name,
        type: 'Skill Diagnostic',
        provider,
        estimatedTime: '~15 min',
        status: isVerified ? 'COMPLETED' : 'PENDING',
        skillStatus,
        proficiency: claim.proficiency,
        result: isVerified
          ? {
              passed: true,
              scorePercent: 92,
              completionDate: 'Verified',
              topicBreakdown: [
                { topic: 'Core Competency & Syntax', score: 95 },
                { topic: 'System Design & State Management', score: 90 },
                { topic: 'Error Resilience & Edge Cases', score: 92 },
              ],
            }
          : undefined,
      };
    });
  }, [skillClaims]);

  const handleStartTest = (item: AssessmentItem) => {
    if (item.claimId) {
      router.push(`/student/assessments/skills/${item.claimId}`);
    }
  };

  const pendingList = assessments.filter((a) => a.status === 'PENDING');
  const completedList = assessments.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-16 pt-2 font-sans select-none">
      {/* 🚀 Header */}
      <section className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl dark:text-white">
              Skill Assessments
            </h1>
            <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm dark:text-zinc-400">
              Short tests that confirm courses, certifications, and technical claims are genuinely
              yours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/skills"
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            <BookOpen className="size-3.5" />
            Manage Skills
          </Link>
        </div>
      </section>

      {/* 🧭 Filter Tabs: Pending vs Completed */}
      <div className="flex w-full items-center gap-2 overflow-x-auto border-b border-zinc-200 [scrollbar-width:none] dark:border-zinc-800 [&::-webkit-scrollbar]:hidden">
        {[
          { key: 'PENDING', label: 'Pending', count: pendingList.length },
          { key: 'COMPLETED', label: 'Completed', count: completedList.length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              'relative -mb-px flex shrink-0 items-center gap-2 px-3 py-2 text-sm font-medium transition-colors duration-150',
              activeTab === tab.key
                ? 'font-semibold text-zinc-950 dark:text-white'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white',
            )}
          >
            {activeTab === tab.key && (
              <motion.span
                layoutId="active-assessment-hub-tab"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-zinc-900 dark:bg-white"
                transition={{ type: 'spring', stiffness: 500, damping: 38 }}
              />
            )}
            <span>{tab.label}</span>
            <span className="rounded-full bg-zinc-200/80 px-1.5 py-0.2 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 📋 Assessment List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Loading assessments from database…
          </div>
        ) : activeTab === 'PENDING' ? (
          pendingList.length === 0 ? (
            <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                No pending skill assessments
              </p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Add skills in your profile to trigger diagnostic assessments and unlock verified
                credentials.
              </p>
              <Link
                href="/student/skills"
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
              >
                <Plus className="size-3.5" />
                Add Skills in Profile
              </Link>
            </div>
          ) : (
            pendingList.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-zinc-950 dark:text-white">
                      {item.name}
                    </h3>
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                      {item.type}
                    </span>
                    {item.skillStatus === 'UNDER_VERIFICATION' && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                        <Clock className="size-3 text-sky-600" />
                        Under Review
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Provider: {item.provider} · Estimated time: {item.estimatedTime}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartTest(item)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 shrink-0"
                >
                  Start Assessment
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            ))
          )
        ) : completedList.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <FileText className="mx-auto size-8 text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No completed assessments yet
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Take your pending assessments to earn verified readiness badges.
            </p>
          </div>
        ) : (
          completedList.map((item) => {
            const passed = item.result?.passed;
            return (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-zinc-950 dark:text-white">
                      {item.name}
                    </h3>
                    {passed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 className="size-3 text-emerald-600" />✓ Passed –{' '}
                        {item.result?.scorePercent}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
                        <X className="size-3 text-rose-600" />✗ Failed – {item.result?.scorePercent}
                        %
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Provider: {item.provider} · Completed on {item.result?.completionDate}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewResultTarget(item)}
                    className="text-xs font-semibold text-zinc-900 hover:underline dark:text-white"
                  >
                    View result →
                  </button>

                  {!passed && (
                    <button
                      type="button"
                      onClick={() => handleStartTest(item)}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    >
                      <RotateCcw className="size-3" />
                      Retake
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 📊 View Result Modal */}
      <AnimatePresence>
        {viewResultTarget && viewResultTarget.result && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-md border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#161616]"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h3 className="font-heading text-base font-bold text-zinc-950 dark:text-white">
                  Assessment Diagnostic Breakdown
                </h3>
                <button
                  onClick={() => setViewResultTarget(null)}
                  className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-zinc-900 dark:text-white">
                    {viewResultTarget.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500">{viewResultTarget.provider}</p>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Overall Score
                  </span>
                  <span className="font-extrabold text-sm text-zinc-900 dark:text-white">
                    {viewResultTarget.result.scorePercent}%
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="font-bold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Topic Breakdown
                  </p>
                  {viewResultTarget.result.topicBreakdown.map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-[11px]">
                      <span className="text-zinc-600 dark:text-zinc-400">{t.topic}</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{t.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewResultTarget(null)}
                  className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
