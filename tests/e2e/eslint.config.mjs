import base from '@hirekiwi/eslint-config/base';

export default [...base, { ignores: ['playwright-report/**', 'test-results/**', 'pipeline/**'] }];
