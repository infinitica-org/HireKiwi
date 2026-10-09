import { Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import {
  API_PREFIX,
  AdminCertificateReviewRequestSchema,
  BulkReVerifyCertificatesRequestSchema,
} from '@hirekiwi/contracts';
import { Roles } from '../../common/guards/roles.decorator.js';
import { CandidateCertificatesService } from './candidate-certificates.service.js';

@Controller(`${API_PREFIX}/admin/candidate-certificates`)
@Roles('SUPER_ADMIN')
export class CandidateCertificatesAdminController {
  constructor(
    @Inject(CandidateCertificatesService)
    private readonly candidateCertificatesService: CandidateCertificatesService,
  ) {}

  @Get('queue')
  listQueue() {
    return this.candidateCertificatesService.listVerificationQueue();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: unknown) {
    const parsed = AdminCertificateReviewRequestSchema.parse(body ?? {});
    return this.candidateCertificatesService.adminApprove(id, parsed);
  }

  /** Forces a fresh async verification run for a certificate stuck in the queue. */
  @Post(':id/reverify')
  reVerify(@Param('id') id: string) {
    return this.candidateCertificatesService.reVerify(id);
  }

  /** Full Tier 1/2/3 attempt history — what actually happened on each (re)verification run. */
  @Get(':id/events')
  listEvents(@Param('id') id: string) {
    return this.candidateCertificatesService.adminListEvents(id);
  }

  @Post('reverify-bulk')
  bulkReVerify(@Body() body: unknown) {
    const parsed = BulkReVerifyCertificatesRequestSchema.parse(body ?? {});
    return this.candidateCertificatesService.bulkReVerify(parsed.certificateIds);
  }

  // POST :id/void lives on CandidateCertificateVoidAdminController (SA-T08) —
  // audited, actor-tracked. This route collided with it (same path/method)
  // and crashed Fastify route registration (FST_ERR_DUPLICATED_ROUTE).
}
