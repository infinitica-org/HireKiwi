import type { ReactNode } from 'react';
import { SmartLogo } from '@hirekiwi/ui';

const COPY = {
  student: {
    bg: '#06211c',
    blobA: '#0f766e',
    blobB: '#115e59',
    checkBg: 'bg-[#2dd4bf]/15',
    checkFg: 'text-[#5eead4]',
    headline: (
      <>
        Where proven skill
        <br />
        meets the right offer.
      </>
    ),
    body: 'SMART verifies what students can actually do, so employers hire on evidence and candidates get seen for their work — not just their resume.',
    features: [
      {
        title: 'Evidence over resumes',
        body: 'Skill signals come from real work, not keyword stuffing.',
      },
      {
        title: 'Matched, not buried',
        body: 'Verified employers see you against the roles you actually fit.',
      },
      {
        title: 'No gatekeeping',
        body: 'Apply the moment you qualify — no backchannel required.',
      },
    ],
  },
  company: {
    bg: '#15123a',
    blobA: '#4338ca',
    blobB: '#312e81',
    checkBg: 'bg-[#a5b4fc]/15',
    checkFg: 'text-[#c7d2fe]',
    headline: (
      <>
        Hire on evidence,
        <br />
        not on keywords.
      </>
    ),
    body: 'SMART verifies what candidates can actually do, so you source from a pool that already cleared the bar — before you spend a single interview slot.',
    features: [
      {
        title: 'Verified talent pool',
        body: 'Every profile is backed by real, reviewed work — not a claimed skill list.',
      },
      {
        title: 'End-to-end pipeline',
        body: 'Source, shortlist, and manage your hiring funnel in one place.',
      },
      {
        title: 'Reviewed before you see it',
        body: 'Your company account is verified too, so the pool stays trustworthy both ways.',
      },
    ],
  },
} as const;

type AuthVariant = keyof typeof COPY;

/**
 * Shared split-screen frame for the auth app: a branded story panel on the
 * left, the actual form on the right. Replaces the old plain centered-card
 * look across login/register/company-register — this is most people's first
 * impression of SMART. `variant` swaps the left panel's color and copy
 * between the student and employer framing.
 */
export function AuthSplitShell({
  children,
  variant = 'student',
}: {
  children: ReactNode;
  variant?: AuthVariant;
}) {
  const copy = COPY[variant];

  return (
    <div className="flex min-h-dvh w-full bg-white font-sans text-[#111827]">
      <aside
        className="relative hidden w-[44%] max-w-[560px] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16"
        style={{ backgroundColor: copy.bg }}
      >
        <BackgroundDecor blobA={copy.blobA} blobB={copy.blobB} />

        <div className="relative z-10 [&_img]:brightness-0 [&_img]:invert">
          <SmartLogo tone="on-dark" className="h-8 w-auto" />
        </div>

        <div className="relative z-10 mt-auto">
          <h2 className="text-[1.85rem] font-bold leading-[1.15] tracking-tight text-white xl:text-[2.1rem]">
            {copy.headline}
          </h2>
          <p className="mt-3 max-w-[380px] text-sm leading-relaxed text-white/60">{copy.body}</p>

          <ul className="mt-8 space-y-4">
            {copy.features.map((f) => (
              <li key={f.title} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${copy.checkBg}`}
                >
                  <svg className={`h-3 w-3 ${copy.checkFg}`} viewBox="0 0 24 24" fill="none">
                    <path
                      d="M5 13l4 4L19 7"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs leading-relaxed text-white/50">{f.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-10 text-xs text-white/35">
          © 2026 SMART. All rights reserved.
        </p>
      </aside>

      <main className="flex min-h-dvh w-full flex-1 flex-col">{children}</main>
    </div>
  );
}

function BackgroundDecor({ blobA, blobB }: { blobA: string; blobB: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div
        className="absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl"
        style={{ backgroundColor: blobA, opacity: 0.4 }}
      />
      <div
        className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: blobB, opacity: 0.5 }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        viewBox="0 0 400 800"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="400" height="800" fill="url(#auth-grid)" />
      </svg>
    </div>
  );
}
