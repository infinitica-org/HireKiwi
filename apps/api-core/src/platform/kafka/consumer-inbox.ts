import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type InboxOutcome = 'processed' | 'duplicate';

/** `meta.eventId` of a SMART event envelope, or null for payloads that don't carry one. */
export function eventIdOf(payload: unknown): string | null {
  const meta = (payload as { meta?: { eventId?: unknown } } | null)?.meta;
  return typeof meta?.eventId === 'string' && UUID.test(meta.eventId) ? meta.eventId : null;
}

/**
 * S6-VV-123 (#592): the consumer side of at-least-once delivery. The envelope contract says
 * consumers dedupe on `meta.eventId`, but none did, so an outbox re-publish (crash between send
 * and `publishedAt`) or a redelivery after a rebalance re-ran scoring, inference and notifications.
 *
 * A consumer group records each event id it has handled. A repeat is skipped. The marker is
 * written only after the handler succeeds, so a crash mid-handler means the redelivery runs it
 * again: duplicates are bounded to that window, and nothing is lost. A failed handler leaves no
 * marker, so the DLQ copy can still be replayed.
 */
@Injectable()
export class ConsumerInbox {
  private readonly logger = new Logger(ConsumerInbox.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async handle(
    consumerGroup: string,
    payload: unknown,
    run: () => Promise<void>,
  ): Promise<InboxOutcome> {
    const eventId = eventIdOf(payload);
    if (!eventId) {
      await run();
      return 'processed';
    }
    const seen = await this.prisma.consumedEvent.findUnique({
      where: { consumerGroup_eventId: { consumerGroup, eventId } },
      select: { eventId: true },
    });
    if (seen) return 'duplicate';

    await run();
    try {
      await this.prisma.consumedEvent.createMany({
        data: [{ consumerGroup, eventId }],
        skipDuplicates: true,
      });
    } catch (error) {
      // The work is done; failing here would DLQ a handled event and invite a second run on replay.
      this.logger.warn(
        `Could not record ${consumerGroup}/${eventId} as consumed: ${error instanceof Error ? error.message : 'unknown'}`,
      );
    }
    return 'processed';
  }
}
