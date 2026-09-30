/**
 * Plain-language mapping for the STUDENT UI only (skills card + level panel).
 * Deliberate asymmetry: employer/TPO surfaces keep the raw technical labels
 * (basis, confidence enums, rule/veto IDs) — that copy is intentionally
 * unchanged. Flag this split in the ticket description before review.
 */

type ReplaceFn = (substring: string, ...args: string[]) => string;
type Rule = [RegExp, string | ReplaceFn];

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const SURENESS: Record<string, string> = {
  low: 'not very sure yet',
  medium: 'fairly sure',
  high: 'very sure',
};

function sureness(confidence: string): string {
  return SURENESS[confidence.trim().toLowerCase()] ?? 'fairly sure';
}

function statusWords(status: string): string {
  const map: Record<string, string> = {
    NOT_TESTED: 'not tested yet',
    NOT_DEMONSTRATED: 'not shown yet',
    UNCERTAIN: 'a bit unclear',
    PARTIAL: 'partly there',
    DEMONSTRATED: 'shown clearly',
  };
  return map[status.toUpperCase()] ?? status.toLowerCase().replace(/_/g, ' ');
}

function sourceWords(source: string): string {
  const map: Record<string, string> = {
    assessment: 'skill check',
    project: 'projects',
  };
  return map[source.toLowerCase()] ?? source.toLowerCase();
}

const RULES: Rule[] = [
  // Empty / no-data states
  [
    /no verified, assessed, or inferred level is on file yet\.?/gi,
    "We haven't worked out a level for this skill yet.",
  ],
  [
    /no admissible assessment or project evidence\.?/gi,
    "We don't have any skill checks or projects to go on yet.",
  ],
  [/insufficient evidence to rate confidence\.?/gi, "There's not enough to go on yet."],
  [
    /diagnostic assessment pending — complete verification to unlock level progression\.?/gi,
    'Your skill check is ready when you are — finish it to start leveling up.',
  ],
  [
    /complete a skill verification assessment or link verified project evidence to see why a level applies\.?/gi,
    "Take a skill check or link a project and we'll show you why this is your level.",
  ],
  [
    /add assessment or project evidence for a fuller explanation\.?/gi,
    'Add a skill check or project for the full story.',
  ],

  // Combined internal reason clauses (must run before the single-clause rules)
  [
    /Assessment-only (LOW|MEDIUM|HIGH)\s*[:;]\s*Critical competency NOT_TESTED or NOT_DEMONSTRATED caps at (LOW|MEDIUM|HIGH)/gi,
    (_m, _first, cap) =>
      `some must-have areas still need testing, so we're only ${sureness(cap)} for now`,
  ],
  [
    /Conservative min\([^)]*\)\s*[:;]\s*Critical competency NOT_TESTED or NOT_DEMONSTRATED caps at (LOW|MEDIUM|HIGH)/gi,
    (_m, cap) => `some must-have areas still need testing, so we're only ${sureness(cap)} for now`,
  ],
  [
    /Assessment-only (LOW|MEDIUM|HIGH)\s*[:;]\s*[A-Z]{1,4}-[A-Z0-9]+-\d{2}(?:,\s*[A-Z]{1,4}-[A-Z0-9]+-\d{2})* caps domain at (LOW|MEDIUM|HIGH)/gi,
    (_m, _first, cap) => `some checks on your work kept us from being more than ${sureness(cap)}`,
  ],

  // Whole sentences
  [
    /Verified, assessment, and evidence signals align at ([^.]+)\.?/gi,
    (_m, level) => `Your profile, skill check, and projects all agree at ${sentenceCase(level)}.`,
  ],
  [
    /Assessment and linked project evidence were fused to support\s*([^.]*?)\s*proficiency\.?/gi,
    (_m, level) =>
      level.trim()
        ? `Your skill check and your linked projects together point to ${sentenceCase(level)}.`
        : 'Your skill check and your linked projects together point to a level.',
  ],
  [
    /Assessment results support ([^.]+?)\s*proficiency\.?/gi,
    (_m, level) => `Your skill check points to ${sentenceCase(level)}.`,
  ],
  [
    /This level is based on verified project evidence only \(no completed assessment on file\)\.?/gi,
    "Your linked projects are what this is based on — there's no skill check on file yet.",
  ],
  [
    /Competency assessment supports (\w+) with (\w+) confidence\.?/gi,
    (_m, level, confidence) =>
      `Your skill check points to ${sentenceCase(level)}, and we're ${sureness(confidence)}.`,
  ],
  [
    /Latest assessment supports up to (\w+)\.?/gi,
    (_m, level) => `Your latest skill check points to ${sentenceCase(level)}.`,
  ],
  [
    /Verified on your profile at (\w+)\.?/gi,
    (_m, level) => `Verified on your profile at ${sentenceCase(level)}.`,
  ],
  [
    /Profile shows a verified (\w+) level; assessment or evidence fusion has not added a conflicting signal\.?/gi,
    (_m, level) =>
      `Your profile shows a verified ${sentenceCase(level)} level, and nothing else disagrees.`,
  ],
  [
    /Evidence fusion suggests (\w+) without a verified claim on file\.?/gi,
    (_m, level) =>
      `Your linked projects point to ${sentenceCase(level)}, even though your profile doesn't show it yet.`,
  ],
  [
    /Latest assessment supports a lower level than your verified (\w+) claim\.?/gi,
    (_m, level) =>
      `Your latest skill check points lower than your verified ${sentenceCase(level)} claim.`,
  ],
  [
    /Assessment indicates stronger demonstration than your current verified (\w+) level\.?/gi,
    (_m, level) =>
      `Your latest skill check looks stronger than your verified ${sentenceCase(level)} level.`,
  ],
  [/Your verified claim is (\w+)\.?/gi, (_m, level) => `Your profile says ${sentenceCase(level)}.`],
  [
    /Evidence fusion produced an inferred proficiency separate from your verified claim\.?/gi,
    'Your linked projects suggest a level of their own, separate from your verified claim.',
  ],
  [
    /AI evidence fusion differs from your verified claim — review linked projects and assessment results\.?/gi,
    'Your projects point to a different level than your verified claim — worth a look.',
  ],
  [
    /Evidence fusion aligns with verified diagnostic claim\.?/gi,
    'Your linked projects back up your verified level.',
  ],
  [
    /Verified via multi-source assessment defense\.?/gi,
    'Confirmed across several of your skill checks.',
  ],
  [/demonstrated during diagnostic verification\.?/gi, 'You showed this in your skill check.'],
  [/awaiting verification attempt\.?/gi, 'Waiting on your first skill check.'],

  // Single internal clauses
  [
    /Assessment-only (LOW|MEDIUM|HIGH)/gi,
    (_m, confidence) => `judged from your skill check alone, we're ${sureness(confidence)}`,
  ],
  [
    /Conservative min\(assessment (\w+), project (\w+)\)/gi,
    () => 'taking the more cautious of your skill check and your projects',
  ],
  [
    /Critical competency NOT_TESTED or NOT_DEMONSTRATED caps at (LOW|MEDIUM|HIGH)/gi,
    (_m, cap) => `a few must-have areas still need testing, so we're ${sureness(cap)}`,
  ],
  [
    /[A-Z]{1,4}-[A-Z0-9]+-\d{2}(?:,\s*[A-Z]{1,4}-[A-Z0-9]+-\d{2})* caps domain at (LOW|MEDIUM|HIGH)/gi,
    (_m, cap) => `some checks on your work kept us from being more than ${sureness(cap)}`,
  ],
  [/No inferred domain proficiency/gi, "we can't work out a level from this yet"],
  [
    /\bRule\b\s+[A-Z0-9-]+(?:;\s*vetoes\s+[A-Za-z0-9-]+(?:,[A-Za-z0-9-]+)*)?/g,
    (match) =>
      /vetoes/i.test(match)
        ? 'Some checks on your work kept this at a conservative level.'
        : 'Worked out from your skill check and your projects.',
  ],
  [
    /Status (NOT_TESTED|NOT_DEMONSTRATED|UNCERTAIN|PARTIAL|DEMONSTRATED) from (\w+)\.?/gi,
    (_m, status, source) => `${statusWords(status)} in your ${sourceWords(source)}.`,
  ],
  [/Observed:\s*/gi, ''],

  // Residual internal tokens
  [/\b[RVA]-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/g, ''],
  [/\bNOT_TESTED\b/g, 'not tested yet'],
  [/\bNOT_DEMONSTRATED\b/g, 'not shown yet'],
  [/\bcaps at (LOW|MEDIUM|HIGH)\b/gi, (_m, cap) => `keeps us ${sureness(cap)}`],
  [/admissible/gi, 'usable'],
];

const FALLBACK = "We're still working out the details here.";

// Engine-side phrasing that must never reach the student UI. If any marker
// survives the rules above, this is server jargon we have not mapped yet —
// render a generic fallback instead of leaking raw text through.
// Keep these non-global: `.test()` is stateful on /g regexes.
// TODO: move the mapping server-side (skill-level-explanation.ts) so friendly
// copy ships with the payload; this client guard is the safety net until then.
const INTERNAL_MARKERS: RegExp[] = [
  /\b[A-Z]{2,}(?:_[A-Z0-9]+)+\b/, // SCREAMING_SNAKE: NOT_TESTED, AI_INFERENCE
  /\b[RVA]-[A-Z0-9]+(?:-[A-Z0-9]+)+\b/, // rule/veto IDs: R-ASSESS-PASS-01, V-PLAG-01
  /\b(?:LOW|MEDIUM|HIGH)\b/, // raw confidence enums
  /\b(?:Assessment-only|Conservative min|No inferred domain proficiency|caps (?:at|domain)|evidence fusion|fused|admissible|inferred proficiency)\b/i,
  /\b(?:ruleSetVersion|confidenceReason|contradictionDimensions|clusterConsensus|fusionRule|dimensionKey|corroborationScore)\b/, // leaked internal keys
];

function isInternal(text: string): boolean {
  return INTERNAL_MARKERS.some((marker) => marker.test(text));
}

/** Rewrites server-generated explanation text into plain, user-friendly language. */
export function friendlyExplanation(text: string): string {
  let out = text;
  for (const [pattern, replacement] of RULES) {
    out =
      typeof replacement === 'string'
        ? out.replace(pattern, replacement)
        : out.replace(pattern, replacement);
  }

  out = out
    .replace(/[:;]\s+/g, ' — ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .trim();

  if (!out) return out;
  out = out.charAt(0).toUpperCase() + out.slice(1);
  out = out.replace(
    /([.!?]\s+)([a-z])/g,
    (_m, boundary, letter) => boundary + letter.toUpperCase(),
  );
  if (!/[.!?]$/.test(out)) out += '.';

  // Sentence-level fail-safe: swap only the offending sentence so friendly
  // wording (and any student evidence detail) around it survives.
  const sentences = out.split(/(?<=[.!?])\s+/);
  if (sentences.some((sentence) => isInternal(sentence))) {
    const parts: string[] = [];
    for (const sentence of sentences) {
      const mapped = isInternal(sentence) ? FALLBACK : sentence;
      if (mapped === FALLBACK && parts[parts.length - 1] === FALLBACK) continue;
      parts.push(mapped);
    }
    out = parts.join(' ');
  }
  return out;
}
