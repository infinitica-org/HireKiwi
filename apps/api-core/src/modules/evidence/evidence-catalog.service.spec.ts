import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { EvidenceCatalogService } from './evidence-catalog.service.js';

/** A pass-through stand-in: calls the loader directly, no Redis involved. */
const noopCache = { getOrLoad: (_key: string, loader: () => unknown) => loader() } as never;

describe('EvidenceCatalogService', () => {
  it('falls back to contract seed for career domains when db is empty', async () => {
    const prisma = {
      careerDomain: { findMany: vi.fn().mockResolvedValue([]) },
      targetRole: { findMany: vi.fn() },
    };
    const service = new EvidenceCatalogService(prisma as never, noopCache);
    const domains = await service.listCareerDomains();
    expect(domains.some((d) => d.domainId === 'SOFTWARE_IT')).toBe(true);
  });

  it('returns recommended skills for a known target role', () => {
    const service = new EvidenceCatalogService({} as never, noopCache);
    const skills = service.getRecommendedSkills('FULL_STACK_DEVELOPER');
    expect(skills.recommendedSkillIds.length).toBeGreaterThan(0);
  });

  it('throws for unknown target role', () => {
    const service = new EvidenceCatalogService({} as never, noopCache);
    expect(() => service.getRecommendedSkills('UNKNOWN_ROLE')).toThrow(NotFoundException);
  });

  it('returns skill blueprint for taxonomy code', () => {
    const service = new EvidenceCatalogService({} as never, noopCache);
    const blueprint = service.getSkillBlueprint('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
    expect(blueprint.skillCode).toBe('PYTHON_APPLICATION_BACKEND_DEVELOPMENT');
    expect(blueprint.evidenceRequirements.length).toBeGreaterThan(0);
  });
});
