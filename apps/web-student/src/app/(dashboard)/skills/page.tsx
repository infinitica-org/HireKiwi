'use client';

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Award,
  Search,
  Plus,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  HelpCircle,
  Flag,
} from 'lucide-react';
import {
  SKILL_DEFINITIONS,
  skillFocusOptions,
  type SkillClaimDto,
  type SkillDefinition,
} from '@smart/contracts';
import { cn } from '@smart/ui';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/api';
import { SKILL_VERIFICATION_DIAGNOSTIC_PROFICIENCY } from '@/lib/skill-declarations';
import { SkillLevelExplanationPanel } from '@/components/assessment/skill-level-explanation-panel';

export type SkillProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Pro';

export interface EvaluatedSkill {
  definition: SkillDefinition;
  claim?: SkillClaimDto;
  level: SkillProficiencyLevel;
  levelScore: number; // 1 to 5
  hasEvidence: boolean;
  supportingEvidence: {
    type: 'Project' | 'Certification' | 'Endorsement';
    label: string;
    source: 'VERIFIED_FACT' | 'AI_INFERENCE';
  }[];
  holdingBackReason: string;
  improveSuggestions: string[];
}

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'SOFTWARE_DEVELOPMENT', label: 'Programming' },
  { id: 'DESIGN', label: 'Design' },
  { id: 'DATA_SCIENCE', label: 'Data' },
  { id: 'BUSINESS', label: 'Business' },
  { id: 'AI_ML', label: 'AI & ML' },
];

function scoreToLevel(score: number): SkillProficiencyLevel {
  if (score >= 5) return 'Pro';
  if (score === 4) return 'Expert';
  if (score === 3) return 'Advanced';
  if (score === 2) return 'Intermediate';
  return 'Beginner';
}

const ZINC_TONE =
  'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400';

const CONFIDENCE_CUES: Record<string, { label: string; tone: string }> = {
  HIGH: {
    label: 'very sure',
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  },
  MEDIUM: {
    label: 'pretty sure',
    tone: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
  },
  LOW: {
    label: 'still a rough guess',
    tone: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
  },
};

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

// Keeps the level badge honest: the card always carries a lightweight "how
// sure" signal, so the level is never presented bare.
function confidenceCue(claim: SkillClaimDto | undefined): { label: string; tone: string } {
  const assessment = claim?.latestAssessmentResult;
  const numeric = assessment?.claimConfidence ?? claim?.claimConfidence ?? null;
  const level =
    assessment?.confidence ??
    (numeric !== null ? (numeric >= 0.75 ? 'HIGH' : numeric >= 0.45 ? 'MEDIUM' : 'LOW') : null);
  const byConfidence = level ? CONFIDENCE_CUES[level] : undefined;
  if (byConfidence) return byConfidence;
  if (claim?.status === 'VERIFIED') return { label: 'confirmed', tone: ZINC_TONE };
  if (claim?.status === 'DECLARED') return { label: 'self-declared', tone: ZINC_TONE };
  return { label: 'not confirmed yet', tone: ZINC_TONE };
}

export default function SkillsProfilePage() {
  const [claims, setClaims] = useState<SkillClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Expanded "Why this level?" state
  const [expandedSkillCode, setExpandedSkillCode] = useState<string | null>(null);

  // Improve skill modal state
  const [improveSkillTarget, setImproveSkillTarget] = useState<EvaluatedSkill | null>(null);

  // Dispute mapping modal state (I319/I564)
  const [disputeTarget, setDisputeTarget] = useState<{
    skillCode: string;
    skillName: string;
  } | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState(false);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  // Add skills dialog state
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [dialogCategory, setDialogCategory] = useState<string>('ALL');
  const [dialogSearch, setDialogSearch] = useState<string>('');
  const [selectedCodesToAdd, setSelectedCodesToAdd] = useState<Set<string>>(new Set());

  const [isPending, startTransition] = useTransition();

  const refreshClaims = useCallback(async () => {
    try {
      const rows = await api.assessment.listSkillClaims();
      setClaims(rows);
    } catch {
      setClaims([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshClaims();
  }, [refreshClaims]);

  const claimedCodes = useMemo(() => new Set(claims.map((c) => c.skillCode)), [claims]);
  const claimByCode = useMemo(() => new Map(claims.map((row) => [row.skillCode, row])), [claims]);

  // Transform skill definitions into evaluated skills
  const evaluatedSkills: EvaluatedSkill[] = useMemo(() => {
    return SKILL_DEFINITIONS.filter((def) => claimedCodes.has(def.code)).map((def) => {
      const claim = claimByCode.get(def.code);
      const isVerified = claim?.status === 'VERIFIED';
      const isDeclared = claim?.status === 'DECLARED';

      let levelScore = 1;
      if (isVerified) {
        if (claim?.proficiency === 'PROFESSIONAL') levelScore = 4;
        else if (claim?.proficiency === 'ADVANCED') levelScore = 3;
        else if (claim?.proficiency === 'INTERMEDIATE') levelScore = 2;
        else levelScore = 2;
      }

      const hasEvidence = Boolean(isVerified || claim?.status === 'DECLARED');

      const supportingEvidence: {
        type: 'Project' | 'Certification' | 'Endorsement';
        label: string;
        source: 'VERIFIED_FACT' | 'AI_INFERENCE';
      }[] = [];
      if (isVerified) {
        supportingEvidence.push({
          type: 'Project',
          label: `Hands-on challenge completed for ${def.name}`,
          source: 'AI_INFERENCE',
        });
        supportingEvidence.push({
          type: 'Certification',
          label: `Skill check result confirmed for ${def.name}`,
          source: 'VERIFIED_FACT',
        });
      }

      let holdingBackReason =
        'No certifications or vouches linked yet — that’s what’s holding back Pro.';
      if (!isVerified) {
        holdingBackReason = 'Take the skill check to start climbing to the next level.';
      }

      const improveSuggestions = [
        'Show what you can do in a quick hands-on challenge',
        'Add a certification you already have to your profile',
        'Ask a manager or mentor to vouch for you',
      ];

      return {
        definition: def,
        claim,
        level: scoreToLevel(levelScore),
        levelScore,
        hasEvidence,
        supportingEvidence,
        holdingBackReason,
        improveSuggestions,
      };
    });
  }, [claimByCode, claimedCodes]);

  const filteredSkills = useMemo(() => {
    return evaluatedSkills.filter((s) => {
      if (selectedCategory !== 'ALL' && s.definition.categoryId !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.definition.name.toLowerCase().includes(q) ||
        s.definition.code.toLowerCase().includes(q) ||
        s.definition.categoryName.toLowerCase().includes(q)
      );
    });
  }, [evaluatedSkills, selectedCategory, searchQuery]);

  const handleRemoveSkill = (code: string) => {
    // Optimistic remove for seamless UX
    setClaims((prev) => prev.filter((c) => c.skillCode !== code));
  };

  const handleSaveBatchSkills = () => {
    startTransition(() => {
      void (async () => {
        try {
          for (const code of Array.from(selectedCodesToAdd)) {
            const options = skillFocusOptions(code);
            await api.assessment.declareSkillClaim({
              skillCode: code,
              proficiency: SKILL_VERIFICATION_DIAGNOSTIC_PROFICIENCY,
              skillFocus: options[0] || undefined,
            });
          }
          await refreshClaims();
          setAddSkillOpen(false);
          setSelectedCodesToAdd(new Set());
        } catch {
          // Handled
        }
      })();
    });
  };

  const toggleSelectCode = (code: string) => {
    setSelectedCodesToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 pb-16 pt-2 font-sans select-none">
      {/* 🚀 Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200/80 pb-5 dark:border-zinc-800">
        <div className="flex items-center gap-3.5">
          <div className="flex size-11 items-center justify-center rounded-lg border border-zinc-200/80 bg-zinc-100 text-zinc-900 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white">
            <Award className="size-6 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl dark:text-white">
              Your Skills
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Real skill levels backed by real proof — you don&apos;t get to grade your own homework
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddSkillOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
          >
            <Plus className="size-3.5" />+ Add Skills
          </button>
        </div>
      </section>

      {/* ℹ️ Mandatory Banner Note */}
      <div className="rounded-md border border-zinc-200/80 bg-zinc-50/70 p-3.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 flex items-center gap-2">
        <HelpCircle className="size-4 text-zinc-400 shrink-0" />
        <span>
          <strong className="text-zinc-900 dark:text-white">Heads-up:</strong> Your levels come from
          your work, skill checks, certifications, and vouches from people you&apos;ve worked with —
          never from what you say about yourself.
        </span>
      </div>

      {/* 🧭 Filter Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1 overflow-x-auto rounded-md border border-zinc-200/80 bg-zinc-100/75 p-1 dark:border-zinc-800 dark:bg-zinc-900/80">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCategory(tab.id)}
              className={cn(
                'relative z-10 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors duration-150',
                selectedCategory === tab.id
                  ? 'font-bold text-zinc-950 dark:text-white'
                  : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white',
              )}
            >
              {selectedCategory === tab.id && (
                <motion.span
                  layoutId="active-skills-category"
                  className="absolute inset-0 -z-10 rounded-md border border-zinc-200/80 bg-white shadow-2xs dark:border-zinc-700/80 dark:bg-zinc-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your skills..."
            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
          />
        </div>
      </div>

      {/* 📋 Skills Grid */}
      <div className="grid gap-3.5">
        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Working out your skill levels…
          </div>
        ) : filteredSkills.length === 0 ? (
          <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/60 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/40">
            <Award className="mx-auto size-8 text-zinc-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No skills in this category
            </p>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Add a few skills from the list and we&apos;ll start leveling you up.
            </p>
            <button
              type="button"
              onClick={() => setAddSkillOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
            >
              + Add Skills
            </button>
          </div>
        ) : (
          filteredSkills.map((item) => {
            const isExpanded = expandedSkillCode === item.definition.code;
            const skillStatus = getSkillStatus(item.claim);
            const isVerified = skillStatus === 'VERIFIED';
            const isUnderVerif = skillStatus === 'UNDER_VERIFICATION';
            const cue = confidenceCue(item.claim);

            return (
              <div
                key={item.definition.code}
                className="flex flex-col justify-between rounded-md border border-zinc-200/80 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-[#161616]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  {/* Skill Name, Category, 5-segment bar */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading text-base font-bold text-zinc-950 dark:text-white">
                        {item.definition.name}
                      </h3>
                      {isVerified ? (
                        <>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                              'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                            )}
                          >
                            {item.level}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                              'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                            )}
                          >
                            Verified
                          </span>
                        </>
                      ) : isUnderVerif ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                            'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
                          )}
                        >
                          Under Verification
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold',
                            'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                          )}
                        >
                          Not Verified
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {item.definition.categoryName}
                    </p>

                    {/* 5-Segment Level Bar - Only show for verified skills */}
                    {isVerified && (
                      <div className="pt-1">
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((segment) => {
                            const filled = segment <= item.levelScore;
                            return (
                              <div
                                key={segment}
                                className={cn(
                                  'h-2 flex-1 rounded-sm transition-all',
                                  filled
                                    ? 'bg-zinc-900 dark:bg-white'
                                    : 'bg-zinc-100 dark:bg-zinc-800',
                                )}
                              />
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                          <span>Beginner</span>
                          <span>Intermediate</span>
                          <span>Advanced</span>
                          <span>Expert</span>
                          <span>Pro</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setImproveSkillTarget(item)}
                      className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
                    >
                      {isVerified
                        ? 'Level up this skill →'
                        : isUnderVerif
                          ? 'Assessment in progress →'
                          : 'Verify Skill →'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(item.definition.code)}
                      title="Remove this skill"
                      className="rounded-md border border-zinc-200 p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Expand "Why this level?" Toggle */}
                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-850">
                  <button
                    type="button"
                    onClick={() => setExpandedSkillCode(isExpanded ? null : item.definition.code)}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  >
                    <span>Why this level?</span>
                    {isExpanded ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </button>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-4 rounded-md bg-zinc-50/80 p-4 text-xs dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800"
                    >
                      <SkillLevelExplanationPanel skillCode={item.definition.code} />

                      {/* Evidence Freshness Indicator (I318) */}
                      <div className="pt-3 border-t border-zinc-200/60 dark:border-zinc-800 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-zinc-900 dark:text-white block">
                            Is your proof still fresh?
                          </span>
                          <span className="text-[11px] text-zinc-500">
                            {item.hasEvidence
                              ? 'Yep — your proof counts for the next 12 months.'
                              : 'Nothing new linked up yet.'}
                          </span>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
                            item.hasEvidence
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                          )}
                        >
                          {item.hasEvidence ? 'FRESH' : 'NEEDS AN UPDATE'}
                        </span>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setDisputeTarget({
                              skillCode: item.definition.code,
                              skillName: item.definition.name,
                            });
                            setDisputeReason('');
                            setDisputeSuccess(false);
                            setDisputeError(null);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                        >
                          <Flag className="size-3" />
                          <span>Something look off? Tell us</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 🚀 Improve Skill Modal */}
      <AnimatePresence>
        {improveSkillTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-md border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#161616]"
            >
              <button
                type="button"
                onClick={() => setImproveSkillTarget(null)}
                className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>

              <h2 className="font-heading text-lg font-bold text-zinc-950 dark:text-white">
                {improveSkillTarget.claim?.status === 'VERIFIED'
                  ? `Level up ${improveSkillTarget.definition.name}`
                  : isUnderVerification(improveSkillTarget.claim)
                    ? `Verify ${improveSkillTarget.definition.name}`
                    : `Verify ${improveSkillTarget.definition.name}`}
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {improveSkillTarget.claim?.status === 'VERIFIED' ? (
                  <>
                    You&apos;re at{' '}
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {improveSkillTarget.level}
                    </span>
                    . Do any of these to climb higher:
                  </>
                ) : isUnderVerification(improveSkillTarget.claim) ? (
                  <>
                    Your assessment for{' '}
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {improveSkillTarget.definition.name}
                    </span>{' '}
                    is being evaluated. It may take a few moments.
                  </>
                ) : (
                  <>
                    Take a skill verification to confirm your level for{' '}
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {improveSkillTarget.definition.name}
                    </span>
                    :
                  </>
                )}
              </p>

              <div className="mt-4 space-y-2.5">
                {improveSkillTarget.improveSuggestions.map((sug, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-md border border-zinc-200 p-3 text-xs dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40"
                  >
                    <Sparkles className="size-4 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">{sug}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <Link
                  href="/assessments"
                  className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                >
                  Take a skill check →
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ➕ Add Skills Dialog with Category Checkboxes */}
      <AnimatePresence>
        {addSkillOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-md border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#161616]"
            >
              <button
                type="button"
                onClick={() => setAddSkillOpen(false)}
                className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>

              <h2 className="font-heading text-lg font-bold text-zinc-950 dark:text-white">
                Add Skills to Your Profile
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Tick the skills you want to show off — we&apos;ll keep your levels up to date for
                you.
              </p>

              {/* Search and Category Filter */}
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={dialogSearch}
                    onChange={(e) => setDialogSearch(e.target.value)}
                    placeholder="Search skills by name..."
                    className="w-full rounded-md border border-zinc-200 py-1.5 pl-8 pr-3 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </div>

                <select
                  value={dialogCategory}
                  onChange={(e) => setDialogCategory(e.target.value)}
                  className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-900 cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="SOFTWARE_DEVELOPMENT">Programming</option>
                  <option value="DESIGN">Design</option>
                  <option value="DATA_SCIENCE">Data</option>
                  <option value="BUSINESS">Business</option>
                  <option value="AI_ML">AI & ML</option>
                </select>
              </div>

              {/* Checkboxes List */}
              <div className="mt-4 flex-1 overflow-y-auto divide-y divide-zinc-100 border rounded-md p-2 dark:border-zinc-800 dark:divide-zinc-800 max-h-[360px]">
                {SKILL_DEFINITIONS.filter((d) => !claimedCodes.has(d.code))
                  .filter((d) =>
                    dialogCategory === 'ALL' ? true : d.categoryId === dialogCategory,
                  )
                  .filter((d) =>
                    dialogSearch.trim()
                      ? d.name.toLowerCase().includes(dialogSearch.toLowerCase()) ||
                        d.code.toLowerCase().includes(dialogSearch.toLowerCase())
                      : true,
                  )
                  .map((def) => {
                    const checked = selectedCodesToAdd.has(def.code);
                    return (
                      <label
                        key={def.code}
                        className="flex items-center justify-between p-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer rounded-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSelectCode(def.code)}
                            className="rounded-sm accent-zinc-900"
                          />
                          <div>
                            <span className="font-semibold text-zinc-900 dark:text-white">
                              {def.name}
                            </span>
                            <span className="ml-2 text-[11px] text-zinc-400">
                              {def.categoryName}
                            </span>
                          </div>
                        </div>
                        <code className="text-[10px] font-mono text-zinc-400">{def.code}</code>
                      </label>
                    );
                  })}
              </div>

              {/* Save Dialog Actions */}
              <div className="mt-5 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-xs text-zinc-500">
                  {selectedCodesToAdd.size} skill{selectedCodesToAdd.size === 1 ? '' : 's'} selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAddSkillOpen(false)}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={selectedCodesToAdd.size === 0 || isPending}
                    onClick={handleSaveBatchSkills}
                    className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
                  >
                    {isPending ? 'Adding…' : 'Add skills'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ Dispute Evidence Mapping Modal (I319/I564) */}
      <AnimatePresence>
        {disputeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-md rounded-md border border-zinc-200/80 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-[#161616]"
            >
              <button
                type="button"
                onClick={() => setDisputeTarget(null)}
                className="absolute right-4 top-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-center gap-2">
                <Flag className="size-4 text-amber-600" />
                <h2 className="font-heading text-base font-bold text-zinc-950 dark:text-white">
                  Something look wrong?
                </h2>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                If the level for <strong>{disputeTarget.skillName}</strong> looks off, or
                something&apos;s missing, let us know.
              </p>

              {disputeSuccess ? (
                <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Thanks for the flag! Our team will take a look and sort it out.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
                      What looks off? (at least 8 characters)
                    </label>
                    <textarea
                      rows={3}
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Tell us what looks off — for example: this level is too low, here's what I actually did..."
                      className="w-full rounded-md border border-zinc-200 p-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                    />
                  </div>

                  {disputeError && (
                    <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                      {disputeError}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setDisputeTarget(null)}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={disputeReason.trim().length < 8 || submittingDispute}
                      onClick={async () => {
                        setSubmittingDispute(true);
                        setDisputeError(null);
                        try {
                          await api.evidence.disputeEvidenceMapping({
                            skillCode: disputeTarget.skillCode,
                            reason: disputeReason.trim(),
                          });
                          setDisputeSuccess(true);
                        } catch (err: unknown) {
                          const msg =
                            err && typeof err === 'object' && 'message' in err
                              ? String((err as { message: unknown }).message)
                              : "Couldn't send that — check your message and try again.";
                          setDisputeError(msg);
                        } finally {
                          setSubmittingDispute(false);
                        }
                      }}
                      className="rounded-md bg-zinc-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900"
                    >
                      {submittingDispute ? 'Sending…' : 'Send report'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
