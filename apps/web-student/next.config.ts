import type { NextConfig } from 'next';
import { withSmartConfig } from '@hirekiwi/next-config';

/** Pages that moved from the site root to /student/… — old links keep working via redirects. */
const STUDENT_SECTIONS = [
  'applications',
  'assessment',
  'assessments',
  'certificates',
  'dashboard',
  'events',
  'interview',
  'interviews',
  'jobs',
  'matches',
  'messages',
  'opportunities',
  'profile',
  'public-profile',
  'readiness',
  'settings',
  'skills',
  'trust-notices',
];

const VERIFY_URL = process.env.NEXT_PUBLIC_VERIFY_URL ?? 'http://localhost:3004';

const config: NextConfig = {
  async redirects() {
    return [
      // Public profiles live on the verify app; /@username here forwards there.
      {
        source: '/:handle(@[A-Za-z0-9_]{3,30})',
        destination: `${VERIFY_URL}/:handle`,
        permanent: false,
      },
      ...STUDENT_SECTIONS.flatMap((section) => [
        { source: `/${section}`, destination: `/student/${section}`, permanent: false },
        {
          source: `/${section}/:path*`,
          destination: `/student/${section}/:path*`,
          permanent: false,
        },
      ]),
    ];
  },
};

export default withSmartConfig(config);
