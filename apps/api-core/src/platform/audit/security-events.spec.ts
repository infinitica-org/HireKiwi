import { describe, expect, it } from 'vitest';
import { registry } from '@hirekiwi/observability';
import { countSecurityEvent } from './audit-publisher.service.js';

async function count(labels: Record<string, string>): Promise<number> {
  const metric = (await registry.getMetricsAsJSON()).find(
    (m) => m.name === 'hirekiwi_security_events_total',
  );
  return (
    metric?.values.find((v) => Object.entries(labels).every(([k, val]) => v.labels[k] === val))
      ?.value ?? 0
  );
}

describe('security event counter (S6-VV-126)', () => {
  it('counts login failures by their reason code', async () => {
    const before = await count({ action: 'auth.login_failed', reason: 'bad_password' });
    countSecurityEvent('auth.login_failed', 'bad_password');
    countSecurityEvent('auth.login_failed', 'bad_password');
    expect(await count({ action: 'auth.login_failed', reason: 'bad_password' })).toBe(before + 2);
  });

  it('never turns a free-text reason into a label', async () => {
    const before = await count({ action: 'user.role_changed', reason: '' });
    countSecurityEvent('user.role_changed', 'promoted because the TPO lead is on leave');
    expect(await count({ action: 'user.role_changed', reason: '' })).toBe(before + 1);
  });

  it('ignores actions outside the security allowlist', async () => {
    countSecurityEvent('company.profile_updated', null);
    expect(await count({ action: 'company.profile_updated' })).toBe(0);
  });
});
