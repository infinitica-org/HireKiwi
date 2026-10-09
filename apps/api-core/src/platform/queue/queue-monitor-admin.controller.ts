import { Controller, Get, Inject } from '@nestjs/common';
import { API_PREFIX, type ListQueueSnapshotsResponse } from '@hirekiwi/contracts';
import { Roles } from '../../common/guards/roles.decorator.js';
import { QueueMetricsCollector } from './queue-metrics.collector.js';

/** Universal queue viewer — every registered BullMQ queue (DLQs included), one snapshot each. */
@Controller(`${API_PREFIX}/admin/queues`)
@Roles('SUPER_ADMIN')
export class QueueMonitorAdminController {
  constructor(@Inject(QueueMetricsCollector) private readonly metrics: QueueMetricsCollector) {}

  @Get()
  list(): ListQueueSnapshotsResponse {
    return { queues: Array.from(this.metrics.snapshot().values()) };
  }
}
