import { afterEach, describe, expect, it, vi } from 'vitest';
import { registry } from '@hirekiwi/observability';
import { IntegrationHealthService } from './integration-health.service.js';

const aiAdapter = (reachable: boolean, message?: string) => ({
  checkHealth: vi.fn().mockResolvedValue({ reachable, message }),
});

function service(overrides: { storageUp?: boolean; smtp?: () => Promise<boolean> } = {}) {
  return new IntegrationHealthService(
    { isReachable: vi.fn().mockResolvedValue(overrides.storageUp ?? true) } as never,
    { verifyConnection: overrides.smtp ?? vi.fn().mockResolvedValue(true) } as never,
    { ensureConnected: vi.fn().mockResolvedValue(true) } as never,
    aiAdapter(true) as never,
    aiAdapter(false, 'GOOGLE_API_KEY is not configured') as never,
    aiAdapter(false, 'HTTP 401 invalid key') as never,
  );
}

async function up(integration: string): Promise<number | undefined> {
  const metric = (await registry.getMetricsAsJSON()).find(
    (m) => m.name === 'hirekiwi_integration_up',
  );
  return metric?.values.find((v) => v.labels.integration === integration)?.value;
}

describe('IntegrationHealthService (S6-VV-129)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reports each integration as UP, DOWN or NOT_CONFIGURED and exports configured ones', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    const health = service({ storageUp: false });
    await health.probeAll();

    const status = Object.fromEntries(
      health.snapshot().integrations.map((i) => [i.integration, i.status]),
    );
    expect(status).toEqual({
      object_storage: 'DOWN',
      smtp: 'UP',
      kafka: 'UP',
      ai_anthropic: 'UP',
      ai_google: 'NOT_CONFIGURED',
      ai_openrouter: 'DOWN',
      github: 'UP',
    });
    expect(await up('object_storage')).toBe(0);
    expect(await up('ai_anthropic')).toBe(1);
    // An unconfigured provider is not a failure, so it has no series to alert on.
    expect(await up('ai_google')).toBeUndefined();
  });

  it('counts a probe that throws as DOWN with its message, without stopping the others', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')));
    const health = service({ smtp: vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) });
    await health.probeAll();

    const byName = new Map(health.snapshot().integrations.map((i) => [i.integration, i]));
    expect(byName.get('smtp')).toMatchObject({ status: 'DOWN', message: 'ECONNREFUSED' });
    expect(byName.get('github')).toMatchObject({
      status: 'DOWN',
      message: 'getaddrinfo ENOTFOUND',
    });
    expect(byName.get('kafka')?.status).toBe('UP');
  });
});
