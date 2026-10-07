import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CAREER_DOMAINS,
  TARGET_ROLES,
  getSkillBlueprint as resolveSkillBlueprint,
  getSkillDefinition,
  type CareerDomainDto,
  type RecommendedSkillsResponse,
  type SkillBlueprintDto,
  type TargetRoleDto,
} from '@hirekiwi/contracts';
import { ReferenceDataCache } from '../../platform/cache/reference-data-cache.service.js';
import { PrismaService } from '../../platform/prisma/prisma.service.js';

/**
 * S6-VV-130 (#589): both lists are read on nearly every profile and recommendation request,
 * have no admin write path today, and only change on a deploy — a 10 minute TTL is a cache that
 * is wrong for at most 10 minutes after a seed change, not a correctness risk.
 */
const CATALOG_TTL_SECONDS = 10 * 60;

@Injectable()
export class EvidenceCatalogService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ReferenceDataCache) private readonly cache: ReferenceDataCache,
  ) {}

  async listCareerDomains(): Promise<CareerDomainDto[]> {
    return this.cache.getOrLoad('all', () => this.loadCareerDomains(), {
      namespace: 'career_domains',
      ttlSeconds: CATALOG_TTL_SECONDS,
    });
  }

  private async loadCareerDomains(): Promise<CareerDomainDto[]> {
    try {
      const rows = await this.prisma.careerDomain.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
      });
      if (rows.length > 0) {
        return rows.map((row) => ({
          domainId: row.code,
          name: row.name,
          description: row.description ?? undefined,
          skillIds: row.skillCodes,
          roleIds: row.roleCodes,
        }));
      }
    } catch {
      // fall through to contract seed
    }
    return [...CAREER_DOMAINS];
  }

  async listTargetRoles(domainId?: string): Promise<TargetRoleDto[]> {
    return this.cache.getOrLoad(domainId ?? 'all', () => this.loadTargetRoles(domainId), {
      namespace: 'target_roles',
      ttlSeconds: CATALOG_TTL_SECONDS,
    });
  }

  private async loadTargetRoles(domainId?: string): Promise<TargetRoleDto[]> {
    try {
      const rows = await this.prisma.targetRole.findMany({
        where: {
          active: true,
          ...(domainId ? { careerDomain: { code: domainId } } : {}),
        },
        include: { careerDomain: true },
        orderBy: { name: 'asc' },
      });
      if (rows.length > 0) {
        return rows.map((row) => ({
          roleId: row.code,
          name: row.name,
          domainId: row.careerDomain.code,
          recommendedSkillIds: row.recommendedSkillCodes,
          optionalSkillIds: row.optionalSkillCodes,
        }));
      }
    } catch {
      // fall through
    }
    return TARGET_ROLES.filter((role) => !domainId || role.domainId === domainId);
  }

  getRecommendedSkills(roleId: string): RecommendedSkillsResponse {
    const role = TARGET_ROLES.find((entry) => entry.roleId === roleId);
    if (!role) {
      throw new NotFoundException({
        error: 'not_found',
        message: `Unknown target role ${roleId}.`,
        statusCode: 404,
      });
    }
    return {
      targetRoleId: role.roleId,
      recommendedSkillIds: [...role.recommendedSkillIds],
      optionalSkillIds: [...role.optionalSkillIds],
    };
  }

  getSkillBlueprint(skillCode: string): SkillBlueprintDto {
    const definition = getSkillDefinition(skillCode);
    if (!definition) {
      throw new NotFoundException({
        error: 'not_found',
        message: `Unknown skill code ${skillCode}.`,
        statusCode: 404,
      });
    }
    const blueprint = resolveSkillBlueprint(skillCode);
    if (!blueprint) {
      throw new NotFoundException({
        error: 'not_found',
        message: `No competency blueprint for skill ${skillCode}.`,
        statusCode: 404,
      });
    }
    return blueprint;
  }
}
