import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { queueJobs, queueOldestWaitingSeconds } from '@smart/observability';
import { env } from '../config/env.js';

const POLL_MS = 15_000;
const STATES = ['waiting', 'active', 'delayed', 'failed'] as const;

/**
 * Queues whose backlog is AI or verification work; `ai-gateway` reports their depth as
 * `queueDepth`, and the "AI processing" dashboard row and alerts read them.
 */
export const AI_PROCESSING_QUEUES = [
  'skill_verify_grade',
  'score_recalculation',
  'credential_verification',
  'audio_evaluation',
  'qlix_poll',
  'jd_parse',
] as const;

export interface QueueSnapshot {
  readonly queue: string;
  readonly counts: Record<(typeof STATES)[number], number>;
  readonly oldestWaitingSeconds: number;
}

/**
 * S6-VV-127 (#579): BullMQ had no metrics at all, so a stalled grading worker or a growing DLQ
 * was invisible. Polls every registered queue (DLQs included) and exports
 * `smart_queue_jobs{queue,state}` and `smart_queue_oldest_waiting_seconds{queue}`.
 */
@Injectable()
export class QueueMetricsCollector implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueMetricsCollector.name);
  private timer: ReturnType<typeof setInterval> | null = null;
  private latest = new Map<string, QueueSnapshot>();

  constructor(
    @Inject(ModuleRef) private readonly moduleRef: ModuleRef,
    @Inject('QUEUE_NAMES') private readonly names: readonly string[],
  ) {}

  onModuleInit(): void {
    if (env.NODE_ENV === 'test') return;
    this.timer = setInterval(() => void this.collect(), POLL_MS);
    this.timer.unref();
    void this.collect();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  /** Last polled state, keyed by queue name (empty until the first poll). */
  snapshot(): ReadonlyMap<string, QueueSnapshot> {
    return this.latest;
  }

  async collect(now = Date.now()): Promise<void> {
    for (const name of this.names) {
      try {
        const queue = this.moduleRef.get<Queue>(getQueueToken(name), { strict: false });
        const counts = (await queue.getJobCounts(...STATES)) as QueueSnapshot['counts'];
        const [oldest] = await queue.getWaiting(0, 0);
        const oldestWaitingSeconds = oldest ? Math.max(0, (now - oldest.timestamp) / 1000) : 0;
        for (const state of STATES) queueJobs.set({ queue: name, state }, counts[state] ?? 0);
        queueOldestWaitingSeconds.set({ queue: name }, oldestWaitingSeconds);
        this.latest.set(name, { queue: name, counts, oldestWaitingSeconds });
      } catch (error) {
        this.logger.warn(
          `Queue metrics for ${name} unavailable: ${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }
  }
}
