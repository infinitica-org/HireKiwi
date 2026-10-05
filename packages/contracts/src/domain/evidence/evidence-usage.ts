import type { EvidenceType } from './enums.js';

/**
 * S6-VV-114 (#550, SEC-01): what SMART does with each kind of evidence, in the words the student
 * sees next to every add/connect flow and in Settings. Kept in contracts so the web renders it
 * without a round trip, and typed as a full `Record` so adding an `EvidenceType` without an
 * explanation fails to compile (and the spec).
 *
 * Keep `retainedFor` in step with the retention policies (S6-VV-118) and the erasure flow
 * (S6-VV-117): evidence has no fixed expiry; it lives until the student removes it or their
 * account is erased.
 */
export interface EvidenceUsage {
  /** Short label for the evidence type. */
  readonly label: string;
  /** What it feeds: verification, skill inference, readiness, matching. */
  readonly usedFor: string;
  /** Who can see it. */
  readonly visibleTo: string;
  readonly retainedFor: string;
  /** How the student takes it back. */
  readonly canWithdraw: string;
}

const PROFILE_AUDIENCE =
  'You, your placement cell, and employers who can see your profile (you can hide your profile from employers in Settings).';
const UNTIL_REMOVED = 'Until you remove it, or until your account is erased.';
const DELETION_REQUEST =
  'Ask for it to be deleted with a data request in Settings; skills that relied on it are recalculated.';

export const EVIDENCE_USAGE: Readonly<Record<EvidenceType, EvidenceUsage>> = {
  WORK_EXPERIENCE: {
    label: 'Work experience',
    usedFor:
      'Confirmed with the employer or manager you name, then used to infer the skills you list and your readiness score.',
    visibleTo: PROFILE_AUDIENCE,
    retainedFor: UNTIL_REMOVED,
    canWithdraw:
      'Yes. Delete it from your profile at any time; skills inferred from it are recalculated.',
  },
  PROJECT: {
    label: 'Projects',
    usedFor:
      'Reviewed, and assessed when you defend it, to infer the skills it demonstrates and your readiness score.',
    visibleTo: PROFILE_AUDIENCE,
    retainedFor: UNTIL_REMOVED,
    canWithdraw: DELETION_REQUEST,
  },
  CREDENTIAL: {
    label: 'Certificates and credentials',
    usedFor:
      'Checked with the issuer where possible, then used as supporting evidence for the matching skills.',
    visibleTo: PROFILE_AUDIENCE,
    retainedFor: UNTIL_REMOVED,
    canWithdraw: DELETION_REQUEST,
  },
  PASSIVE_SIGNAL: {
    label: 'Connected accounts (for example GitHub)',
    usedFor: 'Public activity from accounts you connect is read to support the skills you claim.',
    visibleTo:
      'You and your placement cell. Employers see the skills it supports, not the raw activity.',
    retainedFor: 'Until you disconnect the account, or until your account is erased.',
    canWithdraw: 'Yes. Disconnect the account; we stop reading it and its signals no longer count.',
  },
  ASSESSMENT: {
    label: 'Skill assessments',
    usedFor:
      'Your answers are scored to verify the skill you claimed. Integrity checks during the attempt help keep results fair.',
    visibleTo: PROFILE_AUDIENCE,
    retainedFor: 'Results and the integrity events behind them stay until your account is erased.',
    canWithdraw:
      'A completed result stays on record so verified scores stay trustworthy; you can retake where the retake policy allows, or ask for erasure in Settings.',
  },
  INTERVIEW: {
    label: 'Interview feedback',
    usedFor:
      'Feedback recorded by an employer you interviewed with, used as evidence for the skills it assessed.',
    visibleTo: 'You, your placement cell, and the employer who recorded it.',
    retainedFor: UNTIL_REMOVED,
    canWithdraw: DELETION_REQUEST,
  },
  ARTIFACT: {
    label: 'Files and work samples',
    usedFor: 'Supporting material for the evidence it is attached to.',
    visibleTo: 'Whoever can see the evidence it is attached to.',
    retainedFor: 'As long as the evidence it is attached to.',
    canWithdraw: 'Yes. Remove the file, or the evidence it belongs to.',
  },
  SELF_REPORT: {
    label: 'Self-reported details',
    usedFor:
      'Shown as context on your profile. Self-reported details never raise a verified skill level on their own.',
    visibleTo: PROFILE_AUDIENCE,
    retainedFor: UNTIL_REMOVED,
    canWithdraw: 'Yes. Edit or clear them from your profile at any time.',
  },
};
