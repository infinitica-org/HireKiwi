import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  ALL_RATE_LIMIT_POLICIES,
  API_PREFIX,
  SetRateLimitOverrideRequestSchema,
  UuidSchema,
  type ListRateLimitPoliciesResponse,
  type RateLimitOverrideDto,
  type RateLimitPolicyItemDto,
} from '@smart/contracts';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { RequestUser } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.decorator.js';
import { AuditPublisherService } from '../../platform/audit/audit-publisher.service.js';
import { RedisService } from '../../platform/redis/redis.service.js';

@ApiTags('admin-rate-limits')
@Controller(`${API_PREFIX}/admin/rate-limits`)
@Roles('SUPER_ADMIN')
export class RateLimitAdminController {
  constructor(
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(AuditPublisherService) private readonly auditPublisher: AuditPublisherService,
  ) {}

  @Get('policies')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List rate limit policies and active institutional overrides.' })
  async listPolicies(
    @Query('institutionId') institutionId?: string,
  ): Promise<ListRateLimitPoliciesResponse> {
    const validInstId =
      typeof institutionId === 'string' && institutionId.trim()
        ? UuidSchema.safeParse(institutionId.trim()).data
        : undefined;

    const overrides: RateLimitOverrideDto[] = [];
    const policyItems: RateLimitPolicyItemDto[] = [];

    for (const policy of ALL_RATE_LIMIT_POLICIES) {
      let activeOverride: RateLimitOverrideDto | null = null;
      if (validInstId) {
        const raw = await this.redis.get(`rl:override:${validInstId}:${policy.key}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            activeOverride = parsed;
            overrides.push(parsed);
          } catch {
            // ignore malformed override
          }
        }
      }

      policyItems.push({
        key: policy.key,
        scope: policy.scope,
        limit: policy.limit,
        windowSeconds: policy.windowSeconds,
        burst: policy.burst,
        rationale: policy.rationale,
        activeOverride,
      });
    }

    return {
      policies: policyItems,
      overrides,
    };
  }

  @Put('overrides/:institutionId/:policyKey')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set or update an institutional rate-limit override in Redis.' })
  async setOverride(
    @CurrentUser() user: RequestUser,
    @Param('institutionId') rawInstId: string,
    @Param('policyKey') rawPolicyKey: string,
    @Body() body: unknown,
  ): Promise<RateLimitOverrideDto> {
    const institutionId = UuidSchema.parse(rawInstId);
    const policy = ALL_RATE_LIMIT_POLICIES.find((p) => p.key === rawPolicyKey);
    if (!policy) {
      throw new NotFoundException({
        error: 'policy_not_found',
        message: `Rate limit policy "${rawPolicyKey}" is not registered.`,
      });
    }

    const parsed = SetRateLimitOverrideRequestSchema.parse(body);

    const override: RateLimitOverrideDto = {
      institutionId,
      policyKey: policy.key,
      limit: parsed.limit,
      burst: parsed.burst ?? policy.burst,
      windowSeconds: parsed.windowSeconds ?? policy.windowSeconds,
      reason: parsed.reason,
      updatedBy: user.sub,
      updatedAt: new Date().toISOString(),
    };

    await this.redis.set(`rl:override:${institutionId}:${policy.key}`, JSON.stringify(override));

    await this.auditPublisher.record({
      action: 'rate_limit.override_set',
      actorId: user.sub,
      resourceType: 'RateLimitOverride',
      resourceId: `${institutionId}:${policy.key}`,
      reasonCode: parsed.reason,
      metadata: {
        institutionId,
        policyKey: policy.key,
        limit: override.limit,
        burst: override.burst,
        windowSeconds: override.windowSeconds,
      },
    });

    return override;
  }

  @Delete('overrides/:institutionId/:policyKey')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete/reset an institutional rate-limit override back to static default.',
  })
  async deleteOverride(
    @CurrentUser() user: RequestUser,
    @Param('institutionId') rawInstId: string,
    @Param('policyKey') rawPolicyKey: string,
  ): Promise<{ success: boolean }> {
    const institutionId = UuidSchema.parse(rawInstId);
    const policy = ALL_RATE_LIMIT_POLICIES.find((p) => p.key === rawPolicyKey);
    if (!policy) {
      throw new NotFoundException({
        error: 'policy_not_found',
        message: `Rate limit policy "${rawPolicyKey}" is not registered.`,
      });
    }

    await this.redis.del(`rl:override:${institutionId}:${policy.key}`);

    await this.auditPublisher.record({
      action: 'rate_limit.override_deleted',
      actorId: user.sub,
      resourceType: 'RateLimitOverride',
      resourceId: `${institutionId}:${policy.key}`,
      reasonCode: 'Override removed by admin',
      metadata: {
        institutionId,
        policyKey: policy.key,
      },
    });

    return { success: true };
  }
}
