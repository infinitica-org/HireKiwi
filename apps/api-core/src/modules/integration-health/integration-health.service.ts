import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IntegrationHealth, IntegrationHealthResponse } from '@hirekiwi/contracts';
import { integrationProbeDuration, integrationUp } from '@hirekiwi/observability';
import { env } from '../../platform/config/env.js';
import { KafkaService } from '../../platform/kafka/kafka.service.js';
import { SmtpService } from '../../platform/mailer/smtp.service.js';
import { StorageService } from '../../platform/storage/storage.service.js';
import { AnthropicAdapter } from '../ai-gateway/adapters/anthropic.adapter.js';
import { GoogleAdapter } from '../ai-gateway/adapters/google.adapter.js';
import { OpenRouterAdapter } from '../ai-gateway/adapters/openrouter.adapter.js';

const PROBE_INTERVAL_MS = 60_000;
const PROBE_TIMEOUT_MS = 10_000;

/** `false` = configured and down; `null` = not configured here (never alerted on). */
type ProbeOutcome = { up: boolean | null; message?: string };
type Probe = () => Promise<ProbeOutcome>;

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('probe timed out')), PROBE_TIMEOUT_MS).unref(),
    ),
  ]);
}

/**
 * S6-VV-129 (#585): `/ready` only checks Postgres and Redis, so an expired AI key, a dead SMTP
 * relay or an unreachable object store went unnoticed until users hit it. This probes each
 * third-party dependency once a minute with its cheapest call, exports
 * `smart_integration_up{integration}` (configured integrations only) and keeps the last result
 * for `GET /admin/health/integrations`. `/ready` deliberately stays Postgres + Redis, so a
 * third-party outage never takes the API out of rotation.
 */
@Injectable()
export class IntegrationHealthService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IntegrationHealthService.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly latest = new Map<string, IntegrationHealth>();
  private readonly probes: Record<string, Probe>;

  constructor(
    @Inject(StorageService) storage: StorageService,
    @Inject(SmtpService) smtp: SmtpService,
    @Inject(KafkaService) kafka: KafkaService,
    @Inject(AnthropicAdapter) anthropic: AnthropicAdapter,
    @Inject(GoogleAdapter) google: GoogleAdapter,
    @Inject(OpenRouterAdapter) openrouter: OpenRouterAdapter,
  ) {
    const ai =
      (adapter: AnthropicAdapter | GoogleAdapter | OpenRouterAdapter): Probe =>
      async () => {
        const health = await adapter.checkHealth();
        if (!health.reachable && /not configured/i.test(health.message ?? '')) {
          return { up: null, message: health.message };
        }
        return { up: health.reachable, message: health.message };
      };
    this.probes = {
      object_storage: async () => ({ up: await storage.isReachable() }),
      smtp: async () => ({ up: await smtp.verifyConnection() }),
      kafka: async () => ({ up: await kafka.ensureConnected() }),
      ai_anthropic: ai(anthropic),
      ai_google: ai(google),
      ai_openrouter: ai(openrouter),
      github: async () => {
        const res = await fetch('https://api.github.com/rate_limit', {
          headers: { 'user-agent': 'smart-integration-health' },
        });
        return { up: res.ok, message: res.ok ? undefined : `HTTP ${res.status}` };
      },
    };
  }

  onModuleInit(): void {
    if (env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.probeAll(), PROBE_INTERVAL_MS);
    this.timer.unref();
    void this.probeAll();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  snapshot(): IntegrationHealthResponse {
    return {
      integrations: Object.keys(this.probes).map(
        (integration) =>
          this.latest.get(integration) ?? {
            integration,
            status: 'NOT_CONFIGURED',
            latencyMs: null,
            message: 'Not probed yet.',
            checkedAt: null,
          },
      ),
    };
  }

  async probeAll(): Promise<void> {
    await Promise.all(Object.keys(this.probes).map((name) => this.probeOne(name)));
  }

  private async probeOne(integration: string): Promise<void> {
    const probe = this.probes[integration];
    if (!probe) return;
    const startedAt = performance.now();
    let outcome: ProbeOutcome;
    try {
      outcome = await withTimeout(probe());
    } catch (error) {
      outcome = { up: false, message: error instanceof Error ? error.message : 'probe failed' };
    }
    const seconds = (performance.now() - startedAt) / 1000;
    if (outcome.up === null) {
      integrationUp.remove({ integration });
    } else {
      integrationUp.set({ integration }, outcome.up ? 1 : 0);
      integrationProbeDuration.observe({ integration }, seconds);
      if (!outcome.up)
        this.logger.warn(`Integration ${integration} is down: ${outcome.message ?? ''}`);
    }
    this.latest.set(integration, {
      integration,
      status: outcome.up === null ? 'NOT_CONFIGURED' : outcome.up ? 'UP' : 'DOWN',
      latencyMs: outcome.up === null ? null : Math.round(seconds * 1000),
      message: outcome.message ?? null,
      checkedAt: new Date().toISOString(),
    });
  }
}
