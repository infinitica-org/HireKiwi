import type { NextConfig } from 'next';
import { withSmartConfig } from '@smart/next-config';

const config: NextConfig = {
  // Public profile by claimed username: /@ada renders the candidate page, which resolves
  // "@ada" to the username (the API strips the leading @).
  async rewrites() {
    return [{ source: '/:handle(@[A-Za-z0-9_]{3,30})', destination: '/candidate/:handle' }];
  },
};

export default withSmartConfig(config);
