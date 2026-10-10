'use client';

import { motion } from 'motion/react';
import { AlertTriangle, Check, CheckCircle2, Loader2, ShieldAlert, XCircle } from 'lucide-react';
import type { CandidateCertificateDto, CertificateSourceCheck } from '@hirekiwi/contracts';

const TONES = {
  checking: {
    box: 'border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900',
    title: 'Checking with the issuer',
    icon: Loader2,
    iconClass: 'animate-spin text-pink-500',
  },
  verified: {
    box: 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30',
    title: 'Certificate confirmed',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
  },
  needs_review: {
    box: 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30',
    title: 'We’ll review this by hand',
    icon: AlertTriangle,
    iconClass: 'text-amber-600',
  },
  failed: {
    box: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
    title: 'Not verified',
    icon: XCircle,
    iconClass: 'text-red-600',
  },
  voided: {
    box: 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30',
    title: 'Certificate voided',
    icon: ShieldAlert,
    iconClass: 'text-red-600',
  },
} as const;

const FALLBACK: CertificateSourceCheck = {
  outcome: 'checking',
  provider: null,
  holderName: null,
  nameMatches: null,
  message: "We're checking this certificate with its issuer.",
  checkedAt: null,
};

/** Where the certificate stands, in one sentence, plus what is left: source → skills → assessment. */
export function CertificateSourceCheckCard({
  certificate,
  children,
}: {
  certificate: CandidateCertificateDto;
  /** The next action for this state (retry, add a link, ask someone to vouch…). */
  children?: React.ReactNode;
}) {
  const check = certificate.sourceCheck ?? FALLBACK;
  const voided = certificate.status === 'VOIDED' || certificate.sourceStatus === 'voided';
  const tone = TONES[voided ? 'voided' : check.outcome];
  const Icon = tone.icon;
  const message = voided
    ? 'A HireKiwi administrator voided this certificate. It can no longer be edited or re-verified.'
    : check.message;

  return (
    <motion.section
      key={voided ? 'voided' : check.outcome}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`rounded-xl border p-4 ${tone.box}`}
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 ${tone.iconClass}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white">
            {tone.title}
            {check.provider && check.outcome !== 'checking' && !voided ? (
              <span className="font-normal text-zinc-500"> · {check.provider}</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">{message}</p>
          {children ? <div className="mt-3 flex flex-wrap gap-2">{children}</div> : null}
        </div>
      </div>
      {voided || check.outcome === 'failed' ? null : <Progress certificate={certificate} />}
    </motion.section>
  );
}

function Progress({ certificate }: { certificate: CandidateCertificateDto }) {
  const sourceDone = certificate.sourceStatus === 'source_verified';
  const skillsDone =
    certificate.skills.length > 0 &&
    Boolean(certificate.learningDescription) &&
    certificate.practicalApplied !== null;
  const assessed = certificate.status === 'VERIFIED';
  const steps: [string, boolean][] = [
    ['Source check', sourceDone],
    ['What you learned', skillsDone],
    ['Assessment', assessed],
  ];
  return (
    <ol className="mt-4 flex items-center gap-2 border-t border-black/5 pt-3 text-xs dark:border-white/10">
      {steps.map(([label, done], index) => (
        <li key={label} className="flex items-center gap-2">
          {index > 0 ? (
            <span className="h-px w-4 bg-zinc-300 dark:bg-zinc-700" aria-hidden />
          ) : null}
          <span
            className={`flex size-4 items-center justify-center rounded-full ${
              done
                ? 'bg-emerald-500 text-white'
                : 'border border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
            }`}
            aria-hidden
          >
            {done ? <Check className="size-3" strokeWidth={3} /> : null}
          </span>
          <span className={done ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-500'}>
            {label}
            <span className="sr-only">{done ? ' (done)' : ' (to do)'}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
