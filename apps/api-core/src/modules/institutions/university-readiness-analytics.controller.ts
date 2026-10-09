import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { API_PREFIX, UniversityReadinessAnalyticsQuerySchema } from '@hirekiwi/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { TenantScopeGuard } from '../../common/guards/tenant-scope.guard.js';
import { UniversityReadinessAnalyticsService } from './university-readiness-analytics.service.js';

/** Th6-607 - cohort readiness dashboard for university staff (their own university only). */
@ApiTags('university-analytics')
@ApiBearerAuth()
@Controller(`${API_PREFIX}/tpo/analytics`)
@UseGuards(TenantScopeGuard)
@Roles('PLACEMENT_STAFF', 'INSTITUTION_ADMIN')
export class UniversityReadinessAnalyticsController {
  constructor(
    @Inject(UniversityReadinessAnalyticsService)
    private readonly analytics: UniversityReadinessAnalyticsService,
  ) {}

  @Get('readiness')
  @ApiOperation({
    summary: 'Tier distribution and department x skill-domain heatmap, from an indexed cache.',
  })
  readiness(@CurrentUser() user: RequestUser, @Query() query: Record<string, string | undefined>) {
    return this.analytics.getReadiness(
      user,
      UniversityReadinessAnalyticsQuerySchema.parse(
        Object.fromEntries(Object.entries(query).filter(([, value]) => value)),
      ),
    );
  }
}
