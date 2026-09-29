import { describe, expect, it, vi } from 'vitest';
import { seedTieredSkills, TIERED_SKILL_CATALOG } from './seed-tiered-skills.js';

describe('seedTieredSkills', () => {
  it('contains 948 skills across Tier 1, Tier 2, and Tier 3', () => {
    expect(TIERED_SKILL_CATALOG.length).toBe(948);
    const tier1 = TIERED_SKILL_CATALOG.filter((s) => s.tier === 1);
    const tier2 = TIERED_SKILL_CATALOG.filter((s) => s.tier === 2);
    const tier3 = TIERED_SKILL_CATALOG.filter((s) => s.tier === 3);

    expect(tier1.length).toBe(805);
    expect(tier2.length).toBe(62);
    expect(tier3.length).toBe(81);
  });

  it('has unique skill codes across all entries', () => {
    const codes = TIERED_SKILL_CATALOG.map((s) => s.code);
    const unique = new Set(codes);
    expect(unique.size).toBe(codes.length);
  });

  it('upserts all skills into the prisma client', async () => {
    const upsertFn = vi.fn().mockResolvedValue({});
    const mockPrisma = {
      skill: {
        upsert: upsertFn,
      },
    };

    const result = await seedTieredSkills(mockPrisma);

    expect(result.seeded).toBe(948);
    expect(upsertFn).toHaveBeenCalledTimes(948);
    expect(upsertFn).toHaveBeenCalledWith({
      where: { code: TIERED_SKILL_CATALOG[0].code },
      update: { name: TIERED_SKILL_CATALOG[0].name, domain: 'SOFTWARE_IT', active: true },
      create: {
        code: TIERED_SKILL_CATALOG[0].code,
        name: TIERED_SKILL_CATALOG[0].name,
        domain: 'SOFTWARE_IT',
        active: true,
      },
    });
  });
});
