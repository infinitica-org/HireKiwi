export interface AudienceTabContent {
  id: 'students' | 'universities' | 'employers' | 'accreditation';
  hash: string;
  tabLabel: string;
  headline: string;
  tagline: string;
  benefits: {
    title: string;
    description: string;
  }[];
  cta: {
    label: string;
    actionType: 'signup' | 'demo';
  };
  preview: {
    badge: string;
    title: string;
    subtitle: string;
    highlightMetric?: string;
  };
}

export const AUDIENCE_TABS_CONTENT: AudienceTabContent[] = [
  {
    id: 'students',
    hash: 'students',
    tabLabel: 'For Students',
    headline: 'Be known for what you can do.',
    tagline: 'Replace unverified resumes with verifiable capability proof.',
    benefits: [
      {
        title: 'Verified proof over resumes',
        description:
          'Demonstrate role readiness with an authenticated multi-level Tier Trail that companies trust.',
      },
      {
        title: 'Get discovered by top employers',
        description:
          'Skip the black hole of job boards. Verified candidate profiles are actively searched by 1M+ hiring teams.',
      },
      {
        title: 'School-only jobs & advisor support',
        description:
          'Unlock exclusive campus placement openings and direct alignment with your career services team.',
      },
    ],
    cta: {
      label: 'Sign up free',
      actionType: 'signup',
    },
    preview: {
      badge: 'Candidate Evidence Profile',
      title: 'Senior Software Engineer · Level 3',
      subtitle: 'Verified by automated BARS rubric and verified peer review',
      highlightMetric: 'L3 Gold Tier Achieved',
    },
  },
  {
    id: 'universities',
    hash: 'universities',
    tabLabel: 'For Universities & TPOs',
    headline: 'A head start, proven.',
    tagline: 'Cohort readiness analytics that prove student outcomes beyond enrolment.',
    benefits: [
      {
        title: 'Cohort readiness analytics',
        description:
          'Track aggregate skill benchmarks across departments with real-time cohort visibility.',
      },
      {
        title: 'See placement, not just enrolment',
        description:
          'Bridge classroom learning directly into corporate placement pipeline with auditable milestones.',
      },
      {
        title: 'Real placement data for reports',
        description:
          'Export verified institutional metrics for accreditation reviews and stakeholder reporting.',
      },
    ],
    cta: {
      label: 'Book Demo',
      actionType: 'demo',
    },
    preview: {
      badge: 'TPO Placement Analytics',
      title: 'Class of 2026 Readiness Matrix',
      subtitle: '89.4% cohort certified at L2 or above across Engineering & Data',
      highlightMetric: '1,600+ Partner Schools Active',
    },
  },
  {
    id: 'employers',
    hash: 'employers',
    tabLabel: 'For Employers',
    headline: 'Hire less. Hire right.',
    tagline: 'Pre-qualified candidates assessed on role-specific competency grids.',
    benefits: [
      {
        title: 'Slash hiring costs and screening time',
        description:
          'Eliminate hours spent sorting resumes with zero correlation to real on-the-job execution.',
      },
      {
        title: '3× faster time-to-hire',
        description:
          'Directly reach candidates whose skills have already been evaluated and calibrated by industry panels.',
      },
      {
        title: 'Every candidate pre-qualified',
        description:
          'Calibrated readiness scores ensure candidates meet your minimum baseline before the first interview.',
      },
    ],
    cta: {
      label: 'Book Demo',
      actionType: 'demo',
    },
    preview: {
      badge: 'Verified Talent Pipeline',
      title: 'Active Technical Candidates',
      subtitle: 'Zero false positives · 100% verified GitHub & sandbox evidence',
      highlightMetric: '−80% Resume Screening Time',
    },
  },
];
