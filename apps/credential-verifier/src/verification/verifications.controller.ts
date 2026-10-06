import { BadRequestException, Body, Controller, Get, Inject, Param, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { z } from 'zod';
import { VERIFICATION_QUEUE } from '../platform/queue/queue.names.js';
import { VerificationOrchestratorService } from './verification-orchestrator.service.js';
import type { VerificationJobPayload } from './verification.processor.js';

const CreateVerificationRequestSchema = z.object({
  inputType: z.enum([
    'URL',
    'QR_CODE',
    'PDF',
    'IMAGE',
    'JSON_CREDENTIAL',
    'ISSUER_AND_ID',
    'PASTED_TEXT',
  ]),
  value: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

@Controller('api/v1/verifications')
export class VerificationsController {
  constructor(
    @Inject(VerificationOrchestratorService)
    private readonly orchestrator: VerificationOrchestratorService,
    @InjectQueue(VERIFICATION_QUEUE) private readonly queue: Queue<VerificationJobPayload>,
  ) {}

  @Post()
  async create(@Body() body: unknown) {
    const parsed = CreateVerificationRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'validation_failed',
        message: 'A valid inputType and value are required.',
        details: parsed.error.flatten(),
      });
    }

    const result = await this.orchestrator.submit(parsed.data);
    if (result.status !== 'cached') {
      await this.queue.add('verify', { verificationId: result.verificationId });
    }
    return { verificationId: result.verificationId, status: 'PENDING' };
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.orchestrator.getById(id);
  }
}
