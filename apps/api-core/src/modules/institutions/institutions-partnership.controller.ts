import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import {
  API_PREFIX,
  ActivatePartnershipAccountRequestSchema,
  CreatePartnershipRequestSchema,
} from '@hirekiwi/contracts';
import { Public } from '../../common/guards/public.decorator.js';
import { InstitutionsService } from './institutions.service.js';

@Controller(`${API_PREFIX}/partnerships`)
export class InstitutionsPartnershipController {
  constructor(@Inject(InstitutionsService) private readonly institutions: InstitutionsService) {}

  @Public()
  @Post('requests')
  createPartnershipRequest(@Body() body: unknown) {
    return this.institutions.createPartnershipRequest(CreatePartnershipRequestSchema.parse(body));
  }

  @Public()
  @Get('requests/:id/decision')
  getPartnershipDecision(@Param('id') id: string) {
    return this.institutions.getPartnershipDecision(id);
  }

  @Public()
  @Get('activate/token-details')
  getActivationTokenDetails(@Query('token') token: string) {
    return this.institutions.getActivationTokenDetails(token);
  }

  @Public()
  @Post('activate')
  activatePartnershipAccount(@Body() body: unknown, @Req() request: FastifyRequest) {
    const parsed = ActivatePartnershipAccountRequestSchema.parse(body);
    const ip = request.ip || (request.headers?.['x-forwarded-for'] as string) || '127.0.0.1';
    return this.institutions.activatePartnershipAccount(parsed, ip);
  }
}
