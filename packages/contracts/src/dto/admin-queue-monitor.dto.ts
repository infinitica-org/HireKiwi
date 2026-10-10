import { z } from 'zod';

/**
 * Universal BullMQ queue viewer — one snapshot row per registered queue (DLQs included),
 * backed by `QueueMetricsCollector`'s existing 15s poll. Lets an admin see backlog/failure
 * depth across every async pipeline (verification, grading, PDF generation, ...) in one place.
 */
export const QueueJobCountsSchema = z.object({
  waiting: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  delayed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});
export type QueueJobCounts = z.infer<typeof QueueJobCountsSchema>;

export const QueueSnapshotDtoSchema = z.object({
  queue: z.string(),
  counts: QueueJobCountsSchema,
  oldestWaitingSeconds: z.number().nonnegative(),
});
export type QueueSnapshotDto = z.infer<typeof QueueSnapshotDtoSchema>;

export const ListQueueSnapshotsResponseSchema = z.object({
  queues: z.array(QueueSnapshotDtoSchema),
});
export type ListQueueSnapshotsResponse = z.infer<typeof ListQueueSnapshotsResponseSchema>;
